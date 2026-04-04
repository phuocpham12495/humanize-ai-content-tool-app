# Tài Liệu API Reference — Humanize AI Content Tool

> **Vai trò**: Người Viết Kỹ Thuật  
> **Phiên bản API**: 1.0.0  
> **Base URL**: `http://localhost:3001`

---

## TypeScript Interfaces

```typescript
// Request/Response types

interface HumanizeRequest {
  text: string;                    // Văn bản cần humanize (tối đa 10.000 ký tự)
  settings?: HumanizeSettings;     // Cài đặt tùy chọn
  sessionId?: string;              // UUID session (optional, tạo mới nếu không có)
}

interface HumanizeResponse {
  success: boolean;
  sessionId: string;               // UUID của session
  historyId: number;               // ID bản ghi trong DB
  originalText: string;
  humanizedText: string;
  scores: OutputScores;
  settings: HumanizeSettings;
}

interface AnalyzeRequest {
  text: string;                    // Văn bản cần phân tích
  sessionId?: string;
}

interface AnalyzeResponse {
  success: boolean;
  sessionId: string;
  analysis: AnalysisResult;
}

interface AnalysisResult {
  aiLikenessScore: number;         // 0-100, càng cao càng giống AI
  suspiciousSentences: SuspiciousSentence[];
  metrics: AnalysisMetrics;
  overallAssessment?: string;
}

interface SuspiciousSentence {
  text: string;                    // Câu văn đáng ngờ
  reason: string;                  // Lý do bị đánh dấu
  suggestion?: string;             // Gợi ý thay thế nghe tự nhiên hơn (TC014)
}

interface AnalysisMetrics {
  burstiness: number;              // 0-100, cao = tự nhiên
  perplexity: number;              // 0-100, cao = ít đoán được
  sentenceVariance: number;        // 0-100, cao = đa dạng cấu trúc
}

interface OutputScores {
  humanScore: number;              // 0-100, cao = nghe như người
  aiDetectability: number;         // 0-100, cao = dễ bị phát hiện là AI
  engagementPotential: number;     // 0-100, cao = dễ viral/tương tác
  improvements?: string[];         // Gợi ý cải thiện
  strengths?: string[];            // Điểm mạnh của output
}

interface HumanizeSettings {
  writingStyle: 'casual' | 'professional' | 'storytelling' | 'opinionated' | 'messy_human';
  platform: 'facebook' | 'tiktok' | 'linkedin' | 'twitter';
  emotionalDepth: number;          // 0-100
  personalitySlider: number;       // 0-100: mức độ anecdote cá nhân (TC004_04)
  humor: number;                   // 0-100
  formality: number;               // 0-100
  imperfections: boolean;          // Thêm lỗi ngữ pháp, fragment, thiên kiến nhỏ
  humanNoise: boolean;             // Chèn cụm do dự & tự sửa (TC010)
  antiAIDetector: boolean;         // Chế độ tránh AI detector
  persona: 'beginner' | 'expert' | 'influencer' | 'skeptic';
  culturalTone: 'vietnamese' | 'us' | 'neutral';
  oneClickMode: 'human' | 'viral' | 'controversial' | 'relatable' | null;
  humanFingerprint: HumanFingerprint;
}

interface HumanFingerprint {
  favoritePhrases: string;         // Cụm từ yêu thích
  emojiHabits: string;             // Thói quen dùng emoji
  punctuationStyle: 'normal' | 'dramatic' | 'minimal';
  sentenceRhythm: 'mixed' | 'long' | 'short'; // Nhịp điệu câu văn (TC006_04)
}

interface ModeConfig {
  id: number;
  name: string;
  parameters: Partial<HumanizeSettings> & { description?: string };
  created_at: string;
}

interface HealthResponse {
  status: 'ok';
  timestamp: string;               // ISO 8601
  service: string;
  version: string;
  geminiConfigured: boolean;
}

// Error response
interface ErrorResponse {
  error: string;                   // Error type
  message: string;                 // Human-readable message
}
```

---

## Endpoints

### POST /api/humanize

Chuyển đổi văn bản AI thành nội dung tự nhiên, nghe như người viết.

