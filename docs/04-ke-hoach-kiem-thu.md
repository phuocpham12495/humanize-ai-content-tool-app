# Kế Hoạch Kiểm Thử — Humanize AI Content Tool

> **Vai trò**: Kiến Trúc Sư QA  
> **Phiên bản**: 1.2.0  
> **Ngày**: 2026-04-04 (cập nhật: audit đầy đủ)

---

## 0. Trạng Thái Test Cases (Audit 2026-04-04)

| Test Case | Mô tả | Trạng thái |
|-----------|-------|------------|
| TC001 | AI-likeness score & suspicious sentences | ✅ Implemented |
| TC002 | Writing style transformation (5 styles) | ✅ Implemented |
| TC003 | Human imperfections (grammar, fragments, bias) | ✅ Implemented |
| TC004 | Personalization with personality slider | ✅ Implemented |
| TC005 | Platform optimization (FB/TikTok/LinkedIn/Twitter) | ✅ Implemented |
| TC006 | Writing quirks fingerprint (phrases, emoji, punctuation, rhythm) | ✅ Implemented |
| TC007 | Anti-AI detector mode | ✅ Implemented |
| TC008 | Side-by-side comparison with green/red diff | ✅ Implemented (diff-match-patch) |
| TC009 | Emotional depth slider (0-100%) | ✅ Implemented |
| TC010 | Human noise injection (hesitation/corrections) | ✅ Implemented |
| TC011 | Persona rewrite (Beginner/Expert/Influencer/Skeptic) | ✅ Implemented |
| TC012 | Cultural tone (Vietnamese/US/Neutral) | ✅ Implemented |
| TC013 | One-click modes + auto-trigger | ✅ Implemented |
| TC014 | Inline red underline + hover tooltip + suggestions | ✅ Implemented |
| TC015 | Live streaming rewrite (SSE) | ✅ Implemented |
| TC016 | Tone playground: Humor, Formality, Emotion sliders | ✅ Implemented |
| TC017 | Comprehensive score: humanScore, aiDetectability, engagementPotential | ✅ Implemented |
| TC018 | Facebook viral: hook, curiosity gap, emotional triggers, CTA | ✅ Implemented |
| TC019 | Model selection: geminiModel/geminiImageModel applied to all features | ✅ Implemented |
| TC020 | Save/Load model settings to/from database | ✅ Implemented |
| TC021 | Dynamic model fetching from Gemini API | ✅ Implemented |
| TC022 | SSE error events properly parsed (not swallowed as status) | ✅ Implemented |
| TC023 | Error display with actual reason in all features | ✅ Implemented |
| TC024 | Image caption overlay (pink banner, serif font) | ✅ Implemented |
| TC025 | Logo transparent background (remove white) | ✅ Implemented |
| TC026 | Image generate disabled without prompt | ✅ Implemented |
| TC027 | Video character consistency (base character across all prompts) | ✅ Implemented |
| TC028 | Prompt Log tab: view all AI prompts and responses with timing | ✅ Implemented |

---

## 1. Tổng Quan Kế Hoạch

### Phạm vi kiểm thử
- **Unit Tests**: Services, database helpers, API response parsing
- **Integration Tests**: API endpoints với mock Gemini
- **E2E Tests**: Luồng người dùng hoàn chỉnh
- **Manual Tests**: UI/UX, visual regression

### Công cụ đề xuất
- **Unit/Integration**: Jest + Supertest (backend), React Testing Library (frontend)
- **E2E**: Playwright hoặc Cypress
- **Mock**: `jest.mock()` cho Gemini API calls

---

## 2. Unit Tests

### 2.1 Backend — Database Helper (`database.js`)

