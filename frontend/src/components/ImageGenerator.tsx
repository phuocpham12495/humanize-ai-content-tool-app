'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ImageIcon, Upload, X, Sparkles, Download, RefreshCw,
  Loader2, ChevronDown, AlertCircle, Settings2, Wand2,
  FileText, CheckCircle2, Edit3, Copy, Check
} from 'lucide-react';
import { generateImage as generateImageApi, generateImagePrompts } from '@/lib/api';
import {
  ImageSettings, ImageSlotState, VisualStyle, ContentType, AspectRatio,
  defaultImageSettings
} from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const VISUAL_STYLES: { value: VisualStyle; label: string; emoji: string; desc: string }[] = [
  { value: 'anime',  label: 'Anime',  emoji: '🎌', desc: 'Studio Ghibli, vibrant' },
  { value: 'pixar',  label: 'Pixar',  emoji: '🎬', desc: '3D, warm cinematic' },
  { value: 'pixel',  label: 'Pixel',  emoji: '🕹️', desc: '16-bit retro game art' },
  { value: 'custom', label: 'Custom', emoji: '✏️', desc: 'Your own style prompt' },
];

const CONTENT_TYPES: { value: ContentType; label: string; emoji: string; desc: string }[] = [
  { value: 'storytelling', label: 'Kể chuyện', emoji: '📖', desc: 'Cảnh cinematic từ bài viết' },
  { value: 'quote',        label: 'Quote',     emoji: '💬', desc: 'Card trích dẫn nổi bật' },
  { value: 'meme',         label: 'Meme',      emoji: '😂', desc: 'Hình hài hước, relatable' },
  { value: 'custom',       label: 'Custom',    emoji: '✏️', desc: 'Prompt nội dung riêng' },
];

const ASPECT_RATIOS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: '1:1',  label: '1:1',  icon: '⬛' },
  { value: '4:3',  label: '4:3',  icon: '🟥' },
  { value: '16:9', label: '16:9', icon: '▬' },
  { value: '9:16', label: '9:16', icon: '▮' },
];

// ── Canvas: overlay logo onto image ──────────────────────────────────────────

/**
 * Remove white/near-white background from a logo by making those pixels transparent.
 * Returns a new data URL with the background removed.
 */
function removeWhiteBackground(logoDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, c.width, c.height);
      const d = imageData.data;
      const threshold = 240; // pixels with R,G,B all >= threshold are considered "white"
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] >= threshold && d[i + 1] >= threshold && d[i + 2] >= threshold) {
          d[i + 3] = 0; // set alpha to 0
        }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(logoDataUrl);
    img.src = logoDataUrl;
  });
}

async function overlayLogo(imageDataUrl: string, logoDataUrl: string): Promise<string> {
  // Pre-process logo: remove white background
  const cleanLogoUrl = await removeWhiteBackground(logoDataUrl);

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const logo = new Image();
      logo.onload = () => {
        const maxLogoW = img.width * 0.18;
        const scale = Math.min(1, maxLogoW / logo.width);
        const lw = logo.width * scale;
        const lh = logo.height * scale;
        const margin = img.width * 0.02;
        ctx.globalAlpha = 0.85;
        ctx.drawImage(logo, img.width - lw - margin, img.height - lh - margin, lw, lh);
        ctx.globalAlpha = 1;
        resolve(canvas.toDataURL('image/png'));
      };
      logo.onerror = () => resolve(imageDataUrl);
      logo.src = cleanLogoUrl;
    };
    img.src = imageDataUrl;
  });
}

// ── Caption Card ─────────────────────────────────────────────────────────────

