const express = require('express');
const router = express.Router();
const { getSetting, setSetting } = require('../db/database');

const VALID_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

const VALID_IMAGEN_MODELS = [
  'imagen-4.0-fast-generate-001',
  'imagen-4.0-generate-001',
  'imagen-3.0-generate-001',
];

// GET /api/settings/models
router.get('/models', (req, res) => {
  try {
    const geminiModel = getSetting('geminiModel') || 'gemini-2.5-flash';
    const geminiImageModel = getSetting('geminiImageModel') || 'imagen-4.0-fast-generate-001';
    res.json({ success: true, geminiModel, geminiImageModel });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings', message: err.message });
  }
});

// PUT /api/settings/models
router.put('/models', (req, res) => {
  try {
    const { geminiModel, geminiImageModel } = req.body;

    if (geminiModel !== undefined) {
      if (!VALID_GEMINI_MODELS.includes(geminiModel)) {
        return res.status(400).json({
          error: 'Invalid geminiModel',
          message: `Must be one of: ${VALID_GEMINI_MODELS.join(', ')}`
        });
      }
      setSetting('geminiModel', geminiModel);
    }

    if (geminiImageModel !== undefined) {
      if (!VALID_IMAGEN_MODELS.includes(geminiImageModel)) {
        return res.status(400).json({
          error: 'Invalid geminiImageModel',
          message: `Must be one of: ${VALID_IMAGEN_MODELS.join(', ')}`
        });
      }
      setSetting('geminiImageModel', geminiImageModel);
    }

    const saved = {
      geminiModel: getSetting('geminiModel') || 'gemini-2.5-flash',
      geminiImageModel: getSetting('geminiImageModel') || 'imagen-4.0-fast-generate-001',
    };

    res.json({ success: true, ...saved });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings', message: err.message });
  }
});

module.exports = router;