```javascript
// tests/unit/database.test.js
const { getConfigs, getConfigByName, saveHistory, getHistory } = require('../../src/db/database');

describe('Database Helpers', () => {
  describe('getConfigs()', () => {
    it('should return 4 default seed configs', () => {
      const configs = getConfigs();
      expect(configs).toHaveLength(4);
    });

    it('should include "Make it Human" config', () => {
      const configs = getConfigs();
      const humanConfig = configs.find(c => c.name === 'Make it Human');
      expect(humanConfig).toBeDefined();
      expect(humanConfig.parameters.oneClickMode).toBe('human');
    });

    it('should parse parameters_json into objects', () => {
      const configs = getConfigs();
      configs.forEach(config => {
        expect(typeof config.parameters).toBe('object');
        expect(config.parameters_json).toBeUndefined(); // raw field should be mapped
      });
    });
  });

  describe('getConfigByName()', () => {
    it('should return config by exact name', () => {
      const config = getConfigByName('Make it Viral');
      expect(config).not.toBeNull();
      expect(config.parameters.oneClickMode).toBe('viral');
    });

    it('should return null for non-existent name', () => {
      const config = getConfigByName('Non Existent');
      expect(config).toBeNull();
    });
  });

  describe('saveHistory() and getHistory()', () => {
    const testSessionId = 'test-session-' + Date.now();

    it('should save and retrieve session history', () => {
      const id = saveHistory(
        testSessionId,
        'Original AI text',
        'Humanized text',
        { writingStyle: 'casual' },
        { humanScore: 85 }
      );
      
      expect(typeof id).toBe('number');
      
      const history = getHistory(testSessionId);
      expect(history).toHaveLength(1);
      expect(history[0].original_text).toBe('Original AI text');
      expect(history[0].settings.writingStyle).toBe('casual');
      expect(history[0].scores.humanScore).toBe(85);
    });

    it('should save history with null humanized text (analyze-only)', () => {
      const id = saveHistory(testSessionId, 'Text to analyze', null, null, null);
      expect(id).toBeGreaterThan(0);
    });
  });
});
```

### 2.2 Backend — Gemini Service (Mocked)

```javascript
// tests/unit/geminiService.test.js
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn()
    })
  }))
}));

const { analyzeText, humanizeText, scoreOutput } = require('../../src/services/geminiService');

describe('GeminiService', () => {
  let mockGenerateContent;

  beforeEach(() => {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const mockModel = GoogleGenerativeAI.mock.results[0].value.getGenerativeModel();
    mockGenerateContent = mockModel.generateContent;
  });

  describe('analyzeText()', () => {
    it('should parse valid JSON response', async () => {
      const mockResponse = {
        aiLikenessScore: 78,
        suspiciousSentences: [
          { text: "Furthermore, it is worth noting...", reason: "Formal AI transition" }
        ],
        metrics: { burstiness: 35, perplexity: 40, sentenceVariance: 30 },
        overallAssessment: "Clearly AI-generated"
      };

      mockGenerateContent.mockResolvedValue({
        response: { text: () => JSON.stringify(mockResponse) }
      });

      const result = await analyzeText('Some AI generated text');
      expect(result.aiLikenessScore).toBe(78);
      expect(result.metrics.burstiness).toBe(35);
      expect(result.suspiciousSentences).toHaveLength(1);
    });

    it('should handle JSON wrapped in markdown code blocks', async () => {
      const mockResponse = { aiLikenessScore: 60, suspiciousSentences: [], metrics: { burstiness: 50, perplexity: 55, sentenceVariance: 45 } };
      
      mockGenerateContent.mockResolvedValue({
        response: { text: () => '```json\n' + JSON.stringify(mockResponse) + '\n```' }
      });

      const result = await analyzeText('Test text');
      expect(result.aiLikenessScore).toBe(60);
    });

    it('should throw error when GEMINI_API_KEY not set', async () => {
      delete process.env.GEMINI_API_KEY;
      await expect(analyzeText('text')).rejects.toThrow('GEMINI_API_KEY');
    });
  });

  describe('humanizeText()', () => {
    it('should return humanized text string', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => 'This is the humanized version of the text.' }
      });

      const result = await humanizeText('AI generated text', { writingStyle: 'casual' });
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should work with all settings applied', async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => 'Humanized output' }
      });

      const settings = {
        writingStyle: 'opinionated',
        platform: 'twitter',
        emotionalDepth: 85,
        imperfections: true,
        antiAIDetector: true,
        persona: 'skeptic',
        culturalTone: 'us',
        oneClickMode: 'controversial',
        humanFingerprint: { favoritePhrases: 'honestly', emojiHabits: '🔥', punctuationStyle: 'dramatic' }
      };

      await expect(humanizeText('Text', settings)).resolves.toBeTruthy();
    });
  });

  describe('scoreOutput()', () => {
    it('should return scores within valid ranges', async () => {
      const mockScores = {
        humanScore: 82,
        aiDetectability: 18,
        engagementPotential: 75,
        improvements: ['Add more personal anecdotes'],
        strengths: ['Natural sentence variation']
      };

      mockGenerateContent.mockResolvedValue({
        response: { text: () => JSON.stringify(mockScores) }
      });

      const result = await scoreOutput('Original', 'Humanized');
      expect(result.humanScore).toBeGreaterThanOrEqual(0);
      expect(result.humanScore).toBeLessThanOrEqual(100);
      expect(result.aiDetectability).toBeGreaterThanOrEqual(0);
      expect(result.engagementPotential).toBeGreaterThanOrEqual(0);
    });
  });
});
```

