require('dotenv').config();
const { addPromptLog } = require('../db/database');

const VEO_VISUAL_STYLE_HINTS = {
  anime: 'anime art style, vibrant colors, cel-shading, Studio Ghibli atmosphere, expressive and cinematic',
  pixar: 'Pixar 3D animation style, warm cinematic lighting, emotionally expressive characters, high quality render',
  pixel: '16-bit pixel art style, retro game aesthetic, limited color palette, nostalgic and charming',
  custom: '' // filled by user
};

const VEO_CONTENT_TYPE_HINTS = {
  storytelling: 'cinematic narrative scene, dramatic emotional moment from the story, immersive and expressive',
  quote: 'minimalist contemplative scene, visual metaphor for the core message, serene and thought-provoking atmosphere',
  meme: 'humorous relatable scene, exaggerated character reaction, comedic timing and expression',
  custom: '' // filled by user
};

const VEO_CINEMATOGRAPHY_BY_CONTENT = {
  storytelling: ['Medium shot', 'Close-up', 'Wide establishing shot', 'Tracking shot', 'Crane shot', 'Dolly shot'],
  quote: ['Close-up with shallow depth of field', 'Medium shot', 'Wide shot', 'Slow pan', 'Static shot'],
  meme: ['Medium shot', 'Close-up', 'Reaction shot', 'POV shot', 'Zoom cut'],
  custom: ['Medium shot', 'Close-up', 'Wide shot', 'Tracking shot', 'Slow pan']
};

/**
 * Generate Veo3-formatted video prompts for N slots using Gemini.
 * Each prompt follows: [Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]
 */
async function generateVideoPrompts(opts) {
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

  const resolvedModel = (typeof geminiModel === 'string' && geminiModel.startsWith('gemini-')) ? geminiModel : 'gemini-2.5-flash';

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: resolvedModel });

  const visualHint = visualStyle === 'custom'
    ? customVisualPrompt
    : VEO_VISUAL_STYLE_HINTS[visualStyle] || VEO_VISUAL_STYLE_HINTS.anime;

  const contentHint = contentType === 'custom'
    ? customContentPrompt
    : VEO_CONTENT_TYPE_HINTS[contentType] || VEO_CONTENT_TYPE_HINTS.storytelling;

  const cinematographyOptions = VEO_CINEMATOGRAPHY_BY_CONTENT[contentType] || VEO_CINEMATOGRAPHY_BY_CONTENT.custom;

  const prompt = `You are an expert Veo3 video prompt engineer. Given the following text content, generate ${count} UNIQUE Veo3 video prompts that all feature the SAME consistent narrator character.

STEP 1 — CREATE A BASE CHARACTER:
First, invent ONE narrator character inspired by the text. Define their:
- Gender, approximate age, ethnicity/skin tone
- Hair style and color
- Clothing and accessories (be specific)
- Distinguishing features (e.g. glasses, tattoo, scar, jewelry)
- Overall vibe/energy

This character MUST appear in EVERY video prompt with the EXACT SAME appearance description. They are the storyteller — the thread connecting all scenes.

STEP 2 — GENERATE ${count} VIDEO PROMPTS:
Each prompt MUST follow this formula:
[Cinematography] + [Character description] + [Action] + [Context] + [Style & Ambiance]

Formula guide:
- Cinematography: camera work and shot composition (e.g. Medium shot, Close-up, Tracking shot, Crane shot, POV shot, Dolly shot, Wide establishing shot)
- Character description: the SAME base character from Step 1 (repeat their key visual traits in each prompt)
- Action: what the character is doing (vivid, specific, different per prompt)
- Context: the environment, setting, background details
- Style & Ambiance: overall aesthetic, mood, lighting — incorporate the visual style below

Visual style to use: ${visualHint}
Content type guidance: ${contentHint}
Suggested cinematography options (pick different ones per slot): ${cinematographyOptions.join(', ')}

TEXT:
"""
${text.slice(0, 2000)}
"""

Rules:
- The SAME character must appear in ALL ${count} prompts with consistent appearance
- Each of the ${count} prompts must have a DIFFERENT cinematography technique, scene, and action
- Each prompt should be 1-3 sentences, vivid and specific
- Include the character's key visual details (hair, clothing, features) in EVERY prompt so they remain consistent
- NO text, words, letters, captions, or typography should appear in the video
- Generate exactly ${count} unique prompts

Also for each prompt, extract a SHORT PUNCHY caption (max 20 words) — the most compelling or emotionally resonant line from the text. Make it standalone and quotable.

Output ONLY valid JSON with this structure:
{
  "character": "<full base character description from Step 1>",
  "prompts": [{"veoPrompt": "...", "caption": "...", "index": 0}, ...]
}
Example:
{
  "character": "A young Vietnamese woman in her mid-20s with long black hair, wearing a cream turtleneck and round gold-rimmed glasses, warm expressive eyes",
  "prompts": [{"veoPrompt": "Medium shot, a young Vietnamese woman with long black hair and round gold-rimmed glasses in a cream turtleneck, sitting at a cluttered desk...", "caption": "Every late night is an investment.", "index": 0}]
}`;

  const startTime = Date.now();
  const result = await model.generateContent(prompt);
  let raw = result.response.text().trim();
  addPromptLog({ feature: 'video-prompts', model: resolvedModel, prompt, response: raw, durationMs: Date.now() - startTime });

  // Strip markdown code fences if present
  raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');

  let prompts;
  let baseCharacter = '';
  try {
    const parsed = JSON.parse(raw);
    // New format: { character, prompts: [...] }
    if (parsed.character && Array.isArray(parsed.prompts)) {
      baseCharacter = parsed.character;
      prompts = parsed.prompts;
    } else if (Array.isArray(parsed)) {
      // Legacy fallback: array of prompts
      prompts = parsed;
    } else {
      prompts = [{ veoPrompt: raw.slice(0, 500), caption: '', index: 0 }];
    }
  } catch {
    prompts = [{ veoPrompt: raw.slice(0, 500), caption: '', index: 0 }];
  }

  // Ensure exactly `count` items with correct indices
  while (prompts.length < count) {
    prompts.push({
      veoPrompt: prompts[0]?.veoPrompt || 'Medium shot, a person walking forward with determination, in a vast open landscape at golden hour, cinematic.',
      caption: prompts[0]?.caption || '',
      index: prompts.length
    });
  }
  prompts = prompts.slice(0, count).map((p, i) => ({ ...p, index: i, baseCharacter }));

  return prompts;
}

module.exports = { generateVideoPrompts, VEO_VISUAL_STYLE_HINTS, VEO_CONTENT_TYPE_HINTS };
