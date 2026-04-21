const router = require('express').Router();
const db = require('../db/connection');

// GET /api/periods — list all periods
router.get('/', (req, res) => {
  try {
    const periods = db.prepare('SELECT * FROM cut_off_periods ORDER BY start_date DESC').all();
    res.json(periods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/periods/:id — get period detail with summary
router.get('/:id', (req, res) => {
  try {
    const period = db.prepare('SELECT * FROM cut_off_periods WHERE id = ?').get(req.params.id);
    if (!period) return res.status(404).json({ error: 'Period not found' });
    res.json(period);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/periods — create new period
router.post('/', (req, res) => {
  try {
    const { start_date, end_date, title } = req.body;
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }
    const result = db.prepare(
      'INSERT INTO cut_off_periods (start_date, end_date, title) VALUES (?, ?, ?)'
    ).run(start_date, end_date, title || null);
    const period = db.prepare('SELECT * FROM cut_off_periods WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(period);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/periods/:id — update period
router.put('/:id', (req, res) => {
  try {
    const { start_date, end_date, title, status } = req.body;
    db.prepare(
      `UPDATE cut_off_periods SET
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        title = COALESCE(?, title),
        status = COALESCE(?, status)
      WHERE id = ?`
    ).run(start_date, end_date, title, status, req.params.id);
    const period = db.prepare('SELECT * FROM cut_off_periods WHERE id = ?').get(req.params.id);
    if (!period) return res.status(404).json({ error: 'Period not found' });
    res.json(period);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/periods/:id — delete period
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM cut_off_periods WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Period not found' });
    res.json({ message: 'Period deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