### 2.3 Frontend — API Client (`api.ts`)

```typescript
// tests/unit/api.test.ts
import { humanizeText, analyzeText, ApiError } from '@/lib/api';

global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('humanizeText()', () => {
    it('should call correct endpoint with POST method', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, humanizedText: 'Result', scores: {} })
      });

      await humanizeText('text', defaultSettings);
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/humanize'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should throw ApiError on non-OK response', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid request', message: 'Text is empty' })
      });

      await expect(humanizeText('', defaultSettings)).rejects.toThrow(ApiError);
    });
  });

  describe('ApiError', () => {
    it('should have statusCode and details properties', () => {
      const err = new ApiError('Test error', 500, 'Detail message');
      expect(err.statusCode).toBe(500);
      expect(err.details).toBe('Detail message');
      expect(err.name).toBe('ApiError');
    });
  });
});
```

---

## 3. Integration Tests

### 3.1 POST /api/humanize

```javascript
// tests/integration/humanize.test.js
const request = require('supertest');
const app = require('../../src/index');

// Mock geminiService để không gọi API thật
jest.mock('../../src/services/geminiService', () => ({
  humanizeText: jest.fn().mockResolvedValue('This is humanized text.'),
  scoreOutput: jest.fn().mockResolvedValue({
    humanScore: 80,
    aiDetectability: 20,
    engagementPotential: 70,
    improvements: [],
    strengths: []
  })
}));

describe('POST /api/humanize', () => {
  it('should return 200 with humanized text', async () => {
    const res = await request(app)
      .post('/api/humanize')
      .send({ text: 'This is AI generated content that needs to be humanized.' });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.humanizedText).toBeDefined();
    expect(res.body.scores).toBeDefined();
    expect(res.body.sessionId).toBeDefined();
  });

  it('should return 400 when text is empty', async () => {
    const res = await request(app)
      .post('/api/humanize')
      .send({ text: '' });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should return 400 when text exceeds 10000 chars', async () => {
    const longText = 'a'.repeat(10001);
    const res = await request(app)
      .post('/api/humanize')
      .send({ text: longText });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Text too long');
  });

  it('should accept custom settings', async () => {
    const res = await request(app)
      .post('/api/humanize')
      .send({
        text: 'Test text for humanization',
        settings: { writingStyle: 'professional', emotionalDepth: 60 }
      });
    
    expect(res.status).toBe(200);
    expect(res.body.settings.writingStyle).toBe('professional');
  });

  it('should persist session_id across requests', async () => {
    const firstRes = await request(app)
      .post('/api/humanize')
      .send({ text: 'First text' });
    
    const sessionId = firstRes.body.sessionId;
    
    const secondRes = await request(app)
      .post('/api/humanize')
      .send({ text: 'Second text', sessionId });
    
    expect(secondRes.body.sessionId).toBe(sessionId);
  });
});
```

