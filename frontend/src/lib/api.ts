import {
  HumanizeSettings,
  HumanizeResponse,
  AnalyzeResponse,
  ModeConfig
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

export { ApiError };
