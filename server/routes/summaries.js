const router = require('express').Router();
// TODO: Implement auto-calculated summaries
// GET /api/summaries/:periodId — get summary for a period (all drivers)
// GET /api/summaries/:periodId/:driverId — get summary for specific driver
// POST /api/summaries/:periodId/recalculate — force recalculate

router.get('/:periodId', (req, res) => {
  res.json({ message: 'TODO: calculate summary' });
});

module.exports = router;
