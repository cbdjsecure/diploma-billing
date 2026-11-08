import express from 'express';
import db from '../database.js';

const router = express.Router();

// Get rate chart for zone + category
router.get('/', (req, res) => {
  try {
    const { zone, category } = req.query;

    if (category === 'yoga') {
      const items = db.prepare(`
        SELECT * FROM rate_charts 
        WHERE category = 'yoga'
        ORDER BY level_order ASC
      `).all();
      return res.json(items);
    }

    if (!zone || !category) {
      const all = db.prepare('SELECT * FROM rate_charts ORDER BY zone, category, level_order ASC').all();
      return res.json(all);
    }

    const items = db.prepare(`
      SELECT * FROM rate_charts 
      WHERE zone = ? AND category = ?
      ORDER BY level_order ASC
    `).all(zone, category);

    res.json(items);
  } catch (err) {
    console.error('Error fetching rates:', err);
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});

// Update an individual rate item
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { exam_fee, convocation_fee } = req.body;

    const stmt = db.prepare(`
      UPDATE rate_charts 
      SET exam_fee = ?, convocation_fee = ?
      WHERE id = ?
    `);

    stmt.run(exam_fee, convocation_fee, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

