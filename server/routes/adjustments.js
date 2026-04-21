const router = require('express').Router();
// TODO: Implement allowance/deduction CRUD
// GET /api/adjustments?period_id= — list adjustments
// POST /api/adjustments — add adjustment
// PUT /api/adjustments/:id — update adjustment
// DELETE /api/adjustments/:id — remove adjustment

router.get('/', (req, res) => {
  res.json({ message: 'TODO: list adjustments' });
});

module.exports = router;
