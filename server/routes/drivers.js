const router = require('express').Router();
// TODO: Implement driver CRUD
// GET /api/drivers — list all drivers
// GET /api/drivers/search?q= — search by name/nickname/phone
// POST /api/drivers — add driver
// PUT /api/drivers/:id — update driver
// DELETE /api/drivers/:id — remove driver

router.get('/', (req, res) => {
  res.json({ message: 'TODO: list drivers' });
});

module.exports = router;
