import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const paymentUploadsDir = path.join(__dirname, '../../data/uploads/payments');
if (!fs.existsSync(paymentUploadsDir)) {
  fs.mkdirSync(paymentUploadsDir, { recursive: true });
}

export function parsePaymentScreenshots(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    if (trimmed.length > 0) {
      return [{
        id: 'legacy_1',
        url: trimmed,
        original_name: path.basename(trimmed),
        notes: '',
        uploaded_at: ''
      }];
    }
  }
  return [];
}

function getCentreFolderName(billId) {
  let folderName = 'general';
  if (billId) {
    try {
      const bill = db.prepare('SELECT centre_short_code, bill_number FROM bills WHERE id = ?').get(billId);
      if (bill) {
        const rawCode = bill.centre_short_code || bill.bill_number;
        if (rawCode) {
          folderName = String(rawCode).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        }
      }
    } catch (e) {
      console.warn('Error resolving folder for bill:', billId, e);
    }
  }
  return folderName;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const billId = req.params.id;
    const folderName = getCentreFolderName(billId);
    const targetDir = path.join(paymentUploadsDir, folderName);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    file.centreFolder = folderName;
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const cleanOrig = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    const timestamp = Date.now();
    const rand = Math.random().toString(36).substring(2, 6);
    const safeName = `payment_${timestamp}_${rand}_${cleanOrig}${ext}`;
    cb(null, safeName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

const router = express.Router();

// List bills with search & pagination
router.get('/', (req, res) => {
  try {
    const { q, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM bills';
    const params = [];

    if (q) {
      query += ` WHERE bill_number LIKE ? OR centre_name LIKE ? OR centre_short_code LIKE ?`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const bills = db.prepare(query).all(...params);
    const countQuery = q 
      ? 'SELECT COUNT(*) as count FROM bills WHERE bill_number LIKE ? OR centre_name LIKE ? OR centre_short_code LIKE ?'
      : 'SELECT COUNT(*) as count FROM bills';
    const totalCount = q ? db.prepare(countQuery).get(`%${q}%`, `%${q}%`, `%${q}%`).count : db.prepare(countQuery).get().count;

    const formattedBills = bills.map((b) => ({
      ...b,
      payment_screenshots: parsePaymentScreenshots(b.payment_screenshot)
    }));

    res.json({ bills: formattedBills, total: totalCount });
  } catch (err) {
    console.error('Error fetching bills:', err);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// Check if a bill with centre_short_code exists
router.get('/check-code/:shortCode', (req, res) => {
  try {
    const sc = String(req.params.shortCode || '').trim();
    if (!sc) return res.json({ exists: false });

    const existing = db.prepare(`
      SELECT id, bill_number, centre_short_code, centre_name, bill_date, total_payable, session, is_joint, category
      FROM bills 
      WHERE centre_short_code = ? OR bill_number = ?
      ORDER BY id DESC LIMIT 1
    `).get(sc, sc);

    if (existing) {
      return res.json({ exists: true, bill: existing });
    }
    return res.json({ exists: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single bill with all its items
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ? ORDER BY level_order ASC').all(id);
    res.json({
      ...bill,
      items,
      payment_screenshots: parsePaymentScreenshots(bill.payment_screenshot)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save or Update bill (record name matches Short Code e.g. "1011" or "1011-W")
router.post('/', (req, res) => {
  try {
    const {
      id, // if editing an existing bill
      action, // 'replace' | 'create_new'
      replace_id, // explicit bill id to replace
      bill_number: customBillNumber,
      bill_date,
      session,
      centre_short_code,
      centre_name,
      principal,
      address,
      phone,
      zone,
      category = 'indian',
      items = [],
      slab_discount_percent = 0,
      extra_less_percent = 0,
      seasonal_discount_percent = 0,
      examiner_fee_note = '',
      examiner_fee_amount = 0,
      registration_fee_rate = 23,
      is_joint = 0,
      joint_id = null,
      joint_data = null
    } = req.body;

    // Calculate totals
    let total_old = 0;
    let total_new = 0;
    let gross_fees = 0;
    let convocation_fees = 0;

    const processedItems = items.map((item, idx) => {
      const old_count = parseInt(item.old_count) || 0;
      const new_count = parseInt(item.new_count) || 0;
      const examinees = old_count + new_count;
      const exam_fee = parseFloat(item.exam_fee) || 0;
      const conv_fee = (zone === 'zone1_ne_wb' || category === 'yoga') ? 0 : (parseFloat(item.convocation_fee) || 0);

      const line_total = examinees * exam_fee;
      const convocation_total = examinees * conv_fee;

      total_old += old_count;
      total_new += new_count;
      gross_fees += line_total;
      convocation_fees += convocation_total;

      return {
        level_name: item.level_name,
        level_order: item.level_order || (idx + 1),
        exam_fee,
        old_count,
        new_count,
        line_total,
        convocation_fee: conv_fee,
        convocation_total
      };
    });

    const total_examinees = req.body.total_examinees !== undefined ? parseInt(req.body.total_examinees) : (total_old + total_new);
    const total_discount_percent = parseFloat(slab_discount_percent) + parseFloat(extra_less_percent) + parseFloat(seasonal_discount_percent);
    
    // Only for Indian bills percentage will exclude All India Churamoni Examination
    let churamoniFees = 0;
    if (category === 'indian') {
      processedItems.forEach(it => {
        if (it.level_name && it.level_name.includes('Churamoni')) {
          churamoniFees += it.line_total;
        }
      });
    }
    const discountable_fees = (category === 'indian') ? Math.max(0, gross_fees - churamoniFees) : gross_fees;
    const discount_amount = req.body.discount_amount !== undefined ? parseFloat(req.body.discount_amount) : ((discountable_fees * total_discount_percent) / 100);
    const fees_after_discount = gross_fees - discount_amount;
    const registration_fees = req.body.registration_fees !== undefined ? parseFloat(req.body.registration_fees) : (total_new * parseFloat(registration_fee_rate));
    const examiner_deduction = parseFloat(examiner_fee_amount) || 0;

    const total_payable = req.body.total_payable !== undefined ? parseFloat(req.body.total_payable) : (fees_after_discount + registration_fees + convocation_fees - examiner_deduction);

    // Bill Number / Record Name strictly matches Centre Short Code e.g. "1011"
    let bill_number = String(customBillNumber || centre_short_code || '1011').trim();
    const serializedJointData = joint_data ? (typeof joint_data === 'string' ? joint_data : JSON.stringify(joint_data)) : null;

    let targetBillId = replace_id || id;

    const tx = db.transaction(() => {
      if (action === 'create_new') {
        // Generate next unique bill number, e.g. "1011 (2)"
        const baseNumber = String(centre_short_code || '1011').trim();
        const existingCount = db.prepare("SELECT COUNT(*) as c FROM bills WHERE centre_short_code = ?").get(baseNumber)?.c || 1;
        let candidate = `${baseNumber} (${existingCount + 1})`;
        let salt = existingCount + 1;
        while (db.prepare('SELECT id FROM bills WHERE bill_number = ?').get(candidate)) {
          salt++;
          candidate = `${baseNumber} (${salt})`;
        }
        bill_number = candidate;

        const result = db.prepare(`
          INSERT INTO bills (
            bill_number, bill_date, session, centre_short_code, centre_name, principal,
            address, phone, zone, category, total_old, total_new, total_examinees,
            gross_fees, slab_discount_percent, seasonal_discount_percent, total_discount_percent,
            discount_amount, fees_after_discount, registration_fees, convocation_fees,
            examiner_fee_note, examiner_fee_amount, total_payable, is_joint, joint_id,
            extra_less_percent, joint_data
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          bill_number, bill_date, session, centre_short_code, centre_name, principal,
          address, phone, zone, category, total_old, total_new, total_examinees,
          gross_fees, slab_discount_percent, seasonal_discount_percent, total_discount_percent,
          discount_amount, fees_after_discount, registration_fees, convocation_fees,
          examiner_fee_note, examiner_deduction, total_payable, is_joint ? 1 : 0, joint_id,
          extra_less_percent, serializedJointData
        );
        targetBillId = result.lastInsertRowid;

      } else if (targetBillId) {
        // UPDATE existing bill
        db.prepare(`
          UPDATE bills SET
            bill_number = ?, bill_date = ?, session = ?, centre_short_code = ?,
            centre_name = ?, principal = ?, address = ?, phone = ?, zone = ?,
            category = ?, total_old = ?, total_new = ?, total_examinees = ?,
            gross_fees = ?, slab_discount_percent = ?, seasonal_discount_percent = ?,
            total_discount_percent = ?, discount_amount = ?, fees_after_discount = ?,
            registration_fees = ?, convocation_fees = ?, examiner_fee_note = ?,
            examiner_fee_amount = ?, total_payable = ?, is_joint = ?, joint_id = ?,
            extra_less_percent = ?, joint_data = ?
          WHERE id = ?
        `).run(
          bill_number, bill_date, session, centre_short_code, centre_name, principal,
          address, phone, zone, category, total_old, total_new, total_examinees,
          gross_fees, slab_discount_percent, seasonal_discount_percent, total_discount_percent,
          discount_amount, fees_after_discount, registration_fees, convocation_fees,
          examiner_fee_note, examiner_deduction, total_payable, is_joint ? 1 : 0, joint_id,
          extra_less_percent, serializedJointData, targetBillId
        );

        db.prepare('DELETE FROM bill_items WHERE bill_id = ?').run(targetBillId);

      } else {
        // Check if bill with same bill_number exists
        const existing = db.prepare('SELECT id FROM bills WHERE bill_number = ?').get(bill_number);
        if (existing) {
          targetBillId = existing.id;
          db.prepare(`
            UPDATE bills SET
              bill_date = ?, session = ?, centre_short_code = ?,
              centre_name = ?, principal = ?, address = ?, phone = ?, zone = ?,
              category = ?, total_old = ?, total_new = ?, total_examinees = ?,
              gross_fees = ?, slab_discount_percent = ?, seasonal_discount_percent = ?,
              total_discount_percent = ?, discount_amount = ?, fees_after_discount = ?,
              registration_fees = ?, convocation_fees = ?, examiner_fee_note = ?,
              examiner_fee_amount = ?, total_payable = ?, is_joint = ?, joint_id = ?,
              extra_less_percent = ?, joint_data = ?
            WHERE id = ?
          `).run(
            bill_date, session, centre_short_code, centre_name, principal,
            address, phone, zone, category, total_old, total_new, total_examinees,
            gross_fees, slab_discount_percent, seasonal_discount_percent, total_discount_percent,
            discount_amount, fees_after_discount, registration_fees, convocation_fees,
            examiner_fee_note, examiner_deduction, total_payable, is_joint ? 1 : 0, joint_id,
            extra_less_percent, serializedJointData, targetBillId
          );
          db.prepare('DELETE FROM bill_items WHERE bill_id = ?').run(targetBillId);
        } else {
          const result = db.prepare(`
            INSERT INTO bills (
              bill_number, bill_date, session, centre_short_code, centre_name, principal,
              address, phone, zone, category, total_old, total_new, total_examinees,
              gross_fees, slab_discount_percent, seasonal_discount_percent, total_discount_percent,
              discount_amount, fees_after_discount, registration_fees, convocation_fees,
              examiner_fee_note, examiner_fee_amount, total_payable, is_joint, joint_id,
              extra_less_percent, joint_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            bill_number, bill_date, session, centre_short_code, centre_name, principal,
            address, phone, zone, category, total_old, total_new, total_examinees,
            gross_fees, slab_discount_percent, seasonal_discount_percent, total_discount_percent,
            discount_amount, fees_after_discount, registration_fees, convocation_fees,
            examiner_fee_note, examiner_deduction, total_payable, is_joint ? 1 : 0, joint_id,
            extra_less_percent, serializedJointData
          );
          targetBillId = result.lastInsertRowid;
        }
      }

      const insertItem = db.prepare(`
        INSERT INTO bill_items (
          bill_id, level_name, level_order, exam_fee, old_count, new_count,
          line_total, convocation_fee, convocation_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of processedItems) {
        insertItem.run(
          targetBillId, item.level_name, item.level_order, item.exam_fee,
          item.old_count, item.new_count, item.line_total,
          item.convocation_fee, item.convocation_total
        );
      }
    });

    tx();

    res.json({
      success: true,
      billId: targetBillId,
      bill_number,
      total_payable
    });
  } catch (err) {
    console.error('Error creating/updating bill:', err);
    res.status(500).json({ error: 'Failed to save bill: ' + err.message });
  }
});

// Upload or add payment screenshots for a bill (saved inside data/uploads/payments/<centre_short_code>/)
router.post('/:id/payment-screenshot', upload.any(), (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const files = req.files || [];

    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    if (files.length === 0 && !notes) {
      return res.status(400).json({ error: 'No image files uploaded or remarks provided' });
    }

    const existingList = parsePaymentScreenshots(bill.payment_screenshot);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const centreFolder = getCentreFolderName(id);

    const newScreenshots = files.map((f, idx) => {
      const folder = f.centreFolder || centreFolder;
      const relativeUrl = `/uploads/payments/${folder}/${f.filename}`;
      return {
        id: `proof_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        url: relativeUrl,
        original_name: f.originalname || f.filename,
        notes: notes || '',
        uploaded_at: now
      };
    });

    const updatedList = [...existingList, ...newScreenshots];
    const updatedJson = JSON.stringify(updatedList);
    const updatedNotes = notes
      ? (bill.payment_notes ? `${bill.payment_notes}; ${notes}` : notes)
      : (bill.payment_notes || '');

    db.prepare(`
      UPDATE bills 
      SET payment_screenshot = ?, payment_notes = ?, payment_uploaded_at = ?
      WHERE id = ?
    `).run(updatedJson, updatedNotes, now, id);

    res.json({
      success: true,
      payment_screenshot: updatedJson,
      payment_screenshots: updatedList,
      payment_notes: updatedNotes,
      payment_uploaded_at: now
    });
  } catch (err) {
    console.error('Error uploading payment screenshot(s):', err);
    res.status(500).json({ error: 'Failed to upload screenshot: ' + err.message });
  }
});

// Delete specific screenshot or all screenshots for a bill
router.delete('/:id/payment-screenshot', (req, res) => {
  try {
    const { id } = req.params;
    const { imageId, url } = req.query;

    const bill = db.prepare('SELECT payment_screenshot, payment_notes FROM bills WHERE id = ?').get(id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const existingList = parsePaymentScreenshots(bill.payment_screenshot);

    if (imageId || url) {
      // Remove specific screenshot
      const remainingList = [];
      for (const item of existingList) {
        if ((imageId && item.id === imageId) || (url && item.url === url)) {
          if (item.url && item.url.startsWith('/uploads/')) {
            const relPath = item.url.replace(/^\/?uploads\//, '');
            const filePath = path.join(__dirname, '../../data/uploads', relPath);
            if (fs.existsSync(filePath)) {
              try { fs.unlinkSync(filePath); } catch (e) {}
            }
          }
        } else {
          remainingList.push(item);
        }
      }

      const updatedJson = remainingList.length > 0 ? JSON.stringify(remainingList) : null;
      db.prepare(`
        UPDATE bills 
        SET payment_screenshot = ?
        WHERE id = ?
      `).run(updatedJson, id);

      return res.json({
        success: true,
        payment_screenshot: updatedJson,
        payment_screenshots: remainingList
      });
    }

    // Delete all screenshots for this bill
    for (const item of existingList) {
      if (item.url && item.url.startsWith('/uploads/')) {
        const relPath = item.url.replace(/^\/?uploads\//, '');
        const filePath = path.join(__dirname, '../../data/uploads', relPath);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
      }
    }

    db.prepare(`
      UPDATE bills 
      SET payment_screenshot = NULL, payment_notes = NULL, payment_uploaded_at = NULL 
      WHERE id = ?
    `).run(id);

    res.json({ success: true, payment_screenshot: null, payment_screenshots: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete bill
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM bills WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
