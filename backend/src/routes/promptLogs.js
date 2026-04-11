const express = require('express');
const router = express.Router();
const { getPromptLogs, getPromptLogCount, clearPromptLogs } = require('../db/database');

// GET /api/prompt-logs
router.get('/', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;
    const logs = getPromptLogs(limit, offset);
    const total = getPromptLogCount();
    res.json({ success: true, logs, total, limit, offset });
  } catch (err) {
    console.error('Get prompt logs error:', err);
    res.status(500).json({ error: 'Failed to get prompt logs', message: err.message });
  }
});

// DELETE /api/prompt-logs
router.delete('/', (req, res) => {
  try {
    clearPromptLogs();
    res.json({ success: true });
  } catch (err) {
    console.error('Clear prompt logs error:', err);
    res.status(500).json({ error: 'Failed to clear logs', message: err.message });
  }
});

module.exports = router;
