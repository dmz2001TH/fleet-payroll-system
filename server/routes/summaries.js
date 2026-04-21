const router = require('express').Router();
const db = require('../db/connection');

// GET /api/summaries/:periodId — get summary for a period (all drivers)
router.get('/:periodId', (req, res) => {
  try {
    const period = db.prepare('SELECT * FROM cut_off_periods WHERE id = ?').get(req.params.periodId);
    if (!period) return res.status(404).json({ error: 'Period not found' });

    const summaries = db.prepare(`
      SELECT s.*, d.employee_code, d.full_name, d.nickname, d.vehicle_plate
      FROM summaries s
      LEFT JOIN drivers d ON s.driver_id = d.id
      WHERE s.period_id = ?
      ORDER BY d.employee_code
    `).all(req.params.periodId);

    // Parse trip_counts JSON
    const parsed = summaries.map(s => ({
      ...s,
      trip_counts: JSON.parse(s.trip_counts || '{}')
    }));

    // Grand totals
    const grandTotal = {
      trips: parsed.reduce((sum, s) => sum + (s.total_trips || 0), 0),
      income: parsed.reduce((sum, s) => sum + (s.total_income || 0), 0),
      allowances: parsed.reduce((sum, s) => sum + (s.total_allowances || 0), 0),
      deductions: parsed.reduce((sum, s) => sum + (s.total_deductions || 0), 0),
      net: parsed.reduce((sum, s) => sum + (s.net_income || 0), 0),
    };

    res.json({ period, summaries: parsed, grandTotal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/summaries/:periodId/:driverId — get summary for specific driver
router.get('/:periodId/:driverId', (req, res) => {
  try {
    const summary = db.prepare(`
      SELECT s.*, d.employee_code, d.full_name, d.nickname, d.vehicle_plate
      FROM summaries s
      LEFT JOIN drivers d ON s.driver_id = d.id
      WHERE s.period_id = ? AND s.driver_id = ?
    `).get(req.params.periodId, req.params.driverId);

    if (!summary) return res.status(404).json({ error: 'Summary not found' });

    // Parse trip_counts and fetch adjustments
    summary.trip_counts = JSON.parse(summary.trip_counts || '{}');

    const adjustments = db.prepare(
      'SELECT * FROM adjustments WHERE period_id = ? AND driver_id = ? ORDER BY type, id'
    ).all(req.params.periodId, req.params.driverId);

    res.json({ ...summary, adjustments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/summaries/:periodId/recalculate — force recalculate
router.post('/:periodId/recalculate', (req, res) => {
  try {
    const period = db.prepare('SELECT * FROM cut_off_periods WHERE id = ?').get(req.params.periodId);
    if (!period) return res.status(404).json({ error: 'Period not found' });

    const PRICE_TIERS = [400, 440, 470, 500, 530, 550, 650, 700, 750, 830, 870, 1100];
    const drivers = db.prepare('SELECT id FROM drivers').all();

    const upsertSummary = db.prepare(`
      INSERT INTO summaries (period_id, driver_id, trip_counts, total_trips, total_income, total_allowances, total_deductions, net_income)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(period_id, driver_id) DO UPDATE SET
        trip_counts = excluded.trip_counts,
        total_trips = excluded.total_trips,
        total_income = excluded.total_income,
        total_allowances = excluded.total_allowances,
        total_deductions = excluded.total_deductions,
        net_income = excluded.net_income
    `);

    const recalc = db.transaction(() => {
      for (const driver of drivers) {
        const trips = db.prepare(
          'SELECT price, COUNT(*) as count FROM trips WHERE period_id = ? AND driver_id = ? GROUP BY price'
        ).all(req.params.periodId, driver.id);

        const tripCounts = {};
        let totalTrips = 0;
        let totalIncome = 0;

        for (const price of PRICE_TIERS) tripCounts[price] = 0;
        for (const t of trips) {
          tripCounts[t.price] = t.count;
          totalTrips += t.count;
          totalIncome += t.price * t.count;
        }

        const allowances = db.prepare(
          "SELECT COALESCE(SUM(amount), 0) as total FROM adjustments WHERE period_id = ? AND driver_id = ? AND type = 'allowance'"
        ).get(req.params.periodId, driver.id);

        const deductions = db.prepare(
          "SELECT COALESCE(SUM(amount), 0) as total FROM adjustments WHERE period_id = ? AND driver_id = ? AND type = 'deduction'"
        ).get(req.params.periodId, driver.id);

        upsertSummary.run(
          req.params.periodId, driver.id, JSON.stringify(tripCounts),
          totalTrips, totalIncome, allowances.total, deductions.total,
          totalIncome + allowances.total - deductions.total
        );
      }
    });

    recalc();
    res.json({ message: 'Summary recalculated', period_id: req.params.periodId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
