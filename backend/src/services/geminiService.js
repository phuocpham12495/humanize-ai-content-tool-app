const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

const VALID_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

function getModel(modelId) {
  const model = VALID_GEMINI_MODELS.includes(modelId) ? modelId : 'gemini-2.5-flash';
  return getGenAI().getGenerativeModel({ model });
}

async function parseJsonResponse(text) {
  // Strip markdown code blocks if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Try to extract JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Failed to parse JSON response from Gemini');
  }
}

/**
 * Analyze text for AI-likeness and suspicious patterns
 */
async function analyzeText(text, geminiModel) {
  const model = getModel(geminiModel);

  const prompt = `You are an expert AI content detector and linguist. Analyze the following text for AI-generated patterns and return a detailed JSON analysis.

TEXT TO ANALYZE:
"""
${text}
"""

Analyze this text and return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "aiLikenessScore": <integer 0-100, where 100 = definitely AI written, 0 = definitely human>,
  "suspiciousSentences": [
    {
      "text": "<exact sentence from the text>",
      "reason": "<specific reason why this sounds AI-generated>",
      "suggestion": "<a more human-sounding alternative for this sentence>"
    }
  ],
  "metrics": {
    "burstiness": <integer 0-100, measures variation in sentence length - low burstiness = AI pattern>,
    "perplexity": <integer 0-100, measures text predictability - low perplexity = AI pattern>,
    "sentenceVariance": <integer 0-100, measures diversity in sentence structure - low = AI pattern>
  },
  "overallAssessment": "<brief 1-2 sentence assessment>"
}

Scoring guidelines:
- aiLikenessScore 80-100: Clearly AI-generated (uniform sentence length, no personality, overly formal)
- aiLikenessScore 50-79: Likely AI-generated with some human touches
- aiLikenessScore 20-49: Mixed, some AI patterns detectable
- aiLikenessScore 0-19: Mostly human-written

For burstiness/perplexity/sentenceVariance: higher score = more human-like, lower = more AI-like.
Identify at most 5 most suspicious sentences.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  return await parseJsonResponse(responseText);
}

/**
 * Humanize text based on provided settings
 */
async function humanizeText(text, settings = {}) {
  const model = getModel(settings.geminiModel);
  const prompt = await buildHumanizePrompt(text, settings);
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Streaming version of humanizeText — returns an async iterable of chunks (TC015)
 */
async function humanizeTextStream(text, settings = {}) {
  const model = getModel(settings.geminiModel);
  // Re-use the same prompt building logic by calling humanizeText internals
  // We build the prompt here by temporarily duplicating the prompt construction
  const prompt = await buildHumanizePrompt(text, settings);
  const result = await model.generateContentStream(prompt);
  return result.stream;
}

/**
 * Build the humanize prompt (shared between humanizeText and humanizeTextStream)
 */
async function buildHumanizePrompt(text, settings = {}) {
  const {
    writingStyle = 'casual',
    platform = 'facebook',
    emotionalDepth = 50,
    personalitySlider = 50,
    humor = 30,
    formality = 40,
    imperfections = false,
    humanNoise = false,
    antiAIDetector = false,
    persona = 'beginner',
    culturalTone = 'neutral',
    oneClickMode = null,
    humanFingerprint = {}
  } = settings;

  const styleDescriptions = {
    casual: 'conversational, relaxed, everyday language like talking to a friend',
    professional: 'polished but warm, competent yet approachable, clear and confident',
    storytelling: 'narrative-driven, vivid details, emotional journey, scene-setting',
    opinionated: 'strong voice, direct opinions, bold statements, not afraid to take sides',
    messy_human: 'raw and unfiltered, stream-of-consciousness, occasional tangents, very authentic'
  };

  const platformGuidelines = {
    facebook: 'longer posts okay, personal stories, community feel, emotional hooks, share-worthy',
    tiktok: 'short punchy sentences, trendy language, hooks in first line, Gen-Z energy',
    linkedin: 'professional insight, thought leadership, value-driven, career-relevant',
    twitter: 'concise and punchy, hot takes, hashtag-friendly, quotable, under 280 chars per thought'
  };

  const personaVoices = {
    beginner: 'someone learning and sharing their journey, vulnerable, asks questions, admits mistakes',
    expert: 'authoritative but humble, shares deep insights, uses specific examples from experience',
    influencer: 'charismatic, aspirational, connects deeply with audience, calls to action',
    skeptic: 'questions assumptions, plays devil\'s advocate, challenges popular narratives'
  };

  const culturalContexts = {
    vietnamese: 'incorporate Vietnamese cultural values: family, community, hard work, respect for elders',
    us: 'American directness, individualism, optimism, hustle culture, pop culture references',
    neutral: 'universally relatable, no specific cultural markers, globally accessible'
  };

  const oneclickInstructions = {
    human: 'Focus purely on making this sound authentically human with natural flow and personality.',
    viral: 'Optimize for virality: strong hook, emotional peak, surprising insight, clear CTA, shareable angle.',
    controversial: 'Create tension and debate: challenge conventional wisdom, take bold stance, invite disagreement.',
    relatable: 'Maximum relatability: universal human experiences, "you know that feeling when...", validation.'
  };

  const favoritePhrases = humanFingerprint.favoritePhrases || '';
  const emojiHabits = humanFingerprint.emojiHabits || '';
  const punctuationStyle = humanFingerprint.punctuationStyle || 'normal';
  const sentenceRhythm = humanFingerprint.sentenceRhythm || 'mixed';

  return `You are a master content writer who specializes in making AI-generated text sound completely human and authentic. Transform the following text according to these specific requirements.

ORIGINAL TEXT:
"""
${text}
"""

TRANSFORMATION REQUIREMENTS:

1. WRITING STYLE: ${writingStyle} — ${styleDescriptions[writingStyle] || styleDescriptions.casual}
2. PLATFORM: ${platform} — ${platformGuidelines[platform] || platformGuidelines.facebook}
3. EMOTIONAL DEPTH: ${emotionalDepth}/100 — ${emotionalDepth > 70 ? 'Deep emotional resonance' : emotionalDepth > 40 ? 'Moderate emotional warmth' : 'Subtle emotions, mostly informational'}
4. PERSONALITY: ${personalitySlider}/100 — ${personalitySlider > 70 ? 'Heavy personal anecdotes and strong opinions' : personalitySlider > 40 ? 'Moderate personal touches' : 'Mostly objective with light personal framing'}
5. HUMOR: ${humor}/100 — ${humor > 70 ? 'Include wit and jokes' : humor > 30 ? 'Light touch of humor' : 'Serious tone'}
6. FORMALITY: ${formality}/100 — ${formality > 70 ? 'Formal vocabulary, polished' : formality > 30 ? 'Semi-formal' : 'Very casual, contractions, simple words'}
7. PERSONA: ${persona} — ${personaVoices[persona] || personaVoices.beginner}
8. CULTURAL TONE: ${culturalTone} — ${culturalContexts[culturalTone] || culturalContexts.neutral}
${imperfections ? `9. HUMAN IMPERFECTIONS: Add fragments, self-corrections, grammar looseness, micro contradictions` : ''}
${humanNoise ? `10. HUMAN NOISE: Insert hesitation ("kind of", "maybe", "I guess") and corrections ("actually... wait", "let me rephrase")` : ''}
${antiAIDetector ? `11. ANTI-AI: Vary sentence length dramatically, remove "Furthermore/Moreover/In conclusion", add unpredictable transitions` : ''}
${oneClickMode ? `12. ONE-CLICK MODE — ${oneClickMode.toUpperCase()}: ${oneclickInstructions[oneClickMode]}` : ''}
${favoritePhrases ? `13. SIGNATURE PHRASES: Incorporate naturally: ${favoritePhrases}` : ''}
${emojiHabits ? `14. EMOJI STYLE: ${emojiHabits}` : ''}
${punctuationStyle === 'dramatic' ? '15. PUNCTUATION: Dramatic — ellipses..., em-dashes —, powerful exclamations!' : punctuationStyle === 'minimal' ? '15. PUNCTUATION: Minimal — clean, no excessive marks' : ''}
16. SENTENCE RHYTHM: ${sentenceRhythm === 'mixed' ? 'Mix short punchy and longer flowing sentences' : sentenceRhythm === 'long' ? 'Favor longer descriptive sentences' : 'Short, punchy sentences predominantly'}

OUTPUT INSTRUCTIONS:
- Return ONLY the transformed text, no explanations
- Preserve core message and key information
- Do not add preamble like "Here is the humanized version:"`;
}

/**
 * Score the humanized output
 */
async function scoreOutput(originalText, humanizedText, geminiModel) {
  const model = getModel(geminiModel);

  const prompt = `You are an expert content analyst. Compare the original AI-generated text with the humanized version and score the humanized text.

ORIGINAL TEXT:
"""
${originalText}
"""

HUMANIZED TEXT:
"""
${humanizedText}
"""

Analyze the humanized text and return ONLY valid JSON (no markdown, no explanation) with this structure:
{
  "humanScore": <integer 0-100, how human does this sound? 100 = completely human>,
  "aiDetectability": <integer 0-100, how likely is an AI detector to flag this? 0 = won't be detected, 100 = definitely flagged>,
  "engagementPotential": <integer 0-100, how likely is this to get engagement/shares/comments?>,
  "improvements": [
    "<specific suggestion to make it more human>",
    "<another suggestion>"
  ],
  "strengths": [
    "<what works well about the humanized version>",
    "<another strength>"
  ]
}

Scoring rubric:
- humanScore: Look for personality, imperfections, natural flow, emotional authenticity, varied structure
- aiDetectability: Check for uniform sentence length, formal transitions, lack of personality, predictable patterns
- engagementPotential: Evaluate hook strength, emotional resonance, relatability, share-worthiness

Provide 2-3 improvements and 2-3 strengths maximum.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  return await parseJsonResponse(responseText);
}

