import {
  HumanizeSettings,
  HumanizeResponse,
  AnalyzeResponse,
  ModeConfig,
  Agent,
  AgentFormData,
  AgentPost,
  AgentPostFormData
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || 'Request failed',
      response.status,
      data.message
    );
  }

  return data as T;
}

export async function humanizeText(
  text: string,
  settings: HumanizeSettings,
  sessionId?: string
): Promise<HumanizeResponse> {
  const response = await fetch(`${API_URL}/api/humanize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text, settings, sessionId })
  });

  return handleResponse<HumanizeResponse>(response);
}

export async function analyzeText(
  text: string,
  sessionId?: string
): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text, sessionId })
  });

  return handleResponse<AnalyzeResponse>(response);
}

export async function getModes(): Promise<{ success: boolean; modes: ModeConfig[] }> {
  const response = await fetch(`${API_URL}/api/modes`);
  return handleResponse<{ success: boolean; modes: ModeConfig[] }>(response);
}

export async function checkHealth(): Promise<{
  status: string;
  timestamp: string;
  service: string;
  geminiConfigured: boolean;
}> {
  const response = await fetch(`${API_URL}/api/health`);
  return handleResponse(response);
}

export async function getHistory(sessionId: string): Promise<{
  success: boolean;
  sessionId: string;
  history: Array<{
    id: number;
    session_id: string;
    original_text: string;
    humanized_text: string | null;
    settings: Record<string, unknown> | null;
    scores: Record<string, unknown> | null;
    timestamp: string;
  }>;
}> {
  const response = await fetch(`${API_URL}/api/history/${encodeURIComponent(sessionId)}`);
  return handleResponse(response);
}

export type StreamCallbacks = {
  onChunk: (text: string) => void;
  onStatus: (message: string) => void;
  onDone: (result: { humanizedText: string; scores: HumanizeResponse['scores']; sessionId: string }) => void;
  onError: (message: string) => void;
};

/**
 * Stream humanized text via SSE (TC015 - Live Rewrite)
 */
export function humanizeTextStream(
  text: string,
  settings: HumanizeSettings,
  callbacks: StreamCallbacks,
  sessionId?: string
): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(`${API_URL}/api/humanize/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, settings, sessionId }),
        signal: controller.signal
      });

      if (!response.ok || !response.body) {
        const err = await response.json().catch(() => ({ message: 'Stream failed' }));
        callbacks.onError(err.message || 'Stream request failed');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) continue;
          if (line.startsWith('data: ')) {
            try {
              const payload = JSON.parse(line.slice(6));
              // Find the event type from previous line (simplified: check payload shape)
              if (payload.text !== undefined) {
                callbacks.onChunk(payload.text);
              } else if (payload.humanizedText !== undefined) {
                callbacks.onDone({
                  humanizedText: payload.humanizedText,
                  scores: payload.scores,
                  sessionId: payload.sessionId
                });
              } else if (payload.message !== undefined && payload.sessionId === undefined) {
                callbacks.onStatus(payload.message);
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        callbacks.onError(err.message || 'Stream connection failed');
      }
    }
  })();

  return () => controller.abort();
}

// ── AI Agent API ──────────────────────────────────────────────────────────────

export async function listAgents(): Promise<{ success: boolean; agents: Agent[] }> {
  const res = await fetch(`${API_URL}/api/agents`);
  return handleResponse(res);
}

export async function getAgent(id: number): Promise<{ success: boolean; agent: Agent }> {
  const res = await fetch(`${API_URL}/api/agents/${id}`);
  return handleResponse(res);
}

export async function createAgent(data: AgentFormData): Promise<{ success: boolean; agent: Agent }> {
  const res = await fetch(`${API_URL}/api/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function updateAgent(id: number, data: Partial<AgentFormData>): Promise<{ success: boolean; agent: Agent }> {
  const res = await fetch(`${API_URL}/api/agents/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function deleteAgent(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/api/agents/${id}`, { method: 'DELETE' });
  return handleResponse(res);
}

export async function addAgentPost(agentId: number, data: AgentPostFormData): Promise<{ success: boolean; post: AgentPost }> {
  const res = await fetch(`${API_URL}/api/agents/${agentId}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function updateAgentPost(agentId: number, postId: number, data: Partial<AgentPostFormData>): Promise<{ success: boolean; post: AgentPost }> {
  const res = await fetch(`${API_URL}/api/agents/${agentId}/posts/${postId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function deleteAgentPost(agentId: number, postId: number): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/api/agents/${agentId}/posts/${postId}`, { method: 'DELETE' });
  return handleResponse(res);
}

export async function generateWithAgent(
  agentId: number,
  text: string,
  settings?: Partial<HumanizeSettings>
): Promise<{ success: boolean; generatedText: string; agentName: string }> {
  const res = await fetch(`${API_URL}/api/agents/${agentId}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, settings })
  });
  return handleResponse(res);
}

export type AgentStreamCallbacks = {
  onChunk: (text: string) => void;
  onStatus: (message: string) => void;
  onDone: (generatedText: string) => void;
  onError: (message: string) => void;
};

export function generateWithAgentStream(
  agentId: number,
  text: string,
  callbacks: AgentStreamCallbacks,
  settings?: Partial<HumanizeSettings>
): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(`${API_URL}/api/agents/${agentId}/generate/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, settings }),
        signal: controller.signal
      });

      if (!response.ok || !response.body) {
        const err = await response.json().catch(() => ({ message: 'Stream failed' }));
        callbacks.onError(err.message || 'Stream failed');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.text !== undefined) callbacks.onChunk(payload.text);
            else if (payload.generatedText !== undefined) callbacks.onDone(payload.generatedText);
            else if (payload.message !== undefined && payload.generatedText === undefined) callbacks.onStatus(payload.message);
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') callbacks.onError(err.message || 'Stream failed');
    }
  })();

  return () => controller.abort();
}

export { ApiError };
