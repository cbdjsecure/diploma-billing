import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import db from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * EXACT EXCEL / ZIP EXPORT:
 * 1. Single Bill: Exported strictly as "${short_code}.xlsx" matching original template structure.
 * 2. Joint Bill: Exported strictly as "${short_code}.zip" containing:
 *    "${slab_name} (INDIAN).xlsx", "${slab_name} (WESTERN).xlsx", "${slab_name} (YOGA).xlsx"
 */
router.get('/excel/:billId', (req, res) => {
  try {
    const { billId } = req.params;
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(billId);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ? ORDER BY level_order ASC').all(billId);
    const discountSlabs = db.prepare('SELECT * FROM discount_slabs ORDER BY min_count ASC').all();

    // Determine if bill is joint (handle number, string '1', '1.0', or category 'joint')
    const isJoint = Number(bill.is_joint) === 1 || String(bill.is_joint).trim() === '1.0' || bill.category === 'joint' || Boolean(bill.joint_data);
    const fileExt = isJoint ? 'zip' : 'xlsx';
    const scriptPath = path.join(__dirname, 'export-excel.py');
    const templatePath = path.join(__dirname, '../template.xlsx');
    const outPath = path.join(__dirname, `../../data/temp_export_${billId}_${Date.now()}.${fileExt}`);

    const billPayload = JSON.stringify({ bill, items, templatePath, outPath, discountSlabs });

    const pythonCmd = fs.existsSync('C:/Users/SASWATA/AppData/Local/Python/pythoncore-3.15-64/python.exe')
      ? 'C:/Users/SASWATA/AppData/Local/Python/pythoncore-3.15-64/python.exe'
      : (fs.existsSync('C:/Python315/python.exe') ? 'C:/Python315/python.exe' : 'python');

    const py = execFile(pythonCmd, [scriptPath], (err, stdout, stderr) => {
      if (err) {
        console.error('Python export error:', stderr || err);
        return res.status(500).json({ error: 'Excel export script error: ' + (stderr || err.message) });
      }

      const shortCode = String(bill.centre_short_code || '1011').trim();
      const filename = `${shortCode}.${fileExt}`;

      if (isJoint) {
        res.setHeader('Content-Type', 'application/zip');
      } else {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      res.download(outPath, filename, (downloadErr) => {
        if (downloadErr) {
          console.error('Download error:', downloadErr);
        }
        // Safely remove the generated temp file after sending
        try {
          if (fs.existsSync(outPath)) {
            fs.unlinkSync(outPath);
          }
        } catch (cleanupErr) {
          // ignore cleanup err
        }
      });
    });

    py.stdin.write(billPayload);
    py.stdin.end();

  } catch (err) {
    console.error('Error in export route:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * EXACT EXCEL TEMPLATE TO IMAGE FOR WHATSAPP:
 * Converts range A9 to last active row of the generated Excel template workbook to PNG.
 * Single: Returns 1 image with caption "C-xxxx"
 * Joint: Returns 1 image per discipline with caption "C-xxxx (Indian)", "C-xxxx (Western)", etc.
 */
router.post('/whatsapp-images', (req, res) => {
  try {
    const { billId, bill: clientBill, items: clientItems } = req.body;
    let bill = clientBill;
    let items = clientItems || [];
    const discountSlabs = db.prepare('SELECT * FROM discount_slabs ORDER BY min_count ASC').all();

    if (billId) {
      bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(billId);
      if (!bill) {
        return res.status(404).json({ error: 'Bill not found' });
      }
      items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ? ORDER BY level_order ASC').all(billId);
    }

    if (!bill) {
      return res.status(400).json({ error: 'No bill data provided' });
    }

    const scriptPath = path.join(__dirname, 'export-excel.py');
    const templatePath = path.join(__dirname, '../template.xlsx');

    const payload = JSON.stringify({
      action: 'render_images',
      bill,
      items,
      templatePath,
      discountSlabs
    });

    const pythonCmd = fs.existsSync('C:/Users/SASWATA/AppData/Local/Python/pythoncore-3.15-64/python.exe')
      ? 'C:/Users/SASWATA/AppData/Local/Python/pythoncore-3.15-64/python.exe'
      : (fs.existsSync('C:/Python315/python.exe') ? 'C:/Python315/python.exe' : 'python');

    const py = execFile(pythonCmd, [scriptPath], (err, stdout, stderr) => {
      if (err) {
        console.error('WhatsApp image generation error:', stderr || err);
        return res.status(500).json({ error: 'Failed to render Excel template image: ' + (stderr || err.message) });
      }

      try {
        const result = JSON.parse(stdout.trim());
        return res.json(result);
      } catch (parseErr) {
        console.error('Failed to parse Python image response:', stdout, parseErr);
        return res.status(500).json({ error: 'Invalid response from Excel renderer: ' + stdout });
      }
    });

    py.stdin.write(payload);
    py.stdin.end();

  } catch (err) {
    console.error('Error generating WhatsApp images:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
