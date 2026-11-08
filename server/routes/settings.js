import express from 'express';
import db from '../database.js';

const router = express.Router();

// Get settings
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }

    const slabs = db.prepare('SELECT * FROM discount_slabs ORDER BY min_count ASC').all();
    res.json({ settings, discount_slabs: slabs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings
router.put('/', (req, res) => {
  try {
    const { settings } = req.body;
    if (settings) {
      const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      const tx = db.transaction(() => {
        for (const [key, value] of Object.entries(settings)) {
          stmt.run(key, String(value));
        }
      });
      tx();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update discount slabs
router.put('/slabs', (req, res) => {
  try {
    const { slabs } = req.body;
    if (Array.isArray(slabs)) {
      const tx = db.transaction(() => {
        db.exec('DELETE FROM discount_slabs');
        const insert = db.prepare('INSERT INTO discount_slabs (min_count, max_count, discount_percent) VALUES (?, ?, ?)');
        for (const s of slabs) {
          insert.run(s.min_count, s.max_count ?? null, s.discount_percent);
        }
      });
      tx();
    }
    const updated = db.prepare('SELECT * FROM discount_slabs ORDER BY min_count ASC').all();
    res.json({ success: true, slabs: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

