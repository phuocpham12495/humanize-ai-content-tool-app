'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Film, Wand2, ImageIcon, Sparkles, Loader2, AlertCircle,
  Copy, Check, RefreshCw, Settings2, ChevronDown, ChevronUp,
  Clapperboard, ExternalLink
} from 'lucide-react';
import { generateVideoPrompts } from '@/lib/api';
import {
  VideoSettings, VideoSlotState, VisualStyle, ContentType,
  defaultVideoSettings
} from '@/types';

// ── Constants ────────────────────────────────────────────────────────────────

const VISUAL_STYLES: { value: VisualStyle; label: string; emoji: string; desc: string }[] = [
  { value: 'anime',  label: 'Anime',  emoji: '🎌', desc: 'Studio Ghibli, vibrant' },
  { value: 'pixar',  label: 'Pixar',  emoji: '🎬', desc: '3D, warm cinematic' },
  { value: 'pixel',  label: 'Pixel',  emoji: '🕹️', desc: '16-bit retro game' },
  { value: 'custom', label: 'Custom', emoji: '✏️', desc: 'Your own style prompt' },
];

const CONTENT_TYPES: { value: ContentType; label: string; emoji: string; desc: string }[] = [
  { value: 'storytelling', label: 'Kể chuyện', emoji: '📖', desc: 'Cảnh narrative cinematic' },
  { value: 'quote',        label: 'Quote',     emoji: '💬', desc: 'Cảnh tĩnh lặng, ẩn dụ' },
  { value: 'meme',         label: 'Meme',      emoji: '😂', desc: 'Cảnh hài, relatable' },
  { value: 'custom',       label: 'Custom',    emoji: '✏️', desc: 'Prompt nội dung riêng' },
];

