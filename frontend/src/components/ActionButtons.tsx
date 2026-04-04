'use client';

import { Search, Sparkles, GitCompare, Loader2 } from 'lucide-react';

interface ActionButtonsProps {
  onAnalyze: () => void;
  onHumanize: () => void;
  onCompare: () => void;
  isAnalyzing: boolean;
  isHumanizing: boolean;
  hasInput: boolean;
  hasOutput: boolean;
  activeView: 'output' | 'comparison' | 'analysis';
}

export default function ActionButtons({
  onAnalyze,
  onHumanize,
  onCompare,
  isAnalyzing,
  isHumanizing,
  hasInput,
  hasOutput,
  activeView
}: ActionButtonsProps) {
  const isProcessing = isAnalyzing || isHumanizing;

  return (
    <div className="flex items-center gap-3">
      {/* Analyze button */}
      <button
        onClick={onAnalyze}
        disabled={!hasInput || isProcessing}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          activeView === 'analysis' && !isProcessing
            ? 'bg-blue-600 hover:bg-blue-500 text-white'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 hover:border-gray-600'
        }`}
      >
        {isAnalyzing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Search className="w-4 h-4" />
        )}
        {isAnalyzing ? 'Analyzing...' : 'Analyze'}
      </button>

      {/* Humanize button - primary action */}
      <button
        onClick={onHumanize}
        disabled={!hasInput || isProcessing}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-900/30 hover:shadow-violet-900/50 active:scale-[0.98]"
      >
        {isHumanizing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {isHumanizing ? 'Humanizing...' : 'Humanize'}
      </button>

      {/* Compare button */}
      <button
        onClick={onCompare}
        disabled={!hasOutput || isProcessing}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          activeView === 'comparison' && !isProcessing
            ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 hover:border-gray-600'
        }`}
      >
        <GitCompare className="w-4 h-4" />
        Compare
      </button>
    </div>
  );
}
