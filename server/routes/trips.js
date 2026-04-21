const router = require('express').Router();
const db = require('../db/connection');

// GET /api/trips?period_id= — list trips
router.get('/', (req, res) => {
  try {
    let query = `
      SELECT t.*, d.full_name as driver_name, d.nickname as driver_nickname, d.employee_code
      FROM trips t
      LEFT JOIN drivers d ON t.driver_id = d.id
    `;
    const params = [];

    if (req.query.period_id) {
      query += ' WHERE t.period_id = ?';
      params.push(req.query.period_id);
    }

    query += ' ORDER BY t.trip_date DESC, t.id DESC';
    const trips = db.prepare(query).all(...params);
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trips/:id — get single trip
router.get('/:id', (req, res) => {
  try {
    const trip = db.prepare(`
      SELECT t.*, d.full_name as driver_name, d.nickname as driver_nickname, d.employee_code
      FROM trips t
      LEFT JOIN drivers d ON t.driver_id = d.id
      WHERE t.id = ?
    `).get(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trips — create trip
router.post('/', (req, res) => {
  try {
    const { period_id, trip_date, customer, bl_number, container_no, driver_id, price, unit_type, notes } = req.body;
    if (!trip_date || !driver_id || !price) {
      return res.status(400).json({ error: 'trip_date, driver_id, and price are required' });
    }
    const result = db.prepare(
      `INSERT INTO trips (period_id, trip_date, customer, bl_number, container_no, driver_id, price, unit_type, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(period_id || null, trip_date, customer || null, bl_number || null, container_no || null, driver_id, price, unit_type || '30', notes || null);
    
    // Recalculate summary if period_id exists
    if (period_id) recalculateSummary(period_id);
    
    const trip = db.prepare(`
      SELECT t.*, d.full_name as driver_name, d.nickname as driver_nickname, d.employee_code
      FROM trips t LEFT JOIN drivers d ON t.driver_id = d.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trips/batch — create multiple trips at once
router.post('/batch', (req, res) => {
  try {
    const { trips } = req.body;
    if (!Array.isArray(trips) || trips.length === 0) {
      return res.status(400).json({ error: 'trips array is required' });
    }

    const insert = db.prepare(
      `INSERT INTO trips (period_id, trip_date, customer, bl_number, container_no, driver_id, price, unit_type, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const insertMany = db.transaction((items) => {
      const ids = [];
      for (const t of items) {
        const result = insert.run(
          t.period_id || null, t.trip_date, t.customer || null, t.bl_number || null,
          t.container_no || null, t.driver_id, t.price, t.unit_type || '30', t.notes || null
        );
        ids.push(result.lastInsertRowid);
      }
      return ids;
    });

    const ids = insertMany(trips);

    // Recalculate summary for all affected periods
    const periodIds = [...new Set(trips.map(t => t.period_id).filter(Boolean))];
    periodIds.forEach(pid => recalculateSummary(pid));

    res.status(201).json({ created: ids.length, ids });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/trips/:id — update trip
router.put('/:id', (req, res) => {
  try {
    const { trip_date, customer, bl_number, container_no, driver_id, price, unit_type, notes } = req.body;
    db.prepare(
      `UPDATE trips SET
        trip_date = COALESCE(?, trip_date),
        customer = COALESCE(?, customer),
        bl_number = COALESCE(?, bl_number),
        container_no = COALESCE(?, container_no),
        driver_id = COALESCE(?, driver_id),
        price = COALESCE(?, price),
        unit_type = COALESCE(?, unit_type),
        notes = COALESCE(?, notes)
      WHERE id = ?`
    ).run(trip_date, customer, bl_number, container_no, driver_id, price, unit_type, notes, req.params.id);

    // Recalculate if part of a period
    const trip = db.prepare('SELECT period_id FROM trips WHERE id = ?').get(req.params.id);
    if (trip && trip.period_id) recalculateSummary(trip.period_id);

    const updated = db.prepare(`
      SELECT t.*, d.full_name as driver_name, d.nickname as driver_nickname, d.employee_code
      FROM trips t LEFT JOIN drivers d ON t.driver_id = d.id
      WHERE t.id = ?
    `).get(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Trip not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/trips/:id — delete trip
router.delete('/:id', (req, res) => {
  try {
    const trip = db.prepare('SELECT period_id FROM trips WHERE id = ?').get(req.params.id);
    const result = db.prepare('DELETE FROM trips WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Trip not found' });
    
    if (trip && trip.period_id) recalculateSummary(trip.period_id);
    res.json({ message: 'Trip deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: recalculate summary for a period
function recalculateSummary(periodId) {
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
      // Count trips per price tier
      const trips = db.prepare(
        'SELECT price, COUNT(*) as count FROM trips WHERE period_id = ? AND driver_id = ? GROUP BY price'
      ).all(periodId, driver.id);

      const tripCounts = {};
      let totalTrips = 0;
      let totalIncome = 0;

      for (const price of PRICE_TIERS) {
        tripCounts[price] = 0;
      }
      for (const t of trips) {
        tripCounts[t.price] = t.count;
        totalTrips += t.count;
        totalIncome += t.price * t.count;
      }

      // Sum adjustments
      const allowances = db.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM adjustments WHERE period_id = ? AND driver_id = ? AND type = 'allowance'"
      ).get(periodId, driver.id);
      
      const deductions = db.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM adjustments WHERE period_id = ? AND driver_id = ? AND type = 'deduction'"
      ).get(periodId, driver.id);

      const totalAllowances = allowances.total;
      const totalDeductions = deductions.total;
      const netIncome = totalIncome + totalAllowances - totalDeductions;

      upsertSummary.run(
        periodId, driver.id, JSON.stringify(tripCounts),
        totalTrips, totalIncome, totalAllowances, totalDeductions, netIncome
      );
    }
  });

  recalc();
}

module.exports = router;
