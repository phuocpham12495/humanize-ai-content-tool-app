require('dotenv').config();

const VALID_IMAGEN_MODELS = [
  'imagen-4.0-fast-generate-001',
  'imagen-4.0-generate-001',
  'imagen-3.0-generate-001',
];

function resolveImagenModel(modelId) {
  return VALID_IMAGEN_MODELS.includes(modelId) ? modelId : 'imagen-4.0-fast-generate-001';
}

const IMAGEN_MODEL = 'imagen-4.0-fast-generate-001';

const VISUAL_STYLE_PROMPTS = {
  anime: 'anime art style, vibrant colors, expressive characters, Studio Ghibli-inspired, clean linework, detailed backgrounds',
  pixar: 'Pixar 3D animation style, warm lighting, expressive characters, high quality render, cinematic, family-friendly',
  pixel: 'pixel art style, 16-bit retro aesthetic, crisp pixels, limited color palette, nostalgic game art',
  custom: '' // filled by user's custom prompt
};

const CONTENT_TYPE_PROMPTS = {
  storytelling: 'cinematic story scene, narrative composition, emotional moment, illustrating the key story from the text, immersive scene',
  quote: 'minimalist inspirational scene, serene and contemplative atmosphere, soft bokeh background, clean composition with empty space, mood-driven visual metaphor',
  meme: 'humorous relatable scene, expressive character reaction, funny everyday situation, comedic visual scenario, exaggerated emotion',
  custom: '' // filled by user's custom prompt
};

// Always appended to every prompt — hard rule: no text in images
const NO_TEXT_RULE = 'No text, no letters, no words, no captions, no watermarks, no typography, no writing of any kind in the image';

/**
 * Extract the core visual concept from a humanized post using Gemini text model.
 * Returns a short scene description suitable for an image prompt.
 */
async function extractImageConcept(text, contentType, geminiModel) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not set');

  const validGeminiModels = ['gemini-2.5-flash','gemini-2.5-pro','gemini-2.0-flash','gemini-1.5-flash','gemini-1.5-pro'];
  const resolvedModel = validGeminiModels.includes(geminiModel) ? geminiModel : 'gemini-2.5-flash';

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: resolvedModel });

  const contentInstructions = {
    storytelling: 'Describe the most compelling VISUAL SCENE or moment from this text — what would make a dramatic, cinematic illustration. Pure visuals only, no text in image.',
    quote: 'Describe a VISUAL SCENE or metaphor that captures the mood and message of this text — something serene, contemplative, or powerful. No text, no words in the image. Pure visual metaphor only.',
    meme: 'Describe a FUNNY or RELATABLE visual scene from this text — an expressive character, a comedic situation, an exaggerated reaction. No text or captions in the image. Pure visual humor only.',
    custom: 'Describe the main visual concept or scene from this text. No text in the image.'
  };

  const instruction = contentInstructions[contentType] || contentInstructions.custom;

  const prompt = `You are a visual prompt engineer. Given the following text, extract a SHORT (2-3 sentence) visual concept for an image.

TEXT:
"""
${text.slice(0, 1500)}
"""

TASK: ${instruction}

Output ONLY the visual description (2-3 sentences max). No explanation, no preamble.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Build the full Imagen prompt from settings + extracted concept.
 */
function buildImagenPrompt({ concept, visualStyle, contentType, customVisualPrompt, customContentPrompt, index, total }) {
  const visualPart = visualStyle === 'custom'
    ? customVisualPrompt
    : VISUAL_STYLE_PROMPTS[visualStyle] || VISUAL_STYLE_PROMPTS.anime;

  const contentPart = contentType === 'custom'
    ? customContentPrompt
    : CONTENT_TYPE_PROMPTS[contentType] || CONTENT_TYPE_PROMPTS.storytelling;

  // Slight variation hint for generating multiple unique images
  const variationHint = total > 1
    ? `Unique variation ${index + 1} of ${total} — slightly different composition and angle.`
    : '';

  return [concept, contentPart, visualPart, variationHint, 'High quality, detailed, professional.', NO_TEXT_RULE]
    .filter(Boolean)
    .join('. ');
}

/**
 * Call Imagen 4 Fast REST API — returns { base64: string, mimeType: string }
 */
async function callImagen(prompt, aspectRatio = '1:1', imagenModel) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not set');

  const model = resolveImagenModel(imagenModel);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

  const body = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio,
      safetyFilterLevel: 'block_some',
      personGeneration: 'allow_adult'
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `Imagen API error ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  const prediction = data?.predictions?.[0];
  if (!prediction?.bytesBase64Encoded) {
    throw new Error('Imagen API returned no image data');
  }

  return {
    base64: prediction.bytesBase64Encoded,
    mimeType: prediction.mimeType || 'image/png'
  };
}

/**
 * Main entry: generate one image for a given humanized post + settings.
 *
 * @param {object} opts
 * @param {string} opts.text           - The humanized post text
 * @param {string} opts.visualStyle    - 'anime' | 'pixar' | 'pixel' | 'custom'
 * @param {string} opts.contentType    - 'storytelling' | 'quote' | 'meme' | 'custom'
 * @param {string} opts.customVisualPrompt  - used when visualStyle === 'custom'
 * @param {string} opts.customContentPrompt - used when contentType === 'custom'
 * @param {string} opts.aspectRatio    - '1:1' | '4:3' | '16:9' | '9:16'
 * @param {number} opts.index          - 0-based index (for variation)
 * @param {number} opts.total          - total images planned (for variation hints)
 * @returns {{ base64, mimeType, prompt, concept }}
 */
