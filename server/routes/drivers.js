const router = require('express').Router();
const db = require('../db/connection');

// GET /api/drivers — list all drivers
router.get('/', (req, res) => {
  try {
    const drivers = db.prepare('SELECT * FROM drivers ORDER BY employee_code').all();
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/drivers/search?q= — search by name/nickname/phone
router.get('/search', (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const drivers = db.prepare(
      `SELECT * FROM drivers 
       WHERE full_name LIKE ? OR nickname LIKE ? OR phone LIKE ? OR employee_code LIKE ?
       ORDER BY employee_code`
    ).all(q, q, q, q);
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/drivers/:id — get single driver
router.get('/:id', (req, res) => {
  try {
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/drivers — add driver
router.post('/', (req, res) => {
  try {
    const { employee_code, full_name, nickname, phone, vehicle_plate, unit_type } = req.body;
    if (!employee_code || !full_name) {
      return res.status(400).json({ error: 'employee_code and full_name are required' });
    }
    const result = db.prepare(
      'INSERT INTO drivers (employee_code, full_name, nickname, phone, vehicle_plate, unit_type) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(employee_code, full_name, nickname || null, phone || null, vehicle_plate || null, unit_type || '30');
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(driver);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Employee code already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/drivers/:id — update driver
router.put('/:id', (req, res) => {
  try {
    const { full_name, nickname, phone, vehicle_plate, unit_type, line_user_id } = req.body;
    db.prepare(
      `UPDATE drivers SET 
        full_name = COALESCE(?, full_name),
        nickname = COALESCE(?, nickname),
        phone = COALESCE(?, phone),
        vehicle_plate = COALESCE(?, vehicle_plate),
        unit_type = COALESCE(?, unit_type),
        line_user_id = COALESCE(?, line_user_id)
      WHERE id = ?`
    ).run(full_name, nickname, phone, vehicle_plate, unit_type, line_user_id, req.params.id);
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/drivers/:id — remove driver
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM drivers WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json({ message: 'Driver deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
