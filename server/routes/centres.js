import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import db from '../database.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Clear all centres
router.delete('/clear', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM centres').run();
    res.json({ success: true, count: 0, deleted: info.changes });
  } catch (err) {
    console.error('Error clearing centres:', err);
    res.status(500).json({ error: 'Failed to clear centres: ' + err.message });
  }
});

// Upload & Parse Centre Excel Backup File
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No Excel file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const insert = db.prepare(`
      INSERT OR REPLACE INTO centres (
        short_code, centre_code, centre_name, principal,
        phone1, phone2, address, email, whatsapp, full_address,
        created_by, checked_by, sheet_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let totalImported = 0;
    const insertMany = db.transaction((rows) => {
      for (const r of rows) {
        insert.run(
          r.short_code, r.centre_code, r.centre_name, r.principal,
          r.phone1, r.phone2, r.address, r.email, r.whatsapp, r.full_address,
          r.created_by, r.checked_by, r.sheet_type
        );
      }
    });

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (!data || data.length < 2) continue;

      const rowsToInsert = [];

      if (sheetName === 'CENTRE & R CENTRE' || sheetName === 'Previous R Centre' || sheetName === 'International') {
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || !row[0]) continue;

          const short_code = String(row[0] || '').trim();
          if (!short_code) continue;

          rowsToInsert.push({
            short_code,
            centre_code: row[1] ? String(row[1]).trim() : null,
            centre_name: row[2] ? String(row[2]).trim() : null,
            principal: row[3] ? String(row[3]).trim() : null,
            phone1: row[4] ? String(row[4]).trim() : null,
            phone2: row[5] ? String(row[5]).trim() : null,
            address: row[6] ? String(row[6]).trim() : null,
            email: row[7] ? String(row[7]).trim() : null,
            whatsapp: row[8] ? String(row[8]).trim() : null,
            full_address: row[9] ? String(row[9]).trim() : null,
            created_by: row[10] ? String(row[10]).trim() : null,
            checked_by: row[11] ? String(row[11]).trim() : null,
            sheet_type: sheetName
          });
        }
      } else if (sheetName === 'CF Centre') {
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || !row[0]) continue;

          const code = String(row[0]).trim();
          rowsToInsert.push({
            short_code: code,
            centre_code: code,
            centre_name: row[1] ? String(row[1]).trim() : null,
            principal: row[2] ? String(row[2]).trim() : null,
            phone1: row[3] ? String(row[3]).trim() : null,
            phone2: row[4] ? String(row[4]).trim() : null,
            address: row[5] ? String(row[5]).trim() : null,
            email: row[6] ? String(row[6]).trim() : null,
            whatsapp: null,
            full_address: row[5] ? String(row[5]).trim() : null,
            created_by: null,
            checked_by: null,
            sheet_type: sheetName
          });
        }
      } else {
        // Fallback for general sheets
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || !row[0]) continue;
          const code = String(row[0]).trim();
          if (!code) continue;

          rowsToInsert.push({
            short_code: code,
            centre_code: row[1] ? String(row[1]).trim() : code,
            centre_name: row[2] ? String(row[2]).trim() : 'Centre ' + code,
            principal: row[3] ? String(row[3]).trim() : null,
            phone1: row[4] ? String(row[4]).trim() : null,
            phone2: row[5] ? String(row[5]).trim() : null,
            address: row[6] ? String(row[6]).trim() : null,
            email: row[7] ? String(row[7]).trim() : null,
            whatsapp: row[8] ? String(row[8]).trim() : null,
            full_address: row[9] ? String(row[9]).trim() : (row[6] ? String(row[6]).trim() : null),
            created_by: null,
            checked_by: null,
            sheet_type: sheetName
          });
        }
      }

      if (rowsToInsert.length > 0) {
        insertMany(rowsToInsert);
        totalImported += rowsToInsert.length;
      }
    }

    res.json({ success: true, totalImported });
  } catch (err) {
    console.error('Error uploading centres Excel:', err);
    res.status(500).json({ error: 'Failed to import centres: ' + err.message });
  }
});

// Search centres by query (short_code, centre_code, centre_name, principal, address)
router.get('/search', (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json([]);
    }

    const searchPattern = `%${q}%`;
    const stmt = db.prepare(`
      SELECT * FROM centres 
      WHERE short_code LIKE ? 
         OR centre_code LIKE ? 
         OR centre_name LIKE ? 
         OR principal LIKE ? 
         OR address LIKE ?
      LIMIT 30
    `);

    const results = stmt.all(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    res.json(results);
  } catch (err) {
    console.error('Error searching centres:', err);
    res.status(500).json({ error: 'Failed to search centres' });
  }
});

// Get centre by exact short code
router.get('/:shortCode', (req, res) => {
  try {
    const { shortCode } = req.params;
    const stmt = db.prepare('SELECT * FROM centres WHERE short_code = ?');
    const centre = stmt.get(shortCode);

    if (!centre) {
      // Also try with leading zeros / trim
      const fallback = db.prepare('SELECT * FROM centres WHERE TRIM(short_code) = TRIM(?)').get(shortCode);
      if (fallback) return res.json(fallback);
      return res.status(404).json({ error: 'Centre not found' });
    }

    res.json(centre);
  } catch (err) {
    console.error('Error fetching centre:', err);
    res.status(500).json({ error: 'Failed to fetch centre' });
  }
});

// Count total centres
router.get('/meta/count', (req, res) => {
  try {
    const count = db.prepare('SELECT COUNT(*) as total FROM centres').get();
    res.json({ total: count.total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

