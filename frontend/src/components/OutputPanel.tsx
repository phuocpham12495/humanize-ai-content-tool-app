'use client';

import { useState } from 'react';
import { Copy, Check, RefreshCw, Download } from 'lucide-react';
import { OutputScores } from '@/types';
import ScoreDisplay from './ScoreDisplay';

interface OutputPanelProps {
  text: string;
  scores: OutputScores | null;
  isLoading?: boolean;
}

export default function OutputPanel({ text, scores, isLoading = false }: OutputPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'humanized-text.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // While streaming: if we already have partial text, show it live (TC015)
  const isStreaming = isLoading && text.length > 0;

  if (isLoading && !isStreaming) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-4 h-4 text-violet-400 animate-spin" />
          <span className="text-sm font-medium text-gray-300">Humanizing your text...</span>
        </div>
        <div className="flex-1 bg-gray-900/60 border border-gray-700 rounded-xl p-4 space-y-3">
          <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-800 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-800 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-gray-800 rounded animate-pulse w-2/3" />
          <div className="h-4 bg-gray-800 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-800 rounded animate-pulse w-4/5" />
        </div>
        <div className="mt-3 text-center text-xs text-gray-500">
          Applying 5 humanization layers with Gemini 2.5 Flash...
        </div>
      </div>
    );
  }

  if (!text) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-500">Output</span>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-900/30 border border-dashed border-gray-800 rounded-xl">
          <div className="text-center space-y-2 p-8">
            <div className="text-4xl">✨</div>
            <p className="text-gray-500 text-sm">Your humanized text will appear here</p>
            <p className="text-gray-600 text-xs">Paste text on the left and click "Humanize"</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">Humanized Output</span>
          {isStreaming && (
            <span className="flex items-center gap-1.5 text-xs text-violet-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Writing...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={isStreaming}
            className="text-gray-500 hover:text-gray-300 disabled:opacity-30 transition-colors p-1 rounded"
            title="Download as .txt"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            disabled={isStreaming}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-30 ${
              copied
                ? 'bg-emerald-900/40 border-emerald-600/50 text-emerald-400'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-violet-600/50 hover:text-violet-400'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Text output */}
      <div className={`flex-1 bg-gray-900/60 border rounded-xl p-4 overflow-y-auto transition-colors ${isStreaming ? 'border-violet-600/50' : 'border-violet-900/30'}`}>
        <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
          {text}
          {isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 animate-pulse align-middle" />
          )}
        </p>
      </div>

      {/* Word count */}
      <div className="flex items-center justify-end">
        <span className="text-xs text-gray-600">
          {text.split(/\s+/).filter(Boolean).length} words · {text.length} chars
        </span>
      </div>

      {/* Scores */}
      {scores && (
        <div className="border-t border-gray-800 pt-3">
          <ScoreDisplay scores={scores} />
        </div>
      )}
    </div>
  );
}
