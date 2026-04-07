'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bot, Plus, Trash2, Pencil, X, ChevronRight, ChevronDown,
  FileText, Save, Loader2, BookOpen, Sparkles, Check, AlertCircle, Copy
} from 'lucide-react';
import {
  listAgents, getAgent, createAgent, updateAgent, deleteAgent,
  addAgentPost, updateAgentPost, deleteAgentPost, generateWithAgentStream
} from '@/lib/api';
import { Agent, AgentPost, AgentFormData, AgentPostFormData } from '@/types';

// ── Emoji picker (simple grid) ────────────────────────────────────────────────
const EMOJIS = ['🤖', '🧠', '✍️', '🎭', '🦊', '🐺', '🦁', '🐉', '👤', '🧑‍💻',
  '👩‍🎨', '🧑‍🎤', '🕵️', '🦸', '🧙', '🎩', '💼', '🎯', '🔥', '⚡'];

const PLATFORMS = [
  { value: 'general', label: 'General' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter/X' },
];

// ── Agent Form ────────────────────────────────────────────────────────────────
function AgentForm({
  initial,
  onSave,
  onCancel,
  saving
}: {
  initial?: Partial<AgentFormData>;
  onSave: (data: AgentFormData) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<AgentFormData>({
    name: initial?.name || '',
    description: initial?.description || '',
    avatar_emoji: initial?.avatar_emoji || '🤖',
    platform: initial?.platform || 'general',
  });

  return (
    <div className="space-y-3 p-4 bg-gray-900/60 border border-violet-800/40 rounded-xl">
      {/* Emoji + Name */}
      <div className="flex gap-3 items-start">
        <div className="flex-shrink-0">
          <div className="text-3xl mb-1 text-center">{form.avatar_emoji}</div>
          <div className="flex flex-wrap gap-0.5 w-28">
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setForm(f => ({ ...f, avatar_emoji: e }))}
                className={`text-base p-0.5 rounded transition-all ${form.avatar_emoji === e ? 'bg-violet-600/40 ring-1 ring-violet-500' : 'hover:bg-gray-800'}`}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <input
            type="text"
            placeholder="Agent name *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-violet-500"
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
          />
          <select
            value={form.platform}
            onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-violet-500"
          >
            {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 border border-gray-700 rounded-lg transition-colors">
          Cancel
        </button>
        <button
          onClick={() => form.name.trim() && onSave(form)}
          disabled={saving || !form.name.trim()}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </button>
      </div>
    </div>
  );
}

// ── Post Form ─────────────────────────────────────────────────────────────────
function PostForm({
  initial,
  onSave,
  onCancel,
  saving
}: {
  initial?: Partial<AgentPostFormData>;
  onSave: (data: AgentPostFormData) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<AgentPostFormData>({
    title: initial?.title || '',
    content: initial?.content || '',
    platform: initial?.platform || '',
  });

  return (
    <div className="space-y-2 p-3 bg-gray-900/60 border border-emerald-800/40 rounded-xl">
      <input
        type="text"
        placeholder="Tiêu đề bài viết (optional)"
        value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
      />
      <textarea
        placeholder="Dán bài viết do CON NGƯỜI viết vào đây... *"
        value={form.content}
        onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
        rows={6}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
      />
      <div className="flex items-center gap-2">
        <select
          value={form.platform}
          onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Nguồn gốc...</option>
          {PLATFORMS.slice(1).map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <button onClick={onCancel}
          className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 border border-gray-700 rounded-lg">
          Cancel
        </button>
        <button
          onClick={() => form.content.trim() && onSave(form)}
          disabled={saving || !form.content.trim()}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add
        </button>
      </div>
    </div>
  );
}

// ── Single Agent Detail ───────────────────────────────────────────────────────
function AgentDetail({
  agentId,
  onBack,
  onSelectAgent,
  selectedAgentId,
  inputText
}: {
  agentId: number;
  onBack: () => void;
  onSelectAgent: (id: number | null) => void;
  selectedAgentId: number | null;
  inputText: string;
}) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingPost, setAddingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await getAgent(agentId);
      setAgent(res.agent);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => { reload(); }, [reload]);

  const handleSaveAgent = async (data: AgentFormData) => {
    setSaving(true);
    try {
      await updateAgent(agentId, data);
      await reload();
      setEditing(false);
    } finally { setSaving(false); }
  };

  const handleAddPost = async (data: AgentPostFormData) => {
    setSaving(true);
    try {
      await addAgentPost(agentId, data);
      await reload();
      setAddingPost(false);
    } finally { setSaving(false); }
  };

  const handleUpdatePost = async (postId: number, data: AgentPostFormData) => {
    setSaving(true);
    try {
      await updateAgentPost(agentId, postId, data);
      await reload();
      setEditingPost(null);
    } finally { setSaving(false); }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Xóa bài viết này?')) return;
    await deleteAgentPost(agentId, postId);
    await reload();
  };

  const handleGenerate = () => {
    if (!inputText.trim()) {
      setError('Nhập văn bản ở ô Input trước khi generate.');
      return;
    }
    if (!agent?.posts?.length) {
      setError('Cần thêm ít nhất 1 bài viết mẫu để AI học phong cách.');
      return;
    }
    setError('');
    setIsGenerating(true);
    setGeneratedText('');

    generateWithAgentStream(
      agentId,
      inputText,
      {
        onChunk: t => setGeneratedText(prev => prev + t),
        onStatus: () => {},
        onDone: t => { setGeneratedText(t); setIsGenerating(false); },
        onError: msg => { setError(msg); setIsGenerating(false); }
      }
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
    </div>
  );

  if (!agent) return null;

  const isSelected = selectedAgentId === agentId;

  return (
    <div className="space-y-4">
      {/* Back + header */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-300 transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
        <span className="text-xl">{agent.avatar_emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-200 truncate">{agent.name}</h3>
          <p className="text-xs text-gray-500">{agent.posts?.length || 0} bài mẫu • {agent.platform}</p>
        </div>
        <button onClick={() => setEditing(true)}
          className="p-1.5 text-gray-500 hover:text-violet-400 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <AgentForm
          initial={agent}
          onSave={handleSaveAgent}
          onCancel={() => setEditing(false)}
          saving={saving}
        />
      )}

      {/* Apply this agent button */}
      <button
        onClick={() => onSelectAgent(isSelected ? null : agentId)}
        className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
          isSelected
            ? 'bg-violet-600/30 border-violet-500 text-violet-200'
            : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-violet-600/50 hover:text-violet-300'
        }`}
      >
        {isSelected ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        {isSelected ? 'Agent đang được áp dụng ✓' : 'Áp dụng agent này vào bài viết'}
      </button>

      {/* Generate preview */}
      <div className="space-y-2">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !inputText.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white transition-all"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
          {isGenerating ? 'Đang tạo...' : 'Thử nghiệm phong cách ngay'}
        </button>

        {error && (
          <div className="flex items-start gap-2 p-2 bg-red-950/50 border border-red-800/50 rounded-lg text-xs text-red-300">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {generatedText && (
          <div className={`relative p-3 bg-gray-900/60 border rounded-xl text-sm text-gray-200 leading-relaxed whitespace-pre-wrap ${isGenerating ? 'border-emerald-600/50' : 'border-emerald-900/40'}`}>
            {generatedText}
            {isGenerating && <span className="inline-block w-0.5 h-4 bg-emerald-400 ml-0.5 animate-pulse align-middle" />}
            {!isGenerating && generatedText && (
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(generatedText);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white transition-all"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Đã copy' : 'Copy'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Training posts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            Bài viết mẫu ({agent.posts?.length || 0})
          </div>
          <button
            onClick={() => setAddingPost(true)}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm bài
          </button>
        </div>

        {addingPost && (
          <div className="mb-3">
            <PostForm
              onSave={handleAddPost}
              onCancel={() => setAddingPost(false)}
              saving={saving}
            />
          </div>
        )}

        {(!agent.posts || agent.posts.length === 0) && !addingPost && (
          <div className="text-center py-6 border border-dashed border-gray-800 rounded-xl">
            <BookOpen className="w-6 h-6 text-gray-700 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Chưa có bài viết mẫu nào</p>
            <p className="text-xs text-gray-600">Thêm bài viết do người thật viết để AI học phong cách</p>
          </div>
        )}

        <div className="space-y-2">
          {agent.posts?.map(post => (
            <div key={post.id} className="border border-gray-800 rounded-xl overflow-hidden">
              {editingPost === post.id ? (
                <div className="p-2">
                  <PostForm
                    initial={post}
                    onSave={data => handleUpdatePost(post.id, data)}
                    onCancel={() => setEditingPost(null)}
                    saving={saving}
                  />
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    className="w-full flex items-center gap-2 p-2.5 bg-gray-900/40 hover:bg-gray-800/40 transition-colors text-left"
                  >
                    {expandedPost === post.id
                      ? <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      : <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    }
                    <FileText className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-gray-300 flex-1 truncate">
                      {post.title || post.content.slice(0, 50) + '...'}
                    </span>
                    {post.platform && (
                      <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">
                        {post.platform}
                      </span>
                    )}
                    <span className="text-xs text-gray-600 ml-1">
                      {post.content.split(/\s+/).filter(Boolean).length}w
                    </span>
                  </button>

                  {expandedPost === post.id && (
                    <div className="border-t border-gray-800 p-3">
                      <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap mb-2">
                        {post.content}
                      </p>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingPost(post.id)}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-violet-400 transition-colors"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Xóa
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Agent List ────────────────────────────────────────────────────────────────
function AgentList({
  agents,
  onSelect,
  onNew,
  onDelete,
  selectedAgentId
}: {
  agents: Agent[];
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
  selectedAgentId: number | null;
}) {
  return (
    <div className="space-y-2">
      <button
        onClick={onNew}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-dashed border-violet-700/50 text-violet-400 hover:border-violet-500 hover:bg-violet-950/20 transition-all"
      >
        <Plus className="w-4 h-4" />
        Tạo AI Agent mới
      </button>

      {agents.length === 0 && (
        <div className="text-center py-8">
          <Bot className="w-8 h-8 text-gray-700 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Chưa có agent nào</p>
          <p className="text-xs text-gray-600">Tạo agent và thêm bài viết mẫu để AI học phong cách viết</p>
        </div>
      )}

      {agents.map(agent => (
        <div
          key={agent.id}
          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all group ${
            selectedAgentId === agent.id
              ? 'bg-violet-900/20 border-violet-600/50'
              : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
          }`}
          onClick={() => onSelect(agent.id)}
        >
          <span className="text-2xl flex-shrink-0">{agent.avatar_emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-200 truncate">{agent.name}</span>
              {selectedAgentId === agent.id && (
                <span className="text-xs bg-violet-600/30 text-violet-300 px-1.5 py-0.5 rounded-full border border-violet-600/50">Active</span>
              )}
            </div>
            {agent.description && (
              <p className="text-xs text-gray-500 truncate">{agent.description}</p>
            )}
            <p className="text-xs text-gray-600">{agent.post_count || 0} bài mẫu</p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => { e.stopPropagation(); onDelete(agent.id); }}
              className="p-1 text-gray-600 hover:text-red-400 transition-colors"
              title="Xóa agent"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main AgentManager ─────────────────────────────────────────────────────────
interface AgentManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAgentId: number | null;
  onSelectAgent: (id: number | null) => void;
  inputText: string;
}

export default function AgentManager({
  isOpen, onClose, selectedAgentId, onSelectAgent, inputText
}: AgentManagerProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'new' | number>('list');
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await listAgents();
      setAgents(res.agents);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) reload();
  }, [isOpen, reload]);

  const handleCreate = async (data: AgentFormData) => {
    setSaving(true);
    try {
      const res = await createAgent(data);
      await reload();
      setView(res.agent.id); // go directly to detail
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa agent này và toàn bộ bài viết mẫu?')) return;
    await deleteAgent(id);
    if (selectedAgentId === id) onSelectAgent(null);
    await reload();
    setView('list');
  };

  if (!isOpen) return null;

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-md h-full bg-gray-950 border-l border-gray-800 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-violet-400" />
            <span className="text-sm font-semibold text-gray-200">AI Writing Agents</span>
            {selectedAgentId && (
              <span className="text-xs bg-violet-600/30 text-violet-300 px-2 py-0.5 rounded-full border border-violet-600/50">
                1 active
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            </div>
          ) : view === 'list' ? (
            <AgentList
              agents={agents}
              onSelect={id => setView(id)}
              onNew={() => setView('new')}
              onDelete={handleDelete}
              selectedAgentId={selectedAgentId}
            />
          ) : view === 'new' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-300">
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <span className="text-sm font-medium text-gray-300">Tạo Agent Mới</span>
              </div>
              <AgentForm
                onSave={handleCreate}
                onCancel={() => setView('list')}
                saving={saving}
              />
            </div>
          ) : (
            <AgentDetail
              agentId={view as number}
              onBack={() => setView('list')}
              onSelectAgent={onSelectAgent}
              selectedAgentId={selectedAgentId}
              inputText={inputText}
            />
          )}
        </div>
      </div>
    </div>
  );
}
