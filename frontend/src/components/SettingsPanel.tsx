'use client';

import { useState } from 'react';
import {
  ChevronDown, ChevronRight, Pen, Monitor, Sliders,
  Zap, User, Globe, Sparkles, Fingerprint
} from 'lucide-react';
import {
  HumanizeSettings, WritingStyle, Platform, Persona,
  CulturalTone, OneClickMode
} from '@/types';

interface SettingsPanelProps {
  settings: HumanizeSettings;
  onChange: (settings: HumanizeSettings) => void;
  onOneClickHumanize?: (settings: HumanizeSettings) => void;
  disabled?: boolean;
  agentActive?: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-900/50 hover:bg-gray-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-violet-400">{icon}</span>
          <span className="text-sm font-medium text-gray-200">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="p-3 border-t border-gray-800 bg-gray-900/20">
          {children}
        </div>
      )}
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
  disabled?: boolean;
}

function Slider({ label, value, onChange, min = 0, max = 100, lowLabel, highLabel, disabled }: SliderProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-mono text-violet-400">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-violet-500 disabled:opacity-40"
      />
      {(lowLabel || highLabel) && (
        <div className="flex justify-between">
          <span className="text-xs text-gray-600">{lowLabel}</span>
          <span className="text-xs text-gray-600">{highLabel}</span>
        </div>
      )}
    </div>
  );
}

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function Toggle({ label, description, checked, onChange, disabled }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm text-gray-300">{label}</div>
        {description && <div className="text-xs text-gray-500 mt-0.5">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-40 ${
          checked ? 'bg-violet-600' : 'bg-gray-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

const writingStyles: { value: WritingStyle; label: string; emoji: string; desc: string }[] = [
  { value: 'casual', label: 'Casual', emoji: '😊', desc: 'Friendly & relaxed' },
  { value: 'professional', label: 'Professional', emoji: '💼', desc: 'Polished & confident' },
  { value: 'storytelling', label: 'Storytelling', emoji: '📖', desc: 'Narrative & vivid' },
  { value: 'opinionated', label: 'Opinionated', emoji: '🔥', desc: 'Bold & direct' },
  { value: 'messy_human', label: 'Messy Human', emoji: '🌀', desc: 'Raw & authentic' },
];

const platforms: { value: Platform; label: string; emoji: string }[] = [
  { value: 'facebook', label: 'Facebook', emoji: '📘' },
  { value: 'tiktok', label: 'TikTok', emoji: '🎵' },
  { value: 'linkedin', label: 'LinkedIn', emoji: '💼' },
  { value: 'twitter', label: 'Twitter/X', emoji: '🐦' },
];

const personas: { value: Persona; label: string; desc: string }[] = [
  { value: 'beginner', label: 'Beginner', desc: 'Learning & vulnerable' },
  { value: 'expert', label: 'Expert', desc: 'Authoritative & insightful' },
  { value: 'influencer', label: 'Influencer', desc: 'Charismatic & aspirational' },
  { value: 'skeptic', label: 'Skeptic', desc: 'Questioning & bold' },
];

const culturalTones: { value: CulturalTone; label: string; emoji: string }[] = [
  { value: 'neutral', label: 'Neutral', emoji: '🌍' },
  { value: 'us', label: 'US / Western', emoji: '🇺🇸' },
  { value: 'vietnamese', label: 'Vietnamese', emoji: '🇻🇳' },
];

const oneclickModes: { value: OneClickMode; label: string; emoji: string; color: string }[] = [
  { value: 'human', label: 'Make it Human', emoji: '🧠', color: 'from-violet-600 to-purple-600' },
  { value: 'viral', label: 'Make it Viral', emoji: '🚀', color: 'from-pink-600 to-rose-600' },
  { value: 'controversial', label: 'Make it Controversial', emoji: '⚡', color: 'from-orange-600 to-amber-600' },
  { value: 'relatable', label: 'Make it Relatable', emoji: '❤️', color: 'from-emerald-600 to-teal-600' },
];

export default function SettingsPanel({ settings, onChange, onOneClickHumanize, disabled = false, agentActive = false }: SettingsPanelProps) {
  const update = (partial: Partial<HumanizeSettings>) => {
    onChange({ ...settings, ...partial });
  };

  const updateFingerprint = (partial: Partial<HumanizeSettings['humanFingerprint']>) => {
    onChange({
      ...settings,
      humanFingerprint: { ...settings.humanFingerprint, ...partial }
    });
  };

  const applyOneClickMode = (mode: OneClickMode, onApply?: (s: HumanizeSettings) => void) => {
    const modePresets: Record<OneClickMode, Partial<HumanizeSettings>> = {
      human: {
        writingStyle: 'casual',
        emotionalDepth: 70,
        personalitySlider: 65,
        imperfections: true,
        humanNoise: true,
        antiAIDetector: true,
        persona: 'beginner',
        oneClickMode: 'human'
      },
      viral: {
        writingStyle: 'storytelling',
        platform: 'tiktok',
        emotionalDepth: 90,
        personalitySlider: 85,
        imperfections: false,
        humanNoise: false,
        antiAIDetector: true,
        persona: 'influencer',
        culturalTone: 'us',
        oneClickMode: 'viral'
      },
      controversial: {
        writingStyle: 'opinionated',
        platform: 'twitter',
        emotionalDepth: 85,
        personalitySlider: 80,
        imperfections: true,
        humanNoise: false,
        persona: 'skeptic',
        culturalTone: 'us',
        oneClickMode: 'controversial'
      },
      relatable: {
        writingStyle: 'messy_human',
        platform: 'facebook',
        emotionalDepth: 80,
        personalitySlider: 75,
        imperfections: true,
        humanNoise: true,
        antiAIDetector: true,
        persona: 'beginner',
        oneClickMode: 'relatable'
      }
    };

    const newSettings = { ...settings, ...modePresets[mode] };
    onChange(newSettings);
    onApply?.(newSettings);
  };

  return (
    <div className="relative space-y-2 overflow-y-auto max-h-full">
      {/* Agent active overlay */}
      {agentActive && (
        <div className="absolute inset-0 z-10 bg-gray-950/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-3 p-4">
          <div className="w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/50 flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-violet-300">AI Agent đang hoạt động</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Cài đặt bị tắt khi dùng Agent.<br />Tắt Agent để dùng cài đặt thủ công.
            </p>
          </div>
        </div>
      )}
      {/* One-Click Modes */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Modes</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {oneclickModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => applyOneClickMode(mode.value, onOneClickHumanize)}
              disabled={disabled}
              className={`relative p-2.5 rounded-lg text-white text-xs font-medium transition-all disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-br ${mode.color} ${
                settings.oneClickMode === mode.value
                  ? 'ring-2 ring-white/40 shadow-lg'
                  : 'opacity-80 hover:opacity-100'
              }`}
            >
              <div className="text-base mb-0.5">{mode.emoji}</div>
              <div className="leading-tight">{mode.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-800 pt-2 space-y-2">
        {/* Writing Style */}
        <CollapsibleSection
          title="Writing Style"
          icon={<Pen className="w-4 h-4" />}
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 gap-1.5">
            {writingStyles.map((style) => (
              <button
                key={style.value}
                onClick={() => update({ writingStyle: style.value, oneClickMode: null })}
                disabled={disabled}
                className={`flex items-center gap-2.5 p-2 rounded-lg text-left transition-all disabled:opacity-40 ${
                  settings.writingStyle === style.value
                    ? 'bg-violet-600/30 border border-violet-500/50 text-violet-200'
                    : 'bg-gray-800/50 border border-transparent hover:border-gray-700 text-gray-400 hover:text-gray-300'
                }`}
              >
                <span className="text-lg">{style.emoji}</span>
                <div>
                  <div className="text-xs font-medium">{style.label}</div>
                  <div className="text-xs opacity-60">{style.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </CollapsibleSection>

        {/* Platform */}
        <CollapsibleSection
          title="Platform"
          icon={<Monitor className="w-4 h-4" />}
          defaultOpen={true}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {platforms.map((p) => (
              <button
                key={p.value}
                onClick={() => update({ platform: p.value })}
                disabled={disabled}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40 ${
                  settings.platform === p.value
                    ? 'bg-violet-600/30 border border-violet-500/50 text-violet-200'
                    : 'bg-gray-800/50 border border-transparent hover:border-gray-700 text-gray-400 hover:text-gray-300'
                }`}
              >
                <span>{p.emoji}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </CollapsibleSection>

        {/* Sliders */}
        <CollapsibleSection
          title="Intensity"
          icon={<Sliders className="w-4 h-4" />}
        >
          <div className="space-y-4">
            <Slider
              label="Emotional Depth"
              value={settings.emotionalDepth}
              onChange={(v) => update({ emotionalDepth: v })}
              lowLabel="Neutral"
              highLabel="Deep"
              disabled={disabled}
            />
            <Slider
              label="Personality"
              value={settings.personalitySlider}
              onChange={(v) => update({ personalitySlider: v })}
              lowLabel="Objective"
              highLabel="Personal"
              disabled={disabled}
            />
            <Slider
              label="Humor Level"
              value={settings.humor}
              onChange={(v) => update({ humor: v })}
              lowLabel="Serious"
              highLabel="Funny"
              disabled={disabled}
            />
            <Slider
              label="Formality"
              value={settings.formality}
              onChange={(v) => update({ formality: v })}
              lowLabel="Casual"
              highLabel="Formal"
              disabled={disabled}
            />
          </div>
        </CollapsibleSection>

        {/* Toggles */}
        <CollapsibleSection
          title="Features"
          icon={<Zap className="w-4 h-4" />}
        >
          <div className="space-y-3">
            <Toggle
              label="Human Imperfections"
              description="Add grammar looseness, fragments, micro contradictions"
              checked={settings.imperfections}
              onChange={(v) => update({ imperfections: v })}
              disabled={disabled}
            />
            <Toggle
              label="Human Noise Injection"
              description='Insert hesitation ("kind of", "maybe") & corrections ("actually… wait")'
              checked={settings.humanNoise}
              onChange={(v) => update({ humanNoise: v })}
              disabled={disabled}
            />
            <Toggle
              label="Anti-AI Detector"
              description="Actively avoid AI detection patterns"
              checked={settings.antiAIDetector}
              onChange={(v) => update({ antiAIDetector: v })}
              disabled={disabled}
            />
          </div>
        </CollapsibleSection>

        {/* Persona */}
        <CollapsibleSection
          title="Persona"
          icon={<User className="w-4 h-4" />}
        >
          <div className="space-y-1.5">
            {personas.map((p) => (
              <button
                key={p.value}
                onClick={() => update({ persona: p.value })}
                disabled={disabled}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all disabled:opacity-40 ${
                  settings.persona === p.value
                    ? 'bg-violet-600/30 border border-violet-500/50 text-violet-200'
                    : 'bg-gray-800/50 border border-transparent hover:border-gray-700 text-gray-400 hover:text-gray-300'
                }`}
              >
                <span className="font-medium">{p.label}</span>
                <span className="opacity-60">{p.desc}</span>
              </button>
            ))}
          </div>
        </CollapsibleSection>

        {/* Cultural Tone */}
        <CollapsibleSection
          title="Cultural Tone"
          icon={<Globe className="w-4 h-4" />}
        >
          <div className="grid grid-cols-3 gap-1.5">
            {culturalTones.map((t) => (
              <button
                key={t.value}
                onClick={() => update({ culturalTone: t.value })}
                disabled={disabled}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all disabled:opacity-40 ${
                  settings.culturalTone === t.value
                    ? 'bg-violet-600/30 border border-violet-500/50 text-violet-200'
                    : 'bg-gray-800/50 border border-transparent hover:border-gray-700 text-gray-400 hover:text-gray-300'
                }`}
              >
                <span className="text-lg">{t.emoji}</span>
                <span className="text-center leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </CollapsibleSection>

        {/* Human Fingerprint */}
        <CollapsibleSection
          title="Human Fingerprint"
          icon={<Fingerprint className="w-4 h-4" />}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Favorite Phrases</label>
              <input
                type="text"
                value={settings.humanFingerprint.favoritePhrases}
                onChange={(e) => updateFingerprint({ favoritePhrases: e.target.value })}
                disabled={disabled}
                placeholder="e.g., honestly, look, the thing is..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-violet-500 disabled:opacity-40"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Emoji Habits</label>
              <input
                type="text"
                value={settings.humanFingerprint.emojiHabits}
                onChange={(e) => updateFingerprint({ emojiHabits: e.target.value })}
                disabled={disabled}
                placeholder="e.g., 😅 at end of funny points, ❤️ for warmth"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-violet-500 disabled:opacity-40"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Punctuation Style</label>
              <div className="grid grid-cols-3 gap-1">
                {(['normal', 'dramatic', 'minimal'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => updateFingerprint({ punctuationStyle: style })}
                    disabled={disabled}
                    className={`p-1.5 rounded-lg text-xs capitalize transition-all disabled:opacity-40 ${
                      settings.humanFingerprint.punctuationStyle === style
                        ? 'bg-violet-600/30 border border-violet-500/50 text-violet-200'
                        : 'bg-gray-800 border border-gray-700 text-gray-500 hover:text-gray-400'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Sentence Rhythm</label>
              <div className="grid grid-cols-3 gap-1">
                {([
                  { value: 'mixed', label: 'Mixed' },
                  { value: 'long', label: 'Long' },
                  { value: 'short', label: 'Short' },
                ] as const).map((r) => (
                  <button
                    key={r.value}
                    onClick={() => updateFingerprint({ sentenceRhythm: r.value })}
                    disabled={disabled}
                    className={`p-1.5 rounded-lg text-xs transition-all disabled:opacity-40 ${
                      settings.humanFingerprint.sentenceRhythm === r.value
                        ? 'bg-violet-600/30 border border-violet-500/50 text-violet-200'
                        : 'bg-gray-800 border border-gray-700 text-gray-500 hover:text-gray-400'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
