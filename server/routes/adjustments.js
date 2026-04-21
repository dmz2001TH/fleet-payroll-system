const router = require('express').Router();
const db = require('../db/connection');

// GET /api/adjustments?period_id= — list adjustments
router.get('/', (req, res) => {
  try {
    let query = `
      SELECT a.*, d.employee_code, d.full_name, d.nickname
      FROM adjustments a
      LEFT JOIN drivers d ON a.driver_id = d.id
    `;
    const params = [];

    if (req.query.period_id) {
      query += ' WHERE a.period_id = ?';
      params.push(req.query.period_id);
    }

    query += ' ORDER BY a.type, d.employee_code';
    const adjustments = db.prepare(query).all(...params);
    res.json(adjustments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/adjustments — add adjustment
router.post('/', (req, res) => {
  try {
    const { period_id, driver_id, type, amount, reason } = req.body;
    if (!period_id || !driver_id || !type || !amount) {
      return res.status(400).json({ error: 'period_id, driver_id, type, and amount are required' });
    }
    if (!['allowance', 'deduction'].includes(type)) {
      return res.status(400).json({ error: 'type must be "allowance" or "deduction"' });
    }

    const result = db.prepare(
      'INSERT INTO adjustments (period_id, driver_id, type, amount, reason) VALUES (?, ?, ?, ?, ?)'
    ).run(period_id, driver_id, type, amount, reason || null);

    // Recalculate summary
    recalculateSummary(period_id, driver_id);

    const adj = db.prepare(`
      SELECT a.*, d.employee_code, d.full_name, d.nickname
      FROM adjustments a LEFT JOIN drivers d ON a.driver_id = d.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(adj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/adjustments/:id — update adjustment
router.put('/:id', (req, res) => {
  try {
    const { type, amount, reason } = req.body;
    const existing = db.prepare('SELECT * FROM adjustments WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Adjustment not found' });

    db.prepare(
      `UPDATE adjustments SET
        type = COALESCE(?, type),
        amount = COALESCE(?, amount),
        reason = COALESCE(?, reason)
      WHERE id = ?`
    ).run(type, amount, reason, req.params.id);

    recalculateSummary(existing.period_id, existing.driver_id);

    const adj = db.prepare(`
      SELECT a.*, d.employee_code, d.full_name, d.nickname
      FROM adjustments a LEFT JOIN drivers d ON a.driver_id = d.id
      WHERE a.id = ?
    `).get(req.params.id);
    res.json(adj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/adjustments/:id — remove adjustment
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM adjustments WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Adjustment not found' });

    db.prepare('DELETE FROM adjustments WHERE id = ?').run(req.params.id);
    recalculateSummary(existing.period_id, existing.driver_id);
    res.json({ message: 'Adjustment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function recalculateSummary(periodId, driverId) {
  const PRICE_TIERS = [400, 440, 470, 500, 530, 550, 650, 700, 750, 830, 870, 1100];

  const trips = db.prepare(
    'SELECT price, COUNT(*) as count FROM trips WHERE period_id = ? AND driver_id = ? GROUP BY price'
  ).all(periodId, driverId);

  const tripCounts = {};
  let totalTrips = 0;
  let totalIncome = 0;
  for (const p of PRICE_TIERS) tripCounts[p] = 0;
  for (const t of trips) {
    tripCounts[t.price] = t.count;
    totalTrips += t.count;
    totalIncome += t.price * t.count;
  }

  const allowances = db.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM adjustments WHERE period_id = ? AND driver_id = ? AND type = 'allowance'"
  ).get(periodId, driverId);

  const deductions = db.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM adjustments WHERE period_id = ? AND driver_id = ? AND type = 'deduction'"
  ).get(periodId, driverId);

  db.prepare(`
    INSERT INTO summaries (period_id, driver_id, trip_counts, total_trips, total_income, total_allowances, total_deductions, net_income)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(period_id, driver_id) DO UPDATE SET
      trip_counts = excluded.trip_counts,
      total_trips = excluded.total_trips,
      total_income = excluded.total_income,
      total_allowances = excluded.total_allowances,
      total_deductions = excluded.total_deductions,
      net_income = excluded.net_income
  `).run(periodId, driverId, JSON.stringify(tripCounts), totalTrips, totalIncome,
    allowances.total, deductions.total, totalIncome + allowances.total - deductions.total);
}

module.exports = router;
