const express = require('express');
const router = express.Router();
const { analyzeText, humanizeText, scoreOutput, humanizeTextStream } = require('../services/geminiService');
const { getConfigs, saveHistory, getHistory, addPromptLog } = require('../db/database');
const crypto = require('crypto');

// POST /api/humanize
router.post('/humanize', async (req, res) => {
  try {
    const { text, settings, sessionId } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'text field is required and must be a non-empty string'
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({
        error: 'Text too long',
        message: 'Text must be under 10,000 characters'
      });
    }

    const sid = sessionId || crypto.randomUUID();
    const effectiveSettings = settings || {};

    // Run humanization
    const humanizedText = await humanizeText(text.trim(), effectiveSettings);

    // Score the output
    const scores = await scoreOutput(text.trim(), humanizedText, effectiveSettings.geminiModel);

    // Save to history
    const historyId = saveHistory(sid, text.trim(), humanizedText, effectiveSettings, scores);

    res.json({
      success: true,
      sessionId: sid,
      historyId,
      originalText: text.trim(),
      humanizedText,
      scores,
      settings: effectiveSettings
    });
  } catch (err) {
    console.error('Humanize error:', err);

    if (err.message && err.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Gemini API key is not configured. Please set GEMINI_API_KEY in .env'
      });
    }

    res.status(500).json({
      error: 'Humanization failed',
      message: err.message || 'An unexpected error occurred'
    });
  }
});

// POST /api/analyze
router.post('/analyze', async (req, res) => {
  try {
    const { text, sessionId } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'text field is required and must be a non-empty string'
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({
        error: 'Text too long',
        message: 'Text must be under 10,000 characters'
      });
    }

    const { geminiModel } = req.body;
    const analysis = await analyzeText(text.trim(), geminiModel);

    const sid = sessionId || crypto.randomUUID();

    // Save to history (analysis only)
    saveHistory(sid, text.trim(), null, null, {
      aiLikenessScore: analysis.aiLikenessScore,
      metrics: analysis.metrics
    });

    res.json({
      success: true,
      sessionId: sid,
      analysis
    });
  } catch (err) {
    console.error('Analyze error:', err);

    if (err.message && err.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Gemini API key is not configured. Please set GEMINI_API_KEY in .env'
      });
    }

    res.status(500).json({
      error: 'Analysis failed',
      message: err.message || 'An unexpected error occurred'
    });
  }
});

// POST /api/humanize/stream — Server-Sent Events streaming (TC015)
router.post('/humanize/stream', async (req, res) => {
  const { text, settings, sessionId } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid request', message: 'text is required' });
  }
  if (text.length > 10000) {
    return res.status(400).json({ error: 'Text too long', message: 'Text must be under 10,000 characters' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sid = sessionId || crypto.randomUUID();
  const effectiveSettings = settings || {};

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    send('status', { message: 'Starting humanization...', sessionId: sid });

    // Stream the humanized text
    const { stream, _logMeta } = await humanizeTextStream(text.trim(), effectiveSettings);
    let fullText = '';

    for await (const chunk of stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      send('chunk', { text: chunkText });
    }

    // Log the streamed prompt + full response
    addPromptLog({ ..._logMeta, response: fullText.trim(), durationMs: Date.now() - _logMeta.startTime });

    send('status', { message: 'Scoring output...' });

    // Score the final output
    const scores = await scoreOutput(text.trim(), fullText.trim(), effectiveSettings.geminiModel);

    // Save to history
    const historyId = saveHistory(sid, text.trim(), fullText.trim(), effectiveSettings, scores);

    send('done', {
      humanizedText: fullText.trim(),
      scores,
      historyId,
      sessionId: sid
    });

    res.end();
  } catch (err) {
    console.error('Stream error:', err);
    send('error', { message: err.message || 'Streaming failed' });
    res.end();
  }
});

// GET /api/history/:sessionId — retrieve past humanizations for a session
router.get('/history/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId || sessionId.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid request', message: 'sessionId is required' });
    }
    const history = getHistory(sessionId);
    res.json({ success: true, sessionId, history });
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ error: 'Failed to get history', message: err.message });
  }
});

// GET /api/modes
router.get('/modes', (req, res) => {
  try {
    const configs = getConfigs();
    res.json({
      success: true,
      modes: configs
    });
  } catch (err) {
    console.error('Get modes error:', err);
    res.status(500).json({
      error: 'Failed to get modes',
      message: err.message
    });
  }
});

module.exports = router;
