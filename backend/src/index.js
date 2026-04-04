require('dotenv').config();
const express = require('express');
const cors = require('cors');
const humanizeRoutes = require('./routes/humanize');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', humanizeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'humanize-ai-backend',
    version: '1.0.0',
    geminiConfigured: hasApiKey
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Humanize AI Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured ✓' : 'NOT configured ✗'}`);
  console.log('\nAvailable routes:');
  console.log('  POST /api/humanize               — Humanize text (batch)');
  console.log('  POST /api/humanize/stream         — Humanize text (SSE stream)');
  console.log('  POST /api/analyze                 — Analyze AI-likeness');
  console.log('  GET  /api/modes                   — List preset modes');
  console.log('  GET  /api/history/:sessionId      — Get session history');
  console.log('  GET  /api/health                  — Health check\n');
});

module.exports = app;
