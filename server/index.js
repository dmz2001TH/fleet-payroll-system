const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../web/dist')));

// Routes
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/periods', require('./routes/periods'));
app.use('/api/summaries', require('./routes/summaries'));
app.use('/api/adjustments', require('./routes/adjustments'));
app.use('/api/line', require('./routes/line'));
app.use('/api/sheets', require('./routes/sheets'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../web/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚛 NPC Fleet Payroll System running on port ${PORT}`);
});
