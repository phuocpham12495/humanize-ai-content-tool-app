'use client';

import { useState } from 'react';
import { AnalysisResult, SuspiciousSentence } from '@/types';
import { AlertTriangle, Activity, FileText, Lightbulb } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  inputText?: string;
  isLoading?: boolean;
}

interface InlineHighlightedTextProps {
  text: string;
  suspiciousSentences: SuspiciousSentence[];
}

function InlineHighlightedText({ text, suspiciousSentences }: InlineHighlightedTextProps) {
  const [tooltip, setTooltip] = useState<{ sentence: SuspiciousSentence; x: number; y: number } | null>(null);

  if (!suspiciousSentences || suspiciousSentences.length === 0) {
    return <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{text}</p>;
  }

  // Build segments: split text by suspicious sentences and mark them
  const segments: Array<{ text: string; suspicious?: SuspiciousSentence }> = [];
  let remaining = text;

  // Sort by order of appearance in text
  const sorted = [...suspiciousSentences]
    .filter(s => s.text && text.includes(s.text))
    .sort((a, b) => text.indexOf(a.text) - text.indexOf(b.text));

  for (const s of sorted) {
    const idx = remaining.indexOf(s.text);
    if (idx === -1) continue;
    if (idx > 0) segments.push({ text: remaining.slice(0, idx) });
    segments.push({ text: s.text, suspicious: s });
    remaining = remaining.slice(idx + s.text.length);
  }
  if (remaining) segments.push({ text: remaining });

  return (
    <div className="relative text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
      {segments.map((seg, i) =>
        seg.suspicious ? (
          <span
            key={i}
            className="relative cursor-pointer border-b-2 border-red-500 text-red-200 bg-red-950/30 rounded-sm px-0.5 hover:bg-red-900/50 transition-colors"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltip({ sentence: seg.suspicious!, x: rect.left, y: rect.bottom });
            }}
            onMouseLeave={() => setTooltip(null)}
            onClick={() => setTooltip(t => t?.sentence === seg.suspicious ? null : { sentence: seg.suspicious!, x: 0, y: 0 })}
            title={seg.suspicious.reason}
          >
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
      {/* Tooltip */}
      {tooltip && tooltip.sentence && (
        <div
          className="fixed z-50 max-w-xs bg-gray-900 border border-red-700/50 rounded-xl shadow-2xl p-3 pointer-events-none"
          style={{ top: tooltip.y + 8, left: Math.min(tooltip.x, window.innerWidth - 320) }}
        >
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-300">{tooltip.sentence.reason}</p>
          </div>
          {tooltip.sentence.suggestion && (
            <div className="flex items-start gap-2 border-t border-gray-800 pt-2">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-200 italic">"{tooltip.sentence.suggestion}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface MetricBarProps {
  label: string;
  value: number;
  tooltip: string;
}

function MetricBar({ label, value, tooltip }: MetricBarProps) {
  const getColor = (v: number) => {
    if (v >= 70) return 'bg-emerald-500';
    if (v >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = (v: number) => {
    if (v >= 70) return 'text-emerald-400';
    if (v >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div title={tooltip}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={`text-xs font-mono font-medium ${getTextColor(value)}`}>{value}/100</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${getColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function getAiScoreColor(score: number): string {
  if (score >= 80) return 'text-red-400';
  if (score >= 50) return 'text-yellow-400';
  if (score >= 20) return 'text-orange-400';
  return 'text-emerald-400';
}

function getAiScoreLabel(score: number): string {
  if (score >= 80) return 'Definitely AI';
  if (score >= 50) return 'Likely AI';
  if (score >= 20) return 'Mixed';
  return 'Mostly Human';
}

export default function AnalysisPanel({ analysis, inputText, isLoading = false }: AnalysisPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-violet-400 animate-pulse" />
          <span className="text-sm font-medium text-gray-300">Analyzing text...</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <div className="space-y-2">
          <div className="text-3xl">🔍</div>
          <p className="text-gray-500 text-sm">Click "Analyze" to detect AI patterns</p>
          <p className="text-gray-600 text-xs">We'll check for burstiness, perplexity, and sentence variance</p>
        </div>
      </div>
    );
  }

  const { aiLikenessScore, suspiciousSentences, metrics, overallAssessment } = analysis;

  return (
    <div className="space-y-4">
      {/* AI Likeness Score */}
      <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-300">AI Likeness Score</span>
          <div className="text-right">
            <span className={`text-2xl font-bold ${getAiScoreColor(aiLikenessScore)}`}>
              {aiLikenessScore}
            </span>
            <span className="text-gray-600 text-sm">/100</span>
          </div>
        </div>

        {/* Score bar */}
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              aiLikenessScore >= 80 ? 'bg-red-500' :
              aiLikenessScore >= 50 ? 'bg-yellow-500' :
              aiLikenessScore >= 20 ? 'bg-orange-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${aiLikenessScore}%` }}
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Human</span>
          <span className={`text-xs font-medium ${getAiScoreColor(aiLikenessScore)}`}>
            {getAiScoreLabel(aiLikenessScore)}
          </span>
          <span className="text-xs text-gray-500">AI</span>
        </div>

        {overallAssessment && (
          <p className="mt-3 text-xs text-gray-400 italic border-t border-gray-800 pt-2">
            "{overallAssessment}"
          </p>
        )}
      </div>

      {/* Metrics */}
      <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-medium text-gray-300">Writing Metrics</span>
          <span className="text-xs text-gray-600 ml-auto">Higher = more human</span>
        </div>
        <div className="space-y-3">
          <MetricBar
            label="Burstiness"
            value={metrics.burstiness}
            tooltip="Variation in sentence length. Low = uniform AI sentences. High = natural human variation."
          />
          <MetricBar
            label="Perplexity"
            value={metrics.perplexity}
            tooltip="Text unpredictability. Low = predictable AI patterns. High = surprising human choices."
          />
          <MetricBar
            label="Sentence Variance"
            value={metrics.sentenceVariance}
            tooltip="Diversity in sentence structure. Low = repetitive AI structures. High = varied human structures."
          />
        </div>
      </div>

      {/* Inline highlighted text view (TC014) */}
      {inputText && suspiciousSentences && suspiciousSentences.length > 0 && (
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-gray-300">Annotated Text</span>
            <span className="ml-auto text-xs text-gray-600">Hover red sentences for suggestions</span>
          </div>
          <InlineHighlightedText
            text={inputText}
            suspiciousSentences={suspiciousSentences}
          />
        </div>
      )}

      {/* Suspicious sentences list */}
      {suspiciousSentences && suspiciousSentences.length > 0 && (
        <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-gray-300">Suspicious Sentences</span>
            <span className="ml-auto bg-yellow-900/40 text-yellow-400 text-xs px-2 py-0.5 rounded-full border border-yellow-700/40">
              {suspiciousSentences.length}
            </span>
          </div>
          <div className="space-y-3">
            {suspiciousSentences.map((item, i) => (
              <div key={i} className="border-l-2 border-yellow-600/40 pl-3">
                <p className="text-xs text-gray-300 italic mb-1">"{item.text}"</p>
                <p className="text-xs text-yellow-600 mb-1">{item.reason}</p>
                {item.suggestion && (
                  <div className="flex items-start gap-1.5 mt-1">
                    <Lightbulb className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-300 italic">"{item.suggestion}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