**Request**

```http
POST /api/humanize
Content-Type: application/json

{
  "text": "Artificial intelligence has revolutionized numerous industries by providing unprecedented capabilities for data processing and pattern recognition. Furthermore, it is worth noting that these advancements have significant implications for the future of work.",
  "settings": {
    "writingStyle": "casual",
    "platform": "facebook",
    "emotionalDepth": 70,
    "imperfections": true,
    "antiAIDetector": true,
    "persona": "beginner",
    "culturalTone": "neutral",
    "oneClickMode": null,
    "humanFingerprint": {
      "favoritePhrases": "honestly, you know what",
      "emojiHabits": "😅 for irony, ❤️ for warmth",
      "punctuationStyle": "normal"
    }
  }
}
```

**Response 200 OK**

```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "historyId": 42,
  "originalText": "Artificial intelligence has revolutionized...",
  "humanizedText": "Honestly? AI has changed EVERYTHING. And I mean everything...",
  "scores": {
    "humanScore": 84,
    "aiDetectability": 16,
    "engagementPotential": 72,
    "improvements": ["Could add a personal story here"],
    "strengths": ["Great casual tone", "Natural sentence variation"]
  },
  "settings": { "writingStyle": "casual", "...": "..." }
}
```

**Error Responses**

| Status | Error | Điều kiện |
|--------|-------|-----------|
| 400 | `Invalid request` | `text` rỗng hoặc thiếu |
| 400 | `Text too long` | `text` > 10.000 ký tự |
| 500 | `Configuration error` | `GEMINI_API_KEY` chưa được set |
| 500 | `Humanization failed` | Lỗi từ Gemini API |

---

### POST /api/humanize/stream *(TC015 — Live Rewrite)*

Stream kết quả humanize theo thời gian thực qua **Server-Sent Events (SSE)**.

**Request**

```http
POST /api/humanize/stream
Content-Type: application/json

{
  "text": "Văn bản cần humanize...",
  "settings": { ... },
  "sessionId": "optional-uuid"
}
```

**Response**: `text/event-stream`

Các event được gửi theo thứ tự:

```
event: status
data: {"message": "Starting humanization...", "sessionId": "uuid"}

event: chunk
data: {"text": "Honestly? AI has changed"}

event: chunk
data: {"text": " EVERYTHING..."}

event: status
data: {"message": "Scoring output..."}

event: done
data: {"humanizedText": "...", "scores": {...}, "historyId": 42, "sessionId": "uuid"}
```

Nếu lỗi:
```
event: error
data: {"message": "Chi tiết lỗi"}
```

**Frontend Usage** (`api.ts`):
```typescript
const stopStream = humanizeTextStream(text, settings, {
  onChunk: (chunk) => setOutput(prev => prev + chunk),
  onStatus: (msg) => setStatus(msg),
  onDone: (result) => { setOutput(result.humanizedText); setScores(result.scores); },
  onError: (msg) => setError(msg)
});

// Để hủy stream:
stopStream();
```

**Error Responses** (trước khi headers SSE được gửi):

| Status | Điều kiện |
|--------|-----------|
| 400 | `text` rỗng hoặc > 10.000 ký tự |

---

### POST /api/analyze

Phân tích văn bản để phát hiện patterns AI.

**Request**

```http
POST /api/analyze
Content-Type: application/json

{
  "text": "Text to analyze for AI patterns...",
  "sessionId": "optional-session-uuid"
}
```

**Response 200 OK**

```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "analysis": {
    "aiLikenessScore": 78,
    "suspiciousSentences": [
      {
        "text": "Furthermore, it is worth noting that these advancements...",
        "reason": "Formal AI transition phrase 'Furthermore, it is worth noting'"
      }
    ],
    "metrics": {
      "burstiness": 35,
      "perplexity": 40,
      "sentenceVariance": 30
    },
    "overallAssessment": "Clearly AI-generated: uniform sentence length, formal transitions, lacks personality."
  }
}
```

**Error Responses**