// ── Copy Button ───────────────────────────────────────────────────────────────

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
        copied
          ? 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-300'
          : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
      } ${className}`}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Đã copy!' : 'Copy Prompt'}
    </button>
  );
}

// ── Video Prompt Card ─────────────────────────────────────────────────────────

function VideoPromptCard({ slot }: { slot: VideoSlotState }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-cyan-800/40 rounded-xl overflow-hidden bg-gray-900/50">
      {/* Card header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-cyan-950/60 to-blue-950/40 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center">
            <Film className="w-3 h-3 text-cyan-400" />
          </div>
          <span className="text-xs font-semibold text-cyan-300">Video #{slot.index + 1}</span>
        </div>
        <div className="flex items-center gap-2">
          {slot.veoPrompt && <CopyButton text={slot.veoPrompt} />}
          {expanded
            ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
            : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          }
        </div>
      </div>

      {expanded && (
        <div className="p-3 space-y-3">
          {/* Veo3 Prompt */}
          {slot.veoPrompt && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Clapperboard className="w-3 h-3 text-cyan-500" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Veo3 Prompt</span>
              </div>
              <div className="relative group">
                <p className="text-xs text-gray-200 leading-relaxed bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2.5 font-mono">
                  {slot.veoPrompt}
                </p>
              </div>
            </div>
          )}

          {/* Formula breakdown hint */}
          {slot.veoPrompt && (
            <div className="flex items-start gap-1.5 p-2 bg-gray-800/30 rounded-lg border border-gray-800">
              <ExternalLink className="w-3 h-3 text-gray-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600 leading-relaxed">
                Dùng prompt này trong <span className="text-cyan-600 font-medium">Google Veo 3</span> tại <span className="text-gray-500">labs.google/veo</span>
              </p>
            </div>
          )}

          {/* Caption */}
          {slot.caption && (
            <div className="relative group flex items-start gap-2 px-3 py-2.5 bg-gradient-to-r from-violet-950/60 to-purple-950/40 border border-violet-700/40 rounded-xl">
              <span className="text-violet-400 text-lg leading-none mt-0.5 flex-shrink-0">"</span>
              <p className="flex-1 text-sm font-medium text-gray-200 leading-snug italic">{slot.caption}</p>
              <span className="text-violet-400 text-lg leading-none self-end flex-shrink-0">"</span>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(slot.caption!);
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white"
                title="Copy caption"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Formula Reference ─────────────────────────────────────────────────────────

function FormulaReference() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-900/60 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Clapperboard className="w-3.5 h-3.5" />
          Công thức Veo3 prompt
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <div className="px-3 py-2.5 space-y-1.5 bg-gray-900/30 text-xs text-gray-500">
          <p className="font-mono text-gray-400 text-xs">
            [Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]
          </p>
          <div className="grid grid-cols-1 gap-1 mt-2">
            {[
              ['Cinematography', 'Camera work & shot — Medium shot, Close-up, Tracking shot, Crane shot'],
              ['Subject', 'Main character or focal point'],
              ['Action', 'What the subject is doing (vivid & specific)'],
              ['Context', 'Environment, setting, background'],
              ['Style & Ambiance', 'Aesthetic, mood, lighting'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-cyan-600 font-medium w-24 flex-shrink-0">{k}:</span>
                <span className="text-gray-600">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface VideoGeneratorProps {
  humanizedText: string;
}

export default function VideoGenerator({ humanizedText }: VideoGeneratorProps) {
  const [settings, setSettings] = useState<VideoSettings>(defaultVideoSettings);
  const [slots, setSlots] = useState<VideoSlotState[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  // Reset when count changes
  useEffect(() => {
    setGenerated(false);
    setSlots([]);
  }, [settings.count]);

  // Reset when key settings change
  useEffect(() => {
    setGenerated(false);
    setSlots([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.visualStyle, settings.contentType, settings.customVisualPrompt, settings.customContentPrompt]);

  const updateSettings = (patch: Partial<VideoSettings>) =>
    setSettings(prev => ({ ...prev, ...patch }));

  const handleGenerate = useCallback(async () => {
    if (!humanizedText.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await generateVideoPrompts(humanizedText, settings);
      setSlots(res.prompts.map(p => ({
        status: 'done',
        veoPrompt: p.veoPrompt,
        caption: p.caption,
        index: p.index,
      })));
      setGenerated(true);
    } catch (err: any) {
      setError(err.details || err.message || 'Lỗi tạo video prompt');
    } finally {
      setIsGenerating(false);
    }
  }, [humanizedText, settings]);

  const hasText = humanizedText.trim().length > 0;

  return (
    <div className="flex flex-col gap-4 overflow-y-auto">

      {/* Header */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Film className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-semibold text-gray-200">Video Prompt Generator</span>
        <span className="ml-auto text-xs text-gray-600">Veo3 Formula</span>
      </div>

      {!hasText && (
        <div className="flex items-center gap-2 p-3 bg-yellow-950/40 border border-yellow-800/50 rounded-xl text-xs text-yellow-300">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Humanize bài viết trước để tạo video prompt từ nội dung đó.
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Formula reference */}
      <FormulaReference />

      {/* Settings */}
      <div className="space-y-3 flex-shrink-0">

        {/* Count */}
        <div className="p-3 bg-gray-900/50 border border-gray-800 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <Settings2 className="w-3.5 h-3.5" />
            Số lượng video prompt
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range" min={1} max={12} value={settings.count}
              onChange={e => updateSettings({ count: Number(e.target.value) })}
              className="flex-1 h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="text-sm font-bold text-cyan-400 w-5 text-right">{settings.count}</span>
          </div>
        </div>

        {/* Visual Style */}
        <div className="p-3 bg-gray-900/50 border border-gray-800 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <Wand2 className="w-3.5 h-3.5" />
            Phong cách hình ảnh
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {VISUAL_STYLES.map(s => (
              <button key={s.value} onClick={() => updateSettings({ visualStyle: s.value })}
                className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                  settings.visualStyle === s.value
                    ? 'bg-cyan-600/20 border border-cyan-500/50 text-cyan-200'
                    : 'bg-gray-800/60 border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'
                }`}>
                <span className="text-base">{s.emoji}</span>
                <div>
                  <div className="text-xs font-medium">{s.label}</div>
                  <div className="text-xs opacity-60">{s.desc}</div>
                </div>
              </button>
            ))}
          </div>
          {settings.visualStyle === 'custom' && (
            <textarea
              placeholder="Mô tả phong cách hình ảnh... (vd: watercolor animation, soft dreamy colors, painterly strokes)"
              value={settings.customVisualPrompt}
              onChange={e => updateSettings({ customVisualPrompt: e.target.value })}
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500 resize-none"
            />
          )}
        </div>

        {/* Content Type */}
        <div className="p-3 bg-gray-900/50 border border-gray-800 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <ImageIcon className="w-3.5 h-3.5" />
            Phong cách nội dung
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {CONTENT_TYPES.map(t => (
              <button key={t.value} onClick={() => updateSettings({ contentType: t.value })}
                className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                  settings.contentType === t.value
                    ? 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-200'
                    : 'bg-gray-800/60 border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'
                }`}>
                <span className="text-base">{t.emoji}</span>
                <div>
                  <div className="text-xs font-medium">{t.label}</div>
                  <div className="text-xs opacity-60">{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
          {settings.contentType === 'custom' && (
            <textarea
              placeholder="Mô tả nội dung video... (vd: show a person achieving their goal after long struggle)"
              value={settings.customContentPrompt}
              onChange={e => updateSettings({ customContentPrompt: e.target.value })}
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none"
            />
          )}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!hasText || isGenerating}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/30"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tạo {settings.count} video prompt...
          </>
        ) : generated ? (
          <>
            <RefreshCw className="w-4 h-4" />
            Tạo lại {settings.count} video prompt
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate {settings.count} Video Prompt
          </>
        )}
      </button>

      {/* Results */}
      {slots.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Film className="w-3.5 h-3.5 text-cyan-600" />
            <span>{slots.length} video prompt đã tạo — copy và dùng trong Veo3</span>
          </div>
          {slots.map(slot => (
            <VideoPromptCard key={slot.index} slot={slot} />
          ))}
        </div>
      )}
    </div>
  );
}