/**
 * Build the agent-style prompt.
 * Feeds sample posts from the agent as "style training data" and asks Gemini
 * to mimic that style when transforming the input text.
 */
function buildAgentStylePrompt(text, agent, settings = {}) {
  const posts = agent.posts || [];

  const samples = posts
    .slice(0, 10) // max 10 samples to stay within context limits
    .map((p, i) => `--- Sample ${i + 1}${p.title ? ` (${p.title})` : ''} ---\n${p.content}`)
    .join('\n\n');

  const { platform = agent.platform || 'general', emotionalDepth = 50 } = settings;

  return `You are a writing style analyst and content generator. Your task is to analyze the writing style of a human author from their sample posts, then rewrite the given text in that exact same style.

AUTHOR NAME: "${agent.name}"
${agent.description ? `AUTHOR DESCRIPTION: ${agent.description}` : ''}

═══════════════════════════════════
SAMPLE POSTS FROM THIS AUTHOR (${posts.length} samples):
═══════════════════════════════════
${samples}
═══════════════════════════════════

STEP 1 — ANALYZE THE AUTHOR'S STYLE:
Study the samples above and identify:
- Vocabulary choices: formal/informal, regional slang, favorite words
- Sentence structure: short punchy vs long flowing, fragments, run-ons
- Personality markers: humor, sarcasm, enthusiasm, hesitation phrases
- Punctuation habits: ellipses, exclamation marks, em-dashes
- Emotional tone: vulnerable, confident, questioning, opinionated
- Signature phrases or expressions they repeat
- Opening/closing patterns
- Paragraph rhythm and length

STEP 2 — REWRITE THE FOLLOWING TEXT IN THAT STYLE:
"""
${text}
"""

ADDITIONAL CONTEXT:
- Target platform: ${platform}
- Emotional depth: ${emotionalDepth}/100

OUTPUT INSTRUCTIONS:
- Write ONLY the transformed text — no analysis, no preamble, no meta-commentary
- Sound EXACTLY like the author wrote it themselves
- Preserve the original core message and information
- Do NOT add phrases like "Here is the rewritten text:" or "In [author]'s style:"`;
}

/**
 * Generate text in an agent's learned writing style (batch)
 */
async function generateWithAgentStyle(text, agent, settings = {}) {
  const model = getModel(settings.geminiModel);
  const prompt = buildAgentStylePrompt(text, agent, settings);
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Generate text in an agent's learned writing style (SSE streaming)
 */
async function generateWithAgentStyleStream(text, agent, settings = {}) {
  const model = getModel(settings.geminiModel);
  const prompt = buildAgentStylePrompt(text, agent, settings);
  const result = await model.generateContentStream(prompt);
  return result.stream;
}

module.exports = {
  analyzeText,
  humanizeText,
  humanizeTextStream,
  scoreOutput,
  generateWithAgentStyle,
  generateWithAgentStyleStream
};
