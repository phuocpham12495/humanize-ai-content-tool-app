require('dotenv').config();
const express = require('express');
const cors = require('cors');
const humanizeRoutes = require('./routes/humanize');
const agentRoutes = require('./routes/agents');
const imageRoutes = require('./routes/images');
const videoRoutes = require('./routes/videos');
const settingsRoutes = require('./routes/settings');

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
app.use('/api/agents', agentRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/settings', settingsRoutes);

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
  console.log('  GET  /api/health                  — Health check');
  console.log('  GET  /api/agents                  — List AI agents');
  console.log('  POST /api/agents                  — Create agent');
  console.log('  GET  /api/agents/:id              — Get agent + posts');
  console.log('  PUT  /api/agents/:id              — Update agent');
  console.log('  DELETE /api/agents/:id            — Delete agent');
  console.log('  POST /api/agents/:id/posts        — Add training post');
  console.log('  PUT  /api/agents/:id/posts/:pid   — Update post');
  console.log('  DELETE /api/agents/:id/posts/:pid — Delete post');
  console.log('  POST /api/agents/:id/generate     — Generate in agent style');
  console.log('  POST /api/agents/:id/generate/stream — Generate (SSE)');
  console.log('  POST /api/images/generate-prompts     — Generate prompts for N image slots');
  console.log('  POST /api/images/generate             — Generate single image (Imagen 4 Fast)');
  console.log('  POST /api/videos/generate-prompts     — Generate Veo3 video prompts\n');
});

module.exports = app;