function CaptionCard({ caption }: { caption: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group flex items-start gap-2 px-3 py-2.5 bg-gradient-to-r from-violet-950/60 to-purple-950/40 border border-violet-700/40 rounded-xl">
      <span className="text-violet-400 text-lg leading-none mt-0.5 flex-shrink-0">"</span>
      <p className="flex-1 text-sm font-medium text-gray-200 leading-snug italic">{caption}</p>
      <span className="text-violet-400 text-lg leading-none self-end flex-shrink-0">"</span>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white"
        title="Copy caption"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
}

// ── Image Slot ────────────────────────────────────────────────────────────────

interface ImageSlotProps {
  index: number;
  slot: ImageSlotState;
  onGenerate: (index: number) => void;
  onDownload: (index: number) => void;
  onEditPrompt: (index: number, prompt: string, concept: string) => void;
  disabled: boolean;
  aspectRatio: AspectRatio;
  caption?: string;
}

function ImageSlot({ index, slot, onGenerate, onDownload, onEditPrompt, disabled, aspectRatio, caption }: ImageSlotProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState('');
  const [draftConcept, setDraftConcept] = useState('');

  const hasPrompt = !!(slot.prebuiltPrompt || slot.prompt);
  const displayPrompt = slot.prebuiltPrompt || slot.prompt || '';
  const displayConcept = slot.prebuiltConcept || slot.concept || '';

  const aspectClass: Record<AspectRatio, string> = {
    '1:1':  'aspect-square',
    '4:3':  'aspect-[4/3]',
    '16:9': 'aspect-video',
    '9:16': 'aspect-[9/16]',
  };

  const startEdit = () => {
    setDraftPrompt(displayPrompt);
    setDraftConcept(displayConcept);
    setEditingPrompt(true);
    setShowPrompt(true);
  };

  const saveEdit = () => {
    onEditPrompt(index, draftPrompt, draftConcept);
    setEditingPrompt(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Slot label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500">Ảnh #{index + 1}</span>
          {hasPrompt && !slot.dataUrl && (
            <span className="flex items-center gap-0.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> Prompt sẵn sàng
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {hasPrompt && (
            <>
              <button
                onClick={startEdit}
                className="text-xs text-gray-600 hover:text-violet-400 transition-colors flex items-center gap-0.5"
                title="Chỉnh sửa prompt"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setShowPrompt(v => !v)}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-0.5"
              >
                Prompt <ChevronDown className={`w-3 h-3 transition-transform ${showPrompt ? 'rotate-180' : ''}`} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Prompt reveal / edit */}
      {showPrompt && hasPrompt && (
        <div className="p-2 bg-gray-900/60 border border-gray-800 rounded-lg space-y-1.5">
          {editingPrompt ? (
            <>
              <p className="text-xs text-gray-500 font-medium">Concept:</p>
              <textarea
                value={draftConcept}
                onChange={e => setDraftConcept(e.target.value)}
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-violet-500 resize-none"
              />
              <p className="text-xs text-gray-500 font-medium">Full Imagen Prompt:</p>
              <textarea
                value={draftPrompt}
                onChange={e => setDraftPrompt(e.target.value)}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-violet-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  className="flex-1 py-1 rounded text-xs bg-violet-600 hover:bg-violet-500 text-white font-medium"
                >
                  Lưu
                </button>
                <button
                  onClick={() => setEditingPrompt(false)}
                  className="flex-1 py-1 rounded text-xs bg-gray-800 hover:bg-gray-700 text-gray-400"
                >
                  Hủy
                </button>
              </div>
            </>
          ) : (
            <>
              {displayConcept && (
                <>
                  <p className="text-xs text-gray-500 font-medium">Concept:</p>
                  <p className="text-xs text-gray-400 italic">{displayConcept}</p>
                </>
              )}
              {displayPrompt && displayPrompt !== displayConcept && (
                <>
                  <p className="text-xs text-gray-500 font-medium mt-1">Prompt:</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{displayPrompt}</p>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Image area */}
      <div className={`relative w-full ${aspectClass[aspectRatio]} bg-gray-900 border ${hasPrompt && slot.status === 'empty' ? 'border-emerald-800/50' : 'border-gray-800'} rounded-xl overflow-hidden`}>
        {slot.status === 'done' && slot.dataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slot.dataUrl} alt={`Generated image ${index + 1}`} className="w-full h-full object-cover" />
        )}

        {slot.status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900/80">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            <p className="text-xs text-gray-400">Đang tạo ảnh...</p>
            <p className="text-xs text-gray-600">Imagen 4 Fast</p>
          </div>
        )}

        {slot.status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-xs text-red-300 text-center">{slot.error}</p>
          </div>
        )}

        {slot.status === 'empty' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 border border-dashed border-gray-700 rounded-xl">
            {hasPrompt ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <p className="text-xs text-emerald-700">Prompt đã tạo</p>
                <p className="text-xs text-gray-600">Nhấn Generate để tạo ảnh</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-gray-700" />
                <p className="text-xs text-gray-600">Chưa tạo</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onGenerate(index)}
          disabled={disabled || slot.status === 'loading'}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white"
        >
          {slot.status === 'loading'
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : slot.status === 'done'
              ? <RefreshCw className="w-3.5 h-3.5" />
              : <Sparkles className="w-3.5 h-3.5" />
          }
          {slot.status === 'done' ? 'Tạo lại' : 'Generate'}
        </button>

        {slot.status === 'done' && (
          <button
            onClick={() => onDownload(index)}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
            title="Tải ảnh"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Caption card — shown once prompt is generated */}
      {caption && <CaptionCard caption={caption} />}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface ImageGeneratorProps {
  humanizedText: string;
  geminiModel?: string;
  geminiImageModel?: string;
}

export default function ImageGenerator({ humanizedText, geminiModel, geminiImageModel }: ImageGeneratorProps) {
  const [settings, setSettings] = useState<ImageSettings>(defaultImageSettings);
  const [slots, setSlots] = useState<ImageSlotState[]>(
    Array.from({ length: defaultImageSettings.count }, () => ({ status: 'empty' }))
  );
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoName, setLogoName] = useState('');
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [promptsGenerated, setPromptsGenerated] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Sync slot count when settings.count changes — preserve existing prompt data
  useEffect(() => {
    setSlots(prev => {
      const next = Array.from({ length: settings.count }, (_, i) =>
        prev[i] ?? { status: 'empty' as const }
      );
      return next;
    });
    // Reset prompts flag if count changed
    setPromptsGenerated(false);
  }, [settings.count]);

  // Reset prompts when key settings change
  useEffect(() => {
    setPromptsGenerated(false);
    setSlots(prev => prev.map(s => ({
      ...s,
      prebuiltPrompt: undefined,
      prebuiltConcept: undefined,
      // Keep image if already generated
    })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.visualStyle, settings.contentType, settings.customVisualPrompt, settings.customContentPrompt]);

  const updateSettings = (patch: Partial<ImageSettings>) =>
    setSettings(prev => ({ ...prev, ...patch }));

  // Logo upload
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoName(file.name);
    const reader = new FileReader();
    reader.onload = ev => setLogoDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoDataUrl(null);
    setLogoName('');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  // Step 1: Generate prompts for all slots
  const handleGeneratePrompts = useCallback(async () => {
    if (!humanizedText.trim()) return;
    setIsGeneratingPrompts(true);

    try {
      const res = await generateImagePrompts(humanizedText, settings, geminiModel);

      setSlots(prev => prev.map((s, i) => {
        const p = res.prompts[i];
        if (!p) return s;
        return {
          ...s,
          prebuiltPrompt: p.prompt,
          prebuiltConcept: p.concept,
          prebuiltCaption: p.caption,
          caption: p.caption,
          status: s.status === 'done' ? 'done' : 'empty',
        };
      }));
      setPromptsGenerated(true);
    } catch (err: any) {
      console.error('Prompt generation failed:', err);
    } finally {
      setIsGeneratingPrompts(false);
    }
  }, [humanizedText, settings]);

  // Step 2: Generate image for a single slot (uses pre-built prompt if available)
  const handleGenerate = useCallback(async (index: number) => {
    if (!humanizedText.trim()) return;

    setSlots(prev => prev.map((s, i) => i === index ? { ...s, status: 'loading' } : s));

    try {
      const slot = slots[index];
      const prebuilt = (slot.prebuiltPrompt && slot.prebuiltConcept)
        ? { prompt: slot.prebuiltPrompt, concept: slot.prebuiltConcept }
        : undefined;

      const res = await generateImageApi(humanizedText, settings, index, prebuilt, geminiModel, geminiImageModel);
      let dataUrl = res.image.dataUrl;

      if (logoDataUrl) {
        dataUrl = await overlayLogo(dataUrl, logoDataUrl);
      }

      setSlots(prev => prev.map((s, i) =>
        i === index
          ? {
              ...s,
              status: 'done',
              dataUrl,
              prompt: res.image.prompt,
              concept: res.image.concept,
              prebuiltPrompt: s.prebuiltPrompt || res.image.prompt,
              prebuiltConcept: s.prebuiltConcept || res.image.concept,
            }
          : s
      ));
    } catch (err: any) {
      setSlots(prev => prev.map((s, i) =>
        i === index
          ? { ...s, status: 'error', error: err.details || err.message || 'Lỗi tạo ảnh' }
          : s
      ));
    }
  }, [humanizedText, settings, logoDataUrl, slots]);

  // Allow editing a slot's prompt manually
  const handleEditPrompt = useCallback((index: number, prompt: string, concept: string) => {
    setSlots(prev => prev.map((s, i) =>
      i === index ? { ...s, prebuiltPrompt: prompt, prebuiltConcept: concept } : s
    ));
  }, []);

  // Download a slot image
  const handleDownload = useCallback((index: number) => {
    const slot = slots[index];
    if (!slot.dataUrl) return;
    const a = document.createElement('a');
    a.href = slot.dataUrl;
    a.download = `image-${index + 1}.png`;
    a.click();
  }, [slots]);

  const hasText = humanizedText.trim().length > 0;
  const allPromptsReady = slots.every(s => s.prebuiltPrompt);

  return (
    <div className="flex flex-col h-full gap-4 overflow-y-auto">

      {/* Header */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <ImageIcon className="w-4 h-4 text-pink-400" />
        <span className="text-sm font-semibold text-gray-200">Image Generator</span>
        <span className="ml-auto text-xs text-gray-600">Powered by Imagen 4 Fast</span>
      </div>

      {!hasText && (
        <div className="flex items-center gap-2 p-3 bg-yellow-950/40 border border-yellow-800/50 rounded-xl text-xs text-yellow-300">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Humanize bài viết trước để tạo ảnh từ nội dung đó.
        </div>
      )}

      {/* Settings panel */}
      <div className="space-y-4 flex-shrink-0">

        {/* Logo upload */}
        <div className="p-3 bg-gray-900/50 border border-gray-800 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <Upload className="w-3.5 h-3.5" />
            Logo thương hiệu
          </div>
          {logoDataUrl ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoDataUrl} alt="logo" className="h-10 w-10 object-contain rounded bg-white/10 p-1" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 truncate">{logoName}</p>
                <p className="text-xs text-gray-500">Sẽ xuất hiện góc dưới phải</p>
              </div>
              <button onClick={handleRemoveLogo} className="text-gray-500 hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => logoInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-700 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload logo (PNG/SVG)
            </button>
          )}
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
        </div>

        {/* Count + Aspect Ratio */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-900/50 border border-gray-800 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <Settings2 className="w-3.5 h-3.5" />
              Số lượng ảnh
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range" min={1} max={12} value={settings.count}
                onChange={e => updateSettings({ count: Number(e.target.value) })}
                className="flex-1 h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-violet-500"
              />
              <span className="text-sm font-bold text-violet-400 w-6 text-right">{settings.count}</span>
            </div>
          </div>

          <div className="p-3 bg-gray-900/50 border border-gray-800 rounded-xl space-y-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tỉ lệ ảnh</div>
            <div className="grid grid-cols-2 gap-1">
              {ASPECT_RATIOS.map(r => (
                <button key={r.value} onClick={() => updateSettings({ aspectRatio: r.value })}
                  className={`py-1 px-1.5 rounded-lg text-xs font-medium transition-all ${
                    settings.aspectRatio === r.value
                      ? 'bg-violet-600/30 border border-violet-500/50 text-violet-200'
                      : 'bg-gray-800 border border-gray-700 text-gray-500 hover:text-gray-300'
                  }`}>
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
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
                    ? 'bg-violet-600/30 border border-violet-500/50 text-violet-200'
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
              placeholder="Mô tả phong cách hình ảnh... (vd: watercolor painting, soft pastel colors)"
              value={settings.customVisualPrompt}
              onChange={e => updateSettings({ customVisualPrompt: e.target.value })}
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-violet-500 resize-none"
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
              placeholder="Mô tả nội dung ảnh... (vd: show a person reading a book under a tree)"
              value={settings.customContentPrompt}
              onChange={e => updateSettings({ customContentPrompt: e.target.value })}
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none"
            />
          )}
        </div>
      </div>

      {/* ── Step 1: Generate Prompts ─────────────────────────────────────── */}
      <div className="flex-shrink-0 p-3 bg-gray-900/60 border border-gray-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${allPromptsReady ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
              {allPromptsReady ? '✓' : '1'}
            </div>
            <span className="text-xs font-semibold text-gray-300">Tạo Prompt cho tất cả ảnh</span>
          </div>
          {allPromptsReady && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Hoàn thành
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 pl-7">
          Gemini sẽ phân tích nội dung bài viết và tạo {settings.count} prompt ảnh riêng biệt. Bạn có thể chỉnh sửa từng prompt trước khi tạo ảnh.
        </p>
        <button
          onClick={handleGeneratePrompts}
          disabled={!hasText || isGeneratingPrompts}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white"
        >
          {isGeneratingPrompts ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Đang tạo prompt ({settings.count} ảnh)...
            </>
          ) : allPromptsReady ? (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              Tạo lại tất cả prompt
            </>
          ) : (
            <>
              <FileText className="w-3.5 h-3.5" />
              Generate Prompts ({settings.count} ảnh)
            </>
          )}
        </button>
      </div>

      {/* ── Step 2: Image slots grid ────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-2 mb-1">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${allPromptsReady ? 'bg-violet-600 text-white' : 'bg-gray-700 text-gray-500'}`}>
          2
        </div>
        <span className="text-xs font-semibold text-gray-300">Tạo ảnh theo từng slot</span>
        {!allPromptsReady && (
          <span className="text-xs text-gray-600">— Cần tạo prompt trước</span>
        )}
      </div>

      <div className={`grid gap-4 ${settings.aspectRatio === '9:16' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {slots.map((slot, i) => (
          <ImageSlot
            key={i}
            index={i}
            slot={slot}
            onGenerate={handleGenerate}
            onDownload={handleDownload}
            onEditPrompt={handleEditPrompt}
            disabled={!hasText}
            aspectRatio={settings.aspectRatio}
            caption={slot.caption || slot.prebuiltCaption}
          />
        ))}
      </div>
    </div>
  );
}
