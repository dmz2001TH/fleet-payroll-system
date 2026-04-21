const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Initialize database on startup
require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files if web/dist exists
const webDist = path.join(__dirname, '../web/dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
}

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

// SPA fallback — serve index.html if web/dist exists, otherwise return API info
const indexHtml = path.join(webDist, 'index.html');
app.get('*', (req, res) => {
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(200).json({
      message: '🚛 NPC Fleet Payroll System API is running. Frontend not built yet.',
      health: '/api/health',
      endpoints: ['/api/drivers', '/api/trips', '/api/periods', '/api/summaries', '/api/adjustments', '/api/line', '/api/sheets']
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚛 NPC Fleet Payroll System running on port ${PORT}`);
});
