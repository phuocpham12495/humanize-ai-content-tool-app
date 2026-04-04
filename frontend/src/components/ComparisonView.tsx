'use client';

import { useMemo } from 'react';
import { GitCompare, Plus, Minus } from 'lucide-react';
import DiffMatchPatch from 'diff-match-patch';

interface ComparisonViewProps {
  originalText: string;
  humanizedText: string;
}

// Diff operation constants
const DIFF_DELETE = -1;
const DIFF_INSERT = 1;
const DIFF_EQUAL = 0;

function buildDiffSegments(original: string, humanized: string) {
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(original, humanized);
  dmp.diff_cleanupSemantic(diffs);
  return diffs;
}

function OriginalPane({ diffs }: { diffs: [number, string][] }) {
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap">
      {diffs.map(([op, text], i) => {
        if (op === DIFF_EQUAL) {
          return <span key={i} className="text-gray-300">{text}</span>;
        }
        if (op === DIFF_DELETE) {
          return (
            <span
              key={i}
              className="bg-red-900/40 text-red-300 line-through decoration-red-500 rounded-sm px-0.5"
            >
              {text}
            </span>
          );
        }
        // DIFF_INSERT — not shown in original pane
        return null;
      })}
    </p>
  );
}

function HumanizedPane({ diffs }: { diffs: [number, string][] }) {
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap">
      {diffs.map(([op, text], i) => {
        if (op === DIFF_EQUAL) {
          return <span key={i} className="text-gray-300">{text}</span>;
        }
        if (op === DIFF_INSERT) {
          return (
            <span
              key={i}
              className="bg-emerald-900/40 text-emerald-300 rounded-sm px-0.5 border-b border-emerald-600/60"
            >
              {text}
            </span>
          );
        }
        // DIFF_DELETE — not shown in humanized pane
        return null;
      })}
    </p>
  );
}

export default function ComparisonView({ originalText, humanizedText }: ComparisonViewProps) {
  const diffs = useMemo(
    () => buildDiffSegments(originalText, humanizedText),
    [originalText, humanizedText]
  );

  const stats = useMemo(() => {
    let insertions = 0;
    let deletions = 0;
    for (const [op, text] of diffs) {
      if (op === DIFF_INSERT) insertions += text.split(/\s+/).filter(Boolean).length;
      if (op === DIFF_DELETE) deletions += text.split(/\s+/).filter(Boolean).length;
    }
    const originalWords = originalText.split(/\s+/).filter(Boolean).length;
    const humanizedWords = humanizedText.split(/\s+/).filter(Boolean).length;
    const wordDiff = humanizedWords - originalWords;
    return { insertions, deletions, originalWords, humanizedWords, wordDiff };
  }, [diffs, originalText, humanizedText]);

  const hasChanges = diffs.some(([op]) => op !== DIFF_EQUAL);

  if (!originalText || !humanizedText) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <div className="space-y-2">
          <div className="text-3xl">⚖️</div>
          <p className="text-gray-500 text-sm">Both original and humanized text needed for comparison</p>
          <p className="text-gray-600 text-xs">Analyze then humanize to see the diff</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4 p-3 bg-gray-900/50 rounded-xl border border-gray-800 flex-wrap">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-medium text-gray-300">Side-by-Side Diff</span>
        </div>

        <div className="ml-auto flex items-center gap-4 text-xs flex-wrap">
          <span className="text-gray-500">
            Words: {stats.originalWords} → {stats.humanizedWords}{' '}
            <span className={stats.wordDiff > 0 ? 'text-emerald-400' : stats.wordDiff < 0 ? 'text-red-400' : 'text-gray-500'}>
              ({stats.wordDiff > 0 ? '+' : ''}{stats.wordDiff})
            </span>
          </span>

          {hasChanges ? (
            <>
              <span className="flex items-center gap-1 text-emerald-400">
                <Plus className="w-3 h-3" />
                {stats.insertions} words added
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <Minus className="w-3 h-3" />
                {stats.deletions} words removed
              </span>
            </>
          ) : (
            <span className="text-gray-600 italic">No significant changes</span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs border-l border-gray-700 pl-3">
          <span className="flex items-center gap-1">
            <span className="w-3 h-2.5 rounded bg-red-900/60 border-b border-red-500 line-through inline-block" />
            <span className="text-gray-500">Removed</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-2.5 rounded bg-emerald-900/60 border-b border-emerald-600/60 inline-block" />
            <span className="text-gray-500">Added</span>
          </span>
        </div>
      </div>

      {/* No changes message */}
      {!hasChanges && (
        <div className="p-3 bg-gray-900/30 border border-gray-800 rounded-xl text-center text-xs text-gray-500">
          The humanized text is identical or nearly identical to the original.
        </div>
      )}

      {/* Comparison columns */}
      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Original */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Original (AI)</span>
            <span className="ml-auto text-xs text-gray-600">{stats.originalWords}w</span>
          </div>
          <div className="flex-1 bg-gray-900/40 border border-gray-800 rounded-xl p-4 overflow-y-auto">
            <OriginalPane diffs={diffs} />
          </div>
        </div>

        {/* Humanized */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="text-xs font-medium text-violet-400 uppercase tracking-wider">Humanized</span>
            <span className="ml-auto text-xs text-gray-600">{stats.humanizedWords}w</span>
          </div>
          <div className="flex-1 bg-gray-900/40 border border-violet-900/30 rounded-xl p-4 overflow-y-auto">
            <HumanizedPane diffs={diffs} />
          </div>
        </div>
      </div>
    </div>
  );
}
