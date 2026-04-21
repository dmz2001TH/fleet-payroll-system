const router = require('express').Router();
// TODO: Implement trip CRUD
// GET /api/trips?period_id= — list trips (filter by period)
// POST /api/trips — create trip
// PUT /api/trips/:id — update trip
// DELETE /api/trips/:id — delete trip

router.get('/', (req, res) => {
  res.json({ message: 'TODO: list trips' });
});

module.exports = router;
