'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Zap, Activity, Bot, Image, Film } from 'lucide-react';
import TextInput from '@/components/TextInput';
import SettingsPanel from '@/components/SettingsPanel';
import OutputPanel from '@/components/OutputPanel';
import AnalysisPanel from '@/components/AnalysisPanel';
import ComparisonView from '@/components/ComparisonView';
import ActionButtons from '@/components/ActionButtons';
import AgentManager from '@/components/AgentManager';
import ImageGenerator from '@/components/ImageGenerator';
import VideoGenerator from '@/components/VideoGenerator';
import {
  humanizeText, humanizeTextStream, analyzeText, checkHealth,
  generateWithAgentStream, generateWithAgent,
  loadModelSettings, saveModelSettings, loadAvailableModels,
  AvailableModel
} from '@/lib/api';
import { ModelOption } from '@/components/SettingsPanel';
import { defaultSettings, HumanizeSettings, AnalysisResult, OutputScores } from '@/types';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [humanizedText, setHumanizedText] = useState('');
  const [settings, setSettings] = useState<HumanizeSettings>(defaultSettings);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [scores, setScores] = useState<OutputScores | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [activeView, setActiveView] = useState<'output' | 'comparison' | 'analysis' | 'images' | 'videos'>('output');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [agentManagerOpen, setAgentManagerOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [availableGeminiModels, setAvailableGeminiModels] = useState<ModelOption[]>([]);
  const [availableImagenModels, setAvailableImagenModels] = useState<ModelOption[]>([]);
  const [modelsSource, setModelsSource] = useState('default');

  // Load available models from API
  const fetchAvailableModels = useCallback(async () => {
    try {
      const res = await loadAvailableModels();
      setAvailableGeminiModels(res.geminiModels);
      setAvailableImagenModels(res.imagenModels);
      setModelsSource(res.source);
    } catch {
      // Keep existing or fallback
    }
  }, []);

  // Check backend health, load saved model settings + available models on mount
  useEffect(() => {
    checkHealth()
      .then(() => {
        setBackendStatus('ok');
        return Promise.all([loadModelSettings(), loadAvailableModels()]);
      })
      .then(([savedModels, available]) => {
        setSettings(prev => ({ ...prev, geminiModel: savedModels.geminiModel as any, geminiImageModel: savedModels.geminiImageModel as any }));
        setAvailableGeminiModels(available.geminiModels);
        setAvailableImagenModels(available.imagenModels);
        setModelsSource(available.source);
      })
      .catch(() => setBackendStatus('error'));
  }, []);

  // Explicit save model settings to DB (triggered by Save button)
  const handleSaveModels = useCallback(async () => {
    await saveModelSettings(settings.geminiModel, settings.geminiImageModel);
  }, [settings.geminiModel, settings.geminiImageModel]);

  const handleAnalyze = useCallback(async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setActiveView('analysis');

    try {
      const result = await analyzeText(inputText, sessionId || undefined, settings.geminiModel);
      setAnalysis(result.analysis);
      if (!sessionId) setSessionId(result.sessionId);
    } catch (err: any) {
      setError(err.details || err.message || 'Analysis failed. Make sure the backend is running.');
      setActiveView('output');
    } finally {
      setIsAnalyzing(false);
    }
  }, [inputText, sessionId, settings.geminiModel]);

  const handleHumanize = useCallback(() => {
    if (!inputText.trim()) return;
    setIsHumanizing(true);
    setError(null);
    setActiveView('output');
    setHumanizedText('');
    setScores(null);

    // If an agent is selected, use agent-style generation instead
    if (selectedAgentId) {
      generateWithAgentStream(
        selectedAgentId,
        inputText,
        {
          onChunk: t => setHumanizedText(prev => prev + t),
          onStatus: () => {},
          onDone: t => { setHumanizedText(t); setIsHumanizing(false); },
          onError: (streamErr) => {
            generateWithAgent(selectedAgentId, inputText)
              .then(r => setHumanizedText(r.generatedText))
              .catch((e: any) => setError(e.details || e.message || streamErr || 'Agent generation failed'))
              .finally(() => setIsHumanizing(false));
          }
        }
      );
      return;
    }

    // Standard streaming humanize (TC015)
    humanizeTextStream(
      inputText,
      settings,
      {
        onChunk: (chunk) => setHumanizedText(prev => prev + chunk),
        onStatus: () => {},
        onDone: (result) => {
          setHumanizedText(result.humanizedText);
          setScores(result.scores as any);
          if (!sessionId) setSessionId(result.sessionId);
          setIsHumanizing(false);
        },
        onError: (streamErr) => {
          humanizeText(inputText, settings, sessionId || undefined)
            .then(result => {
              setHumanizedText(result.humanizedText);
              setScores(result.scores);
              if (!sessionId) setSessionId(result.sessionId);
            })
            .catch((err: any) => {
              setError(err.details || err.message || streamErr || 'Humanization failed. Make sure the backend is running.');
            })
            .finally(() => setIsHumanizing(false));
        }
      },
      sessionId || undefined
    );
  }, [inputText, settings, sessionId, selectedAgentId]);

  const handleCompare = useCallback(() => {
    setActiveView('comparison');
  }, []);

  // TC013_05: one-click modes trigger immediate humanization (with streaming)
  const handleOneClickHumanize = useCallback((newSettings: typeof settings) => {
    if (!inputText.trim()) return;
    setIsHumanizing(true);
    setError(null);
    setActiveView('output');
    setHumanizedText('');
    setScores(null);

    humanizeTextStream(
      inputText,
      newSettings,
      {
        onChunk: (chunk) => setHumanizedText(prev => prev + chunk),
        onStatus: () => {},
        onDone: (result) => {
          setHumanizedText(result.humanizedText);
          setScores(result.scores as any);
          if (!sessionId) setSessionId(result.sessionId);
          setIsHumanizing(false);
        },
        onError: () => {
          humanizeText(inputText, newSettings, sessionId || undefined)
            .then(result => {
              setHumanizedText(result.humanizedText);
              setScores(result.scores);
              if (!sessionId) setSessionId(result.sessionId);
            })
            .catch((err: any) => setError(err.details || err.message || 'Humanization failed.'))
            .finally(() => setIsHumanizing(false));
        }
      },
      sessionId || undefined
    );
  }, [inputText, sessionId]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-sm px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-900/40">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Humanize AI Content Tool</h1>
              <p className="text-xs text-gray-500">AI Agent v1.0</p>
            </div>
          </div>

          {/* Action buttons (center) */}
          <ActionButtons
            onAnalyze={handleAnalyze}
            onHumanize={handleHumanize}
            onCompare={handleCompare}
            isAnalyzing={isAnalyzing}
            isHumanizing={isHumanizing}
            hasInput={inputText.trim().length > 0}
            hasOutput={humanizedText.length > 0}
            activeView={activeView}
          />

          {/* Status + Agent button */}
          <div className="flex items-center gap-3">
            {/* Agent manager button */}
            <button
              onClick={() => setAgentManagerOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                selectedAgentId
                  ? 'bg-violet-600/20 border-violet-500/60 text-violet-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-violet-600/50 hover:text-violet-400'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              {selectedAgentId ? 'Agent active' : 'AI Agents'}
            </button>

            {/* Backend status */}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'ok'
                    ? 'bg-emerald-500'
                    : backendStatus === 'error'
                    ? 'bg-red-500'
                    : 'bg-yellow-500 animate-pulse'
                }`}
              />
              <span className="text-xs text-gray-500">
                {backendStatus === 'ok' ? 'Backend ready' : backendStatus === 'error' ? 'Backend offline' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="flex-shrink-0 px-6 py-2 bg-red-950/60 border-b border-red-900/50">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <p className="text-sm text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 text-xs ml-4"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Backend offline warning */}
      {backendStatus === 'error' && !error && (
        <div className="flex-shrink-0 px-6 py-2 bg-yellow-950/60 border-b border-yellow-900/50">
          <div className="max-w-[1600px] mx-auto">
            <p className="text-xs text-yellow-300">
              Backend is not running. Start it with: <code className="bg-yellow-900/40 px-1.5 py-0.5 rounded font-mono">cd backend && npm run dev</code>
            </p>
          </div>
        </div>
      )}

      {/* Agent Manager Drawer */}
      <AgentManager
        isOpen={agentManagerOpen}
        onClose={() => setAgentManagerOpen(false)}
        selectedAgentId={selectedAgentId}
        onSelectAgent={setSelectedAgentId}
        inputText={inputText}
      />

      {/* Active agent banner */}
      {selectedAgentId && (
        <div className="flex-shrink-0 px-6 py-1.5 bg-violet-950/60 border-b border-violet-900/50">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <p className="text-xs text-violet-300">
              <Bot className="w-3 h-3 inline mr-1" />
              AI Agent đang hoạt động — Humanize sẽ dùng phong cách viết của agent này
            </p>
            <button
              onClick={() => setSelectedAgentId(null)}
              className="text-violet-400 hover:text-violet-200 text-xs"
            >
              Tắt
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-[1600px] mx-auto h-full flex gap-0">
          {/* Left panel: Settings */}
          <aside className="w-64 flex-shrink-0 border-r border-gray-800/60 overflow-y-auto p-4 bg-gray-950/30">
            <SettingsPanel
              settings={settings}
              onChange={setSettings}
              onOneClickHumanize={inputText.trim() ? handleOneClickHumanize : undefined}
              onSaveModels={handleSaveModels}
              onRefreshModels={fetchAvailableModels}
              availableGeminiModels={availableGeminiModels}
              availableImagenModels={availableImagenModels}
              modelsSource={modelsSource}
              disabled={isAnalyzing || isHumanizing}
              agentActive={!!selectedAgentId}
            />
          </aside>

          {/* Center: Input */}
          <div className="flex-1 flex flex-col p-4 border-r border-gray-800/60 min-w-0">
            <TextInput
              value={inputText}
              onChange={setInputText}
              disabled={isAnalyzing || isHumanizing}
            />
          </div>

          {/* Right panel: Output / Analysis / Comparison */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* View tabs */}
            <div className="flex-shrink-0 flex items-center gap-1 px-4 pt-4 pb-0">
              <button
                onClick={() => setActiveView('output')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium border-b-2 transition-all ${
                  activeView === 'output'
                    ? 'text-violet-400 border-violet-500 bg-violet-950/20'
                    : 'text-gray-500 border-transparent hover:text-gray-400 hover:border-gray-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Output
              </button>
              <button
                onClick={() => setActiveView('analysis')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium border-b-2 transition-all ${
                  activeView === 'analysis'
                    ? 'text-blue-400 border-blue-500 bg-blue-950/20'
                    : 'text-gray-500 border-transparent hover:text-gray-400 hover:border-gray-700'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Analysis
              </button>
              <button
                onClick={() => setActiveView('comparison')}
                disabled={!humanizedText}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium border-b-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeView === 'comparison'
                    ? 'text-emerald-400 border-emerald-500 bg-emerald-950/20'
                    : 'text-gray-500 border-transparent hover:text-gray-400 hover:border-gray-700'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Compare
              </button>
              <button
                onClick={() => setActiveView('images')}
                disabled={!humanizedText}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium border-b-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeView === 'images'
                    ? 'text-pink-400 border-pink-500 bg-pink-950/20'
                    : 'text-gray-500 border-transparent hover:text-gray-400 hover:border-gray-700'
                }`}
              >
                <Image className="w-3.5 h-3.5" />
                Images
              </button>
              <button
                onClick={() => setActiveView('videos')}
                disabled={!humanizedText}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium border-b-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeView === 'videos'
                    ? 'text-cyan-400 border-cyan-500 bg-cyan-950/20'
                    : 'text-gray-500 border-transparent hover:text-gray-400 hover:border-gray-700'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                Videos
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeView === 'output' && (
                <OutputPanel
                  text={humanizedText}
                  scores={scores}
                  isLoading={isHumanizing}
                />
              )}
              {activeView === 'analysis' && (
                <AnalysisPanel
                  analysis={analysis}
                  inputText={inputText}
                  isLoading={isAnalyzing}
                />
              )}
              {activeView === 'comparison' && (
                <ComparisonView
                  originalText={inputText}
                  humanizedText={humanizedText}
                />
              )}
              {activeView === 'images' && (
                <ImageGenerator
                  humanizedText={humanizedText}
                  geminiModel={settings.geminiModel}
                  geminiImageModel={settings.geminiImageModel}
                />
              )}
              {activeView === 'videos' && (
                <VideoGenerator
                  humanizedText={humanizedText}
                  geminiModel={settings.geminiModel}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 border-t border-gray-800/60 bg-gray-950/80 backdrop-blur-sm px-6 py-2">
        <div className="max-w-[1600px] mx-auto text-center">
          <p className="text-xs text-gray-500">© PHUOC IT 95 AI Agent</p>
        </div>
      </footer>
    </div>
  );
}
