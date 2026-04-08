const express = require('express');
const router = express.Router();
const { getSetting, setSetting } = require('../db/database');

// Default model lists (used as fallback if live fetch fails)
const DEFAULT_GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Fast & smart (recommended)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Most capable, slower' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Balanced performance' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Lightweight & fast' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Stable & reliable' },
];

const DEFAULT_IMAGEN_MODELS = [
  { id: 'imagen-4.0-fast-generate-001', name: 'Imagen 4 Fast', desc: 'Quick generation (recommended)' },
  { id: 'imagen-4.0-generate-001', name: 'Imagen 4', desc: 'Higher quality, slower' },
  { id: 'imagen-3.0-generate-001', name: 'Imagen 3', desc: 'Stable & consistent' },
];

const VALID_GEMINI_MODELS = DEFAULT_GEMINI_MODELS.map(m => m.id);
const VALID_IMAGEN_MODELS = DEFAULT_IMAGEN_MODELS.map(m => m.id);

// GET /api/settings/available-models — fetch live model list from Gemini API
router.get('/available-models', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        success: true,
        geminiModels: DEFAULT_GEMINI_MODELS,
        imagenModels: DEFAULT_IMAGEN_MODELS,
        source: 'default'
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`
    );

    if (!response.ok) {
      console.error('Failed to fetch models from Gemini API:', response.status);
      return res.json({
        success: true,
        geminiModels: DEFAULT_GEMINI_MODELS,
        imagenModels: DEFAULT_IMAGEN_MODELS,
        source: 'default'
      });
    }

    const data = await response.json();
    const models = data.models || [];

    // Filter and categorize models
    const geminiModels = [];
    const imagenModels = [];

    for (const m of models) {
      const id = m.name.replace('models/', '');
      const displayName = m.displayName || id;
      const desc = m.description ? m.description.slice(0, 60) : '';

      // Text generation models (gemini-*)
      if (id.startsWith('gemini-') && m.supportedGenerationMethods?.includes('generateContent')) {
        geminiModels.push({ id, name: displayName, desc });
      }
      // Image generation models (imagen-*)
      if (id.startsWith('imagen-') && (m.supportedGenerationMethods?.includes('predict') || id.includes('generate'))) {
        imagenModels.push({ id, name: displayName, desc });
      }
    }

    // Sort: newer/higher versions first
    geminiModels.sort((a, b) => b.id.localeCompare(a.id));
    imagenModels.sort((a, b) => b.id.localeCompare(a.id));

    res.json({
      success: true,
      geminiModels: geminiModels.length > 0 ? geminiModels : DEFAULT_GEMINI_MODELS,
      imagenModels: imagenModels.length > 0 ? imagenModels : DEFAULT_IMAGEN_MODELS,
      source: geminiModels.length > 0 ? 'live' : 'default'
    });
  } catch (err) {
    console.error('Error fetching available models:', err.message);
    res.json({
      success: true,
      geminiModels: DEFAULT_GEMINI_MODELS,
      imagenModels: DEFAULT_IMAGEN_MODELS,
      source: 'default'
    });
  }
});

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
      if (typeof geminiModel !== 'string' || !geminiModel.startsWith('gemini-')) {
        return res.status(400).json({
          error: 'Invalid geminiModel',
          message: 'Model ID must start with "gemini-"'
        });
      }
      setSetting('geminiModel', geminiModel);
    }

    if (geminiImageModel !== undefined) {
      if (typeof geminiImageModel !== 'string' || !geminiImageModel.startsWith('imagen-')) {
        return res.status(400).json({
          error: 'Invalid geminiImageModel',
          message: 'Model ID must start with "imagen-"'
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
