'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Trash2, Copy, Check, ChevronDown, ChevronRight, Clock, Cpu, AlertCircle } from 'lucide-react';
import { getPromptLogs, clearPromptLogs, PromptLogEntry } from '@/lib/api';

const FEATURE_LABELS: Record<string, { label: string; color: string }> = {
  'analyze': { label: 'Analysis', color: 'text-blue-400 bg-blue-950/40 border-blue-800/50' },
  'humanize': { label: 'Humanize', color: 'text-violet-400 bg-violet-950/40 border-violet-800/50' },
  'humanize-stream': { label: 'Humanize (Stream)', color: 'text-violet-400 bg-violet-950/40 border-violet-800/50' },
  'score': { label: 'Score', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50' },
  'agent-generate': { label: 'Agent Generate', color: 'text-purple-400 bg-purple-950/40 border-purple-800/50' },
  'agent-generate-stream': { label: 'Agent (Stream)', color: 'text-purple-400 bg-purple-950/40 border-purple-800/50' },
  'image-concept': { label: 'Image Concept', color: 'text-pink-400 bg-pink-950/40 border-pink-800/50' },
  'image-prompts': { label: 'Image Prompts', color: 'text-pink-400 bg-pink-950/40 border-pink-800/50' },
  'image-generate': { label: 'Image Generate', color: 'text-rose-400 bg-rose-950/40 border-rose-800/50' },
  'video-prompts': { label: 'Video Prompts', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/50' },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-gray-700/50 text-gray-500 hover:text-gray-300 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function LogEntry({ log }: { log: PromptLogEntry }) {
  const [expandedPrompt, setExpandedPrompt] = useState(false);
  const [expandedResponse, setExpandedResponse] = useState(false);

  const featureInfo = FEATURE_LABELS[log.feature] || { label: log.feature, color: 'text-gray-400 bg-gray-950/40 border-gray-800/50' };
  const isError = log.status === 'error';
  const time = new Date(log.created_at + 'Z').toLocaleString();

  return (
    <div className={`border rounded-lg overflow-hidden ${isError ? 'border-red-900/50 bg-red-950/10' : 'border-gray-800/60 bg-gray-900/30'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900/50">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${featureInfo.color}`}>
          {featureInfo.label}
        </span>
        <span className="text-[10px] text-gray-500 font-mono">{log.model}</span>
        {log.duration_ms != null && (
          <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
            <Clock className="w-3 h-3" />
            {log.duration_ms < 1000 ? `${log.duration_ms}ms` : `${(log.duration_ms / 1000).toFixed(1)}s`}
          </span>
        )}
        {isError && (
          <span className="flex items-center gap-0.5 text-[10px] text-red-400">
            <AlertCircle className="w-3 h-3" />
            Error
          </span>
        )}
        <span className="ml-auto text-[10px] text-gray-600">{time}</span>
      </div>

      {/* Prompt */}
      <div className="border-t border-gray-800/40">
        <button
          onClick={() => setExpandedPrompt(!expandedPrompt)}
          className="flex items-center gap-1.5 w-full px-3 py-1.5 text-left hover:bg-gray-800/30 transition-colors"
        >
          {expandedPrompt ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
          <span className="text-[11px] font-medium text-amber-400/80">Prompt</span>
          <span className="text-[10px] text-gray-600 ml-1 truncate flex-1">{!expandedPrompt ? log.prompt.slice(0, 120) + (log.prompt.length > 120 ? '...' : '') : ''}</span>
          <CopyButton text={log.prompt} />
        </button>
        {expandedPrompt && (
          <pre className="px-3 pb-2 text-[11px] text-gray-300 whitespace-pre-wrap break-words max-h-80 overflow-y-auto font-mono leading-relaxed">
            {log.prompt}
          </pre>
        )}
      </div>

      {/* Response */}
      {(log.response || log.error_message) && (
        <div className="border-t border-gray-800/40">
          <button
            onClick={() => setExpandedResponse(!expandedResponse)}
            className="flex items-center gap-1.5 w-full px-3 py-1.5 text-left hover:bg-gray-800/30 transition-colors"
          >
            {expandedResponse ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
            <span className={`text-[11px] font-medium ${isError ? 'text-red-400/80' : 'text-green-400/80'}`}>
              {isError ? 'Error' : 'Response'}
            </span>
            <span className="text-[10px] text-gray-600 ml-1 truncate flex-1">
              {!expandedResponse ? (isError ? log.error_message : log.response)?.slice(0, 120) + '...' : ''}
            </span>
            {(log.response || log.error_message) && <CopyButton text={(isError ? log.error_message : log.response) || ''} />}
          </button>
          {expandedResponse && (
            <pre className={`px-3 pb-2 text-[11px] whitespace-pre-wrap break-words max-h-80 overflow-y-auto font-mono leading-relaxed ${isError ? 'text-red-300' : 'text-gray-300'}`}>
              {isError ? log.error_message : log.response}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function PromptLogPanel() {
  const [logs, setLogs] = useState<PromptLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPromptLogs(200);
      setLogs(res.logs);
      setTotal(res.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClear = async () => {
    await clearPromptLogs();
    setLogs([]);
    setTotal(0);
  };

  const features = Array.from(new Set(logs.map(l => l.feature)));
  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.feature === filter);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <div className="flex items-center gap-1">
          <Cpu className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-white">Prompt Log</span>
          <span className="text-[10px] text-gray-500 ml-1">({total} entries)</span>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Filter */}
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="text-[11px] bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-orange-600/50"
          >
            <option value="all">All features</option>
            {features.map(f => (
              <option key={f} value={f}>{FEATURE_LABELS[f]?.label || f}</option>
            ))}
          </select>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-orange-400 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleClear}
            className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-red-400 transition-colors"
            title="Clear all logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredLogs.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-600 text-sm">
            No prompt logs yet. Use any AI feature to see logs here.
          </div>
        )}
        {loading && logs.length === 0 && (
          <div className="text-center py-12 text-gray-600 text-sm">Loading...</div>
        )}
        {filteredLogs.map(log => (
          <LogEntry key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
}
