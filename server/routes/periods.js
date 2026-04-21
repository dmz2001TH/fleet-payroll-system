const router = require('express').Router();
// TODO: Implement cut-off period management
// GET /api/periods — list all periods
// POST /api/periods — create new period
// PUT /api/periods/:id — update period status
// GET /api/periods/:id — get period detail

router.get('/', (req, res) => {
  res.json({ message: 'TODO: list periods' });
});

module.exports = router;
