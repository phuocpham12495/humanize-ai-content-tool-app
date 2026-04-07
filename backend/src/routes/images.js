const express = require('express');
const router = express.Router();
const { generateImage, generatePrompts, generateImageFromPrompt } = require('../services/imageService');

const VALID_VISUAL_STYLES  = ['anime', 'pixar', 'pixel', 'custom'];
const VALID_CONTENT_TYPES  = ['storytelling', 'quote', 'meme', 'custom'];
const VALID_ASPECT_RATIOS  = ['1:1', '4:3', '16:9', '9:16'];

/**
 * POST /api/images/generate-prompts
 * Generates concepts + Imagen prompts for N slots in one call.
 * Body: {
 *   text: string,
 *   count: number,          // 1-10
 *   visualStyle: string,
 *   contentType: string,
 *   customVisualPrompt?: string,
 *   customContentPrompt?: string,
 *   aspectRatio?: string
 * }
 * Response: { success: true, prompts: Array<{ concept, prompt, index }> }
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
      aspectRatio = '1:1',
      geminiModel
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
    if (!VALID_ASPECT_RATIOS.includes(aspectRatio)) {
      return res.status(400).json({ error: 'Invalid aspectRatio', message: `Must be one of: ${VALID_ASPECT_RATIOS.join(', ')}` });
    }
    const n = Math.max(1, Math.min(12, Number(count)));


    const prompts = await generatePrompts({
      text: text.trim(),
      count: n,
      visualStyle,
      contentType,
      customVisualPrompt,
      customContentPrompt,
      aspectRatio,
      geminiModel
    });

    res.json({ success: true, prompts });

  } catch (err) {
    console.error('Prompt generation error:', err);
    if (err.message?.includes('GEMINI_API_KEY')) {
      return res.status(500).json({ error: 'Configuration error', message: 'Gemini API key not configured' });
    }
    res.status(500).json({ error: 'Prompt generation failed', message: err.message });
  }
});

/**
 * POST /api/images/generate
 * Generates a single image for one slot.
 * Accepts either:
 *   A) { prompt, concept, aspectRatio, index }  — use pre-built prompt
 *   B) { text, visualStyle, contentType, ... }  — extract concept + build prompt on the fly
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      // Pre-built prompt mode (A)
      prompt: prebuiltPrompt,
      concept: prebuiltConcept,
      // Text mode (B)
      text,
      visualStyle = 'anime',
      contentType = 'storytelling',
      customVisualPrompt = '',
      customContentPrompt = '',
      // Common
      aspectRatio = '1:1',
      index = 0,
      total = 1,
      geminiModel,
      geminiImageModel
    } = req.body;

    if (!VALID_ASPECT_RATIOS.includes(aspectRatio)) {
      return res.status(400).json({ error: 'Invalid aspectRatio', message: `Must be one of: ${VALID_ASPECT_RATIOS.join(', ')}` });
    }

    let result;

    if (prebuiltPrompt && prebuiltConcept) {
      // Mode A: use pre-built prompt directly
      result = await generateImageFromPrompt({
        prompt: prebuiltPrompt,
        concept: prebuiltConcept,
        aspectRatio,
        index: Number(index),
        geminiImageModel
      });
    } else {
      // Mode B: full pipeline (extract concept → build prompt → generate)
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'Invalid request', message: 'text or prompt+concept is required' });
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

      result = await generateImage({
        text: text.trim(), visualStyle, contentType,
        customVisualPrompt, customContentPrompt,
        aspectRatio, index: Number(index), total: Number(total),
        geminiModel, geminiImageModel
      });
    }

    res.json({
      success: true,
      image: {
        base64: result.base64,
        mimeType: result.mimeType,
        dataUrl: `data:${result.mimeType};base64,${result.base64}`,
        prompt: result.prompt,
        concept: result.concept,
        visualStyle: prebuiltPrompt ? req.body.visualStyle : visualStyle,
        contentType: prebuiltPrompt ? req.body.contentType : contentType,
        aspectRatio,
        index
      }
    });

  } catch (err) {
    console.error('Image generation error:', err);
    if (err.message?.includes('GEMINI_API_KEY')) {
      return res.status(500).json({ error: 'Configuration error', message: 'Gemini API key not configured' });
    }
    if (err.message?.includes('not found') || err.message?.includes('404')) {
      return res.status(500).json({ error: 'Model not available', message: 'imagen-4.0-fast-generate-001 may not be available on your API key tier' });
    }
    res.status(500).json({ error: 'Image generation failed', message: err.message });
  }
});

module.exports = router;