### 3.2 POST /api/analyze

```javascript
describe('POST /api/analyze', () => {
  beforeEach(() => {
    jest.mock('../../src/services/geminiService', () => ({
      analyzeText: jest.fn().mockResolvedValue({
        aiLikenessScore: 75,
        suspiciousSentences: [{ text: 'Furthermore...', reason: 'AI transition' }],
        metrics: { burstiness: 40, perplexity: 35, sentenceVariance: 30 },
        overallAssessment: 'Likely AI-generated'
      })
    }));
  });

  it('should return analysis result', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ text: 'AI content to analyze' });
    
    expect(res.status).toBe(200);
    expect(res.body.analysis.aiLikenessScore).toBeDefined();
    expect(res.body.analysis.metrics).toBeDefined();
  });
});
```

### 3.3 GET /api/modes

```javascript
describe('GET /api/modes', () => {
  it('should return 4 default modes', async () => {
    const res = await request(app).get('/api/modes');
    
    expect(res.status).toBe(200);
    expect(res.body.modes).toHaveLength(4);
    
    const modeNames = res.body.modes.map(m => m.name);
    expect(modeNames).toContain('Make it Human');
    expect(modeNames).toContain('Make it Viral');
  });
});
```

---

## 4. E2E Test Scenarios (User Stories)

### Scenario 1: Luồng Phân Tích Cơ Bản

```
Người dùng: Nhà nghiên cứu muốn kiểm tra nội dung
Kịch bản: Phát hiện văn bản AI

Steps:
1. Mở http://localhost:3000
2. Paste đoạn văn bản AI vào textarea
3. Click nút "Analyze"
4. Xem tab "Analysis" mở ra
5. Kiểm tra: AI Likeness Score hiển thị
6. Kiểm tra: Suspicious sentences được highlight
7. Kiểm tra: Metrics bars (Burstiness, Perplexity, Variance) có màu phù hợp

Expected: Score > 70 cho text AI rõ ràng
```

### Scenario 2: Luồng Humanize với One-Click Mode

```
Người dùng: Content creator muốn đăng lên TikTok
Kịch bản: Make it Viral

Steps:
1. Click button "Make it Viral" trong Quick Modes
2. Kiểm tra settings tự động thay đổi (platform = TikTok, emotionalDepth = 90)
3. Paste text AI vào textarea
4. Click "Humanize"
5. Xem output xuất hiện trong tab "Output"
6. Kiểm tra Human Score > 70
7. Click "Copy" và verify clipboard

Expected: Text ngắn, punchy, phù hợp TikTok
```

### Scenario 3: Luồng So Sánh Before/After

```
Steps:
1. Paste text vào input
2. Click "Humanize"
3. Click tab "Compare"
4. Kiểm tra: Cả hai cột hiển thị
5. Kiểm tra: Từ unique được highlight tím
6. Kiểm tra: Stats bar hiển thị word count difference

Expected: Rõ ràng thấy sự thay đổi
```

### Scenario 4: Error Handling khi Backend offline

```
Steps:
1. Tắt backend server
2. Mở frontend
3. Kiểm tra: Warning banner "Backend offline" xuất hiện
4. Paste text và click "Humanize"
5. Kiểm tra: Error message hiển thị
6. Khởi động lại backend
7. Kiểm tra: Status indicator chuyển xanh

Expected: Graceful error handling, không crash app
```

---

## 5. CI/CD Pipeline Configuration

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      - run: cd backend && npm ci
      - run: cd backend && npm test
    env:
      GEMINI_API_KEY: mock-key-for-tests

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
      - run: cd frontend && npm test
```

---

## 6. Test Coverage Targets

| Module | Target Coverage |
|--------|----------------|
| `database.js` | 90%+ |
| `geminiService.js` | 85%+ (mocked) |
| `routes/humanize.js` | 90%+ |
| Frontend `api.ts` | 85%+ |
| Frontend components | 70%+ |
