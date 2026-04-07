// Writing style options
export type WritingStyle = 'casual' | 'professional' | 'storytelling' | 'opinionated' | 'messy_human';

// Platform options
export type Platform = 'facebook' | 'tiktok' | 'linkedin' | 'twitter';

// Persona options
export type Persona = 'beginner' | 'expert' | 'influencer' | 'skeptic';

// Cultural tone options
export type CulturalTone = 'vietnamese' | 'us' | 'neutral';

// One-click mode options
export type OneClickMode = 'human' | 'viral' | 'controversial' | 'relatable';

// Human fingerprint customization
export interface HumanFingerprint {
  favoritePhrases: string;
  emojiHabits: string;
  punctuationStyle: 'normal' | 'dramatic' | 'minimal';
  sentenceRhythm: 'mixed' | 'long' | 'short';
}

// Settings for humanization
export interface HumanizeSettings {
  writingStyle: WritingStyle;
  platform: Platform;
  emotionalDepth: number; // 0-100
  humor: number; // 0-100
  formality: number; // 0-100
  personalitySlider: number; // 0-100: how much personal anecdotes/opinions to inject
  imperfections: boolean;
  humanNoise: boolean; // inject hesitation/correction phrases like "kind of", "actually... wait"
  antiAIDetector: boolean;
  persona: Persona;
  culturalTone: CulturalTone;
  oneClickMode: OneClickMode | null;
  humanFingerprint: HumanFingerprint;
}

// Default settings
export const defaultSettings: HumanizeSettings = {
  writingStyle: 'casual',
  platform: 'facebook',
  emotionalDepth: 50,
  humor: 30,
  formality: 40,
  personalitySlider: 50,
  imperfections: false,
  humanNoise: false,
  antiAIDetector: false,
  persona: 'beginner',
  culturalTone: 'neutral',
  oneClickMode: null,
  humanFingerprint: {
    favoritePhrases: '',
    emojiHabits: '',
    punctuationStyle: 'normal',
    sentenceRhythm: 'mixed'
  }
};

// Analysis metrics
export interface AnalysisMetrics {
  burstiness: number;
  perplexity: number;
  sentenceVariance: number;
}

// Suspicious sentence from analysis
export interface SuspiciousSentence {
  text: string;
  reason: string;
  suggestion?: string; // human-alternative suggestion
}

// Full analysis result
export interface AnalysisResult {
  aiLikenessScore: number;
  suspiciousSentences: SuspiciousSentence[];
  metrics: AnalysisMetrics;
  overallAssessment?: string;
}

// Scores for humanized output
export interface OutputScores {
  humanScore: number;
  aiDetectability: number;
  engagementPotential: number;
  improvements?: string[];
  strengths?: string[];
}

// Humanize API response
export interface HumanizeResponse {
  success: boolean;
  sessionId: string;
  historyId: number;
  originalText: string;
  humanizedText: string;
  scores: OutputScores;
  settings: HumanizeSettings;
}

// Analyze API response
export interface AnalyzeResponse {
  success: boolean;
  sessionId: string;
  analysis: AnalysisResult;
}

// Mode config from database
export interface ModeConfig {
  id: number;
  name: string;
  parameters: Partial<HumanizeSettings> & {
    description?: string;
  };
  created_at: string;
}

// ── AI Agent types ────────────────────────────────────────────────────────────

export interface AgentPost {
  id: number;
  agent_id: number;
  title: string;
  content: string;
  platform: string;
  created_at: string;
}

export interface Agent {
  id: number;
  name: string;
  description: string;
  avatar_emoji: string;
  platform: string;
  created_at: string;
  updated_at: string;
  post_count?: number; // from listAgents
  posts?: AgentPost[]; // from getAgent
}

export interface AgentFormData {
  name: string;
  description: string;
  avatar_emoji: string;
  platform: string;
}

export interface AgentPostFormData {
  title: string;
  content: string;
  platform: string;
}

// ── App state ─────────────────────────────────────────────────────────────────

// App state
export interface AppState {
  inputText: string;
  humanizedText: string;
  isAnalyzing: boolean;
  isHumanizing: boolean;
  analysis: AnalysisResult | null;
  scores: OutputScores | null;
  settings: HumanizeSettings;
  sessionId: string | null;
  error: string | null;
  activeView: 'output' | 'comparison' | 'analysis';
}