| Status | Error | Điều kiện |
|--------|-------|-----------|
| 400 | `Invalid request` | `text` rỗng hoặc thiếu |
| 400 | `Text too long` | `text` > 10.000 ký tự |
| 500 | `Analysis failed` | Lỗi từ Gemini API |

---

### GET /api/modes

Lấy danh sách preset modes từ database.

**Request**

```http
GET /api/modes
```

**Response 200 OK**

```json
{
  "success": true,
  "modes": [
    {
      "id": 1,
      "name": "Make it Human",
      "parameters": {
        "writingStyle": "casual",
        "emotionalDepth": 70,
        "imperfections": true,
        "antiAIDetector": true,
        "persona": "beginner",
        "culturalTone": "neutral",
        "oneClickMode": "human",
        "description": "Transform AI text into natural, human-sounding content..."
      },
      "created_at": "2026-04-04T08:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Make it Viral",
      "parameters": { "...": "..." },
      "created_at": "..."
    },
    {
      "id": 3,
      "name": "Make it Controversial",
      "parameters": { "...": "..." },
      "created_at": "..."
    },
    {
      "id": 4,
      "name": "Make it Relatable",
      "parameters": { "...": "..." },
      "created_at": "..."
    }
  ]
}
```

---

### GET /api/history/:sessionId

Lấy lịch sử humanization của một session.

**Request**

```http
GET /api/history/550e8400-e29b-41d4-a716-446655440000
```

**Response 200 OK**

```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "history": [
    {
      "id": 42,
      "session_id": "550e8400-e29b-41d4-a716-446655440000",
      "original_text": "AI-generated content here...",
      "humanized_text": "Humanized version here...",
      "settings": { "writingStyle": "casual", "...": "..." },
      "scores": { "humanScore": 84, "aiDetectability": 16, "engagementPotential": 72 },
      "timestamp": "2026-04-04T10:30:00.000Z"
    }
  ]
}
```

**Error Responses**

| Status | Error | Điều kiện |
|--------|-------|-----------|
| 400 | `Invalid request` | `sessionId` rỗng |
| 500 | `Failed to get history` | Lỗi database |

---

### GET /api/health

Kiểm tra trạng thái server.

**Request**

```http
GET /api/health
```

**Response 200 OK**

```json
{
  "status": "ok",
  "timestamp": "2026-04-04T08:30:00.000Z",
  "service": "humanize-ai-backend",
  "version": "1.0.0",
  "geminiConfigured": true
}
```

---

## Mã Lỗi & Xử Lý

### HTTP Status Codes

| Code | Ý nghĩa | Khi nào xảy ra |
|------|---------|----------------|
| 200 | OK | Request thành công |
| 400 | Bad Request | Dữ liệu đầu vào không hợp lệ |
| 404 | Not Found | Route không tồn tại |
| 500 | Internal Server Error | Lỗi server hoặc Gemini API |

### Error Object Format

```json
{
  "error": "Short error type",
  "message": "Human-readable description of what went wrong"
}
```

### Xử Lý Lỗi trong Frontend

```typescript
import { humanizeText, ApiError } from '@/lib/api';

try {
  const result = await humanizeText(text, settings);
  // Xử lý thành công
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.statusCode}: ${error.message}`);
    if (error.details) {
      console.error('Details:', error.details);
    }
    // Hiển thị error message cho user
    setError(error.details || error.message);
  } else {
    // Network error hoặc unexpected error
    setError('Connection failed. Is the backend running?');
  }
}
```

---

## Giới Hạn & Constraints

| Giới hạn | Giá trị | Lý do |
|----------|---------|-------|
| Độ dài văn bản tối đa | 10.000 ký tự | Tránh quá tải Gemini API |
| Content-Type | `application/json` | Chỉ JSON |
| CORS origin | `localhost:3000` | Chỉ local dev |
| Body size | 1MB | Express middleware limit |
| Timeout | Không giới hạn cứng | Gemini có thể mất 30s+ |

---

## Xác Thực

Phiên bản hiện tại **không yêu cầu xác thực** (authentication). API key Gemini được lưu server-side, không expose ra client.

Nếu deploy lên production, nên thêm:
- JWT/API key authentication
- Rate limiting (express-rate-limit)
- HTTPS