async function generateImage(opts) {
  const {
    text,
    visualStyle = 'anime',
    contentType = 'storytelling',
    customVisualPrompt = '',
    customContentPrompt = '',
    aspectRatio = '1:1',
    index = 0,
    total = 1,
    geminiModel,
    geminiImageModel
  } = opts;

  // Step 1: Extract visual concept from text
  const concept = await extractImageConcept(text, contentType, geminiModel);

  // Step 2: Build full prompt
  const prompt = buildImagenPrompt({
    concept, visualStyle, contentType,
    customVisualPrompt, customContentPrompt,
    index, total
  });

  // Step 3: Call Imagen
  const { base64, mimeType } = await callImagen(prompt, aspectRatio, geminiImageModel);

  return { base64, mimeType, prompt, concept };
}

/**
 * Generate prompts for multiple image slots in one call.
 * Each slot gets a unique concept + full Imagen prompt.
 *
 * @param {object} opts
 * @param {string} opts.text
 * @param {number} opts.count
 * @param {string} opts.visualStyle
 * @param {string} opts.contentType
 * @param {string} opts.customVisualPrompt
 * @param {string} opts.customContentPrompt
 * @param {string} opts.aspectRatio
 * @returns {Array<{ concept: string, prompt: string, index: number }>}
 */
async function generatePrompts(opts) {
  const {
    text,
    count = 1,
    visualStyle = 'anime',
    contentType = 'storytelling',
    customVisualPrompt = '',
    customContentPrompt = '',
    geminiModel,
  } = opts;

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not set');

  const validGeminiModels = ['gemini-2.5-flash','gemini-2.5-pro','gemini-2.0-flash','gemini-1.5-flash','gemini-1.5-pro'];
  const resolvedGeminiModel = validGeminiModels.includes(geminiModel) ? geminiModel : 'gemini-2.5-flash';

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: resolvedGeminiModel });

  const contentInstructions = {
    storytelling: 'a compelling visual scene or cinematic moment from the text. Pure visuals only — no text, letters, or words in the image',
    quote: 'a visual scene or metaphor capturing the mood and message of the text — serene, contemplative, or powerful. NO text, NO words, NO typography in the image. Pure visual metaphor',
    meme: 'a funny or relatable visual scene — expressive character, comedic situation, exaggerated reaction. NO text, NO captions, NO speech bubbles in the image. Pure visual humor',
    custom: customContentPrompt || 'the main visual concept from the text. No text in the image'
  };

  const instruction = contentInstructions[contentType] || contentInstructions.custom;

  const prompt = `You are a visual prompt engineer and copywriter. Given the following text, generate ${count} UNIQUE image concepts for ${count} different image slots.

IMPORTANT RULE: All concepts must describe PURE VISUAL SCENES ONLY. Absolutely NO text, letters, words, captions, typography, or writing should appear in any image.

TEXT:
"""
${text.slice(0, 2000)}
"""

TASK: For each slot, generate:
1. "concept": A SHORT (2-3 sentence) visual scene describing ${instruction}. Each slot must have a DIFFERENT angle, composition, or moment — not repetitions.
2. "caption": A SHORT, PUNCHY highlight sentence (max 20 words) extracted or inspired from the text — the most compelling, quotable, or emotionally resonant line. This is displayed BELOW the image as a standalone quote. Make it impactful and standalone.

Output ONLY valid JSON: an array of ${count} objects with fields "concept" (string) and "caption" (string).
Example: [{"concept": "...", "caption": "..."}, {"concept": "...", "caption": "..."}]`;

  const result = await model.generateContent(prompt);
  let raw = result.response.text().trim();

  // Strip markdown code block if present
  raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');

  let concepts;
  try {
    concepts = JSON.parse(raw);
  } catch {
    // Fallback: generate concepts one by one
    concepts = [];
    for (let i = 0; i < count; i++) {
      const c = await extractImageConcept(text, contentType, geminiModel);
      concepts.push({ concept: c });
    }
  }

  // Ensure we have exactly `count` items
  while (concepts.length < count) {
    concepts.push({ concept: concepts[0]?.concept || 'A vivid scene from the story.', caption: concepts[0]?.caption || '' });
  }
  concepts = concepts.slice(0, count);

  const visualPart = visualStyle === 'custom'
    ? customVisualPrompt
    : VISUAL_STYLE_PROMPTS[visualStyle] || VISUAL_STYLE_PROMPTS.anime;

  const contentPart = contentType === 'custom'
    ? customContentPrompt
    : CONTENT_TYPE_PROMPTS[contentType] || CONTENT_TYPE_PROMPTS.storytelling;

  return concepts.map((item, index) => {
    const variationHint = count > 1
      ? `Unique variation ${index + 1} of ${count} — different composition and angle from the others.`
      : '';

    const fullPrompt = [item.concept, contentPart, visualPart, variationHint, 'High quality, detailed, professional.', NO_TEXT_RULE]
      .filter(Boolean)
      .join('. ');

    return { concept: item.concept, caption: item.caption || '', prompt: fullPrompt, index };
  });
}

/**
 * Generate a single image using a pre-built prompt (skip concept extraction).
 */
async function generateImageFromPrompt(opts) {
  const {
    prompt,
    concept,
    aspectRatio = '1:1',
    index = 0,
    geminiImageModel
  } = opts;

  const { base64, mimeType } = await callImagen(prompt, aspectRatio, geminiImageModel);
  return { base64, mimeType, prompt, concept };
}

module.exports = { generateImage, generatePrompts, generateImageFromPrompt, VISUAL_STYLE_PROMPTS, CONTENT_TYPE_PROMPTS };
