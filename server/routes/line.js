const router = require('express').Router();
// TODO: LINE Bot webhook + endpoints
// POST /api/line/webhook — LINE webhook handler
// POST /api/line/send-payslip/:periodId — send payslips to all drivers
// POST /api/line/setup-richmenu — create and set rich menu
// GET /api/line/pairing-status — check pairing status

router.post('/webhook', (req, res) => {
  res.json({ message: 'TODO: handle LINE webhook' });
});

module.exports = router;
