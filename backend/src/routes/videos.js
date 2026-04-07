const express = require('express');
const router = express.Router();
const { generateVideoPrompts } = require('../services/videoService');

const VALID_VISUAL_STYLES = ['anime', 'pixar', 'pixel', 'custom'];
const VALID_CONTENT_TYPES = ['storytelling', 'quote', 'meme', 'custom'];

/**
 * POST /api/videos/generate-prompts
 * Generates Veo3-formatted video prompts for N slots using Gemini.
 * Body: {
 *   text: string,
 *   count: number,          // 1-10
 *   visualStyle: string,
 *   contentType: string,
 *   customVisualPrompt?: string,
 *   customContentPrompt?: string,
 * }
 * Response: { success: true, prompts: Array<{ veoPrompt, caption, index }> }
 */
router.post('/generate-prompts', async (req, res) => {
  try {
    const {
      text,
      count = 1,
      visualStyle = 'anime',
      contentType = 'storytelling',
      customVisualPrompt = '',
      customContentPrompt = '',
      geminiModel,
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Invalid request', message: 'text is required' });
    }
    if (text.length > 10000) {
      return res.status(400).json({ error: 'Text too long', message: 'text must be under 10,000 characters' });
    }
    if (!VALID_VISUAL_STYLES.includes(visualStyle)) {
      return res.status(400).json({ error: 'Invalid visualStyle', message: `Must be one of: ${VALID_VISUAL_STYLES.join(', ')}` });
    }
    if (!VALID_CONTENT_TYPES.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid contentType', message: `Must be one of: ${VALID_CONTENT_TYPES.join(', ')}` });
    }
    if (visualStyle === 'custom' && !customVisualPrompt.trim()) {
      return res.status(400).json({ error: 'Invalid request', message: 'customVisualPrompt is required when visualStyle is "custom"' });
    }
    if (contentType === 'custom' && !customContentPrompt.trim()) {
      return res.status(400).json({ error: 'Invalid request', message: 'customContentPrompt is required when contentType is "custom"' });
    }

    const n = Math.max(1, Math.min(12, Number(count)));

    const prompts = await generateVideoPrompts({
      text: text.trim(),
      count: n,
      visualStyle,
      contentType,
      customVisualPrompt,
      customContentPrompt,
      geminiModel,
    });

    res.json({ success: true, prompts });

  } catch (err) {
    console.error('Video prompt generation error:', err);
    if (err.message?.includes('GEMINI_API_KEY')) {
      return res.status(500).json({ error: 'Configuration error', message: 'Gemini API key not configured' });
    }
    res.status(500).json({ error: 'Video prompt generation failed', message: err.message });
  }
});

module.exports = router;
