const router = require('express').Router();
// TODO: Google Sheets sync
// POST /api/sheets/sync — push data to Google Sheets
// POST /api/sheets/pull — pull changes from Google Sheets (with preview)
// GET /api/sheets/status — check connection status

router.post('/sync', (req, res) => {
  res.json({ message: 'TODO: sync to Google Sheets' });
});

module.exports = router;
