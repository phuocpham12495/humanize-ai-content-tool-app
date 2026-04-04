# Hướng Dẫn Lập Trình Viên — Humanize AI Content Tool

> **Vai trò**: Mentor Lập Trình Viên Cao Cấp  
> **Ngày**: 2026-04-04

---

## 1. Điểm Vào & Luồng Khởi Động

### Backend Entry Point: `backend/src/index.js`

```javascript
// Thứ tự khởi động:
require('dotenv').config()      // 1. Load .env variables
const express = require(...)    // 2. Khởi tạo Express
app.use(cors(...))              // 3. CORS middleware
app.use(express.json())         // 4. Body parser
app.use('/api', routes)         // 5. Mount routes
// Khi route /api/humanize được gọi:
//   → routes/humanize.js
//   → geminiService.js (gọi Gemini API)
//   → database.js (lưu kết quả)
//   → Response về client
app.listen(3001)                // 6. Start listening
```

### Frontend Entry Point: `frontend/src/app/layout.tsx` → `page.tsx`

```
Next.js App Router Boot Sequence:
layout.tsx (Root Layout - wraps everything)
  └── page.tsx (Home page - 'use client')
        ├── State initialization (useState hooks)
        ├── useEffect: checkHealth() on mount
        └── Render layout:
              ├── <header> (ActionButtons, status)
              ├── <aside> (SettingsPanel)
              ├── Center column (TextInput)
              └── Right column (Output/Analysis/Comparison tabs)
```

---

## 2. Cây Component

```
page.tsx  [Client Component]
│  State: inputText, humanizedText, settings, analysis, 
│         scores, isAnalyzing, isHumanizing, activeView,
│         sessionId, error, backendStatus
│
├── <header>
│   └── ActionButtons.tsx  [Client Component]
│       Props: onAnalyze, onHumanize, onCompare, 
│              isAnalyzing, isHumanizing, hasInput, hasOutput, activeView
│       Events: onClick → calls parent handlers
│
├── <aside> (Settings sidebar)
│   └── SettingsPanel.tsx  [Client Component]
│       Props: settings, onChange, disabled
│       State: isOpen for each CollapsibleSection (local)
│       Events: onChange → update parent settings state
│       Sub-components:
│           ├── CollapsibleSection (inline)
│           ├── Slider (inline)
│           └── Toggle (inline)
│
├── Center column
│   └── TextInput.tsx  [Client Component]
│       Props: value, onChange, disabled
│       Ref: textareaRef (for focus after clear)
│       Events: onChange, handleClear, handlePaste
│
└── Right column (tab views)
    ├── OutputPanel.tsx  [Client Component]  (activeView === 'output')
    │   Props: text, scores, isLoading
    │   State: copied (clipboard state)
    │   Sub-component: ScoreDisplay.tsx
    │       Props: scores
    │       (no local state, pure display)
    │
    ├── AnalysisPanel.tsx  [Client Component]  (activeView === 'analysis')
    │   Props: analysis, isLoading
    │   (no local state, pure display)
    │   Sub-components: MetricBar (inline)
    │
    └── ComparisonView.tsx  [Client Component]  (activeView === 'comparison')
        Props: originalText, humanizedText
        Derived: highlights via useMemo()
```

---

## 3. Luồng Quản Lý State

### State chính trong `page.tsx`

```typescript
// State diagram cho luồng Humanize:

USER_TYPES_TEXT
    │
    ▼
inputText: string          [TextInput onChange]
    │
    │  User clicks "Humanize"
    ▼
isHumanizing: true         [setIsHumanizing(true)]
activeView: 'output'       [tab switches to output]
humanizedText: ''          [reset output]
scores: null               [reset scores]
    │
    │  await humanizeText(inputText, settings)
    ▼
[API call to backend /api/humanize]
    │
    │  Success
    ▼
humanizedText: string      [setHumanizedText(result.humanizedText)]
scores: OutputScores       [setScores(result.scores)]
sessionId: string          [setSessionId(result.sessionId)]
isHumanizing: false        [setIsHumanizing(false)]
    │
    │  Error
    ▼
error: string              [setError(err.message)]
isHumanizing: false
```

### Luồng Settings

```typescript
// Settings được quản lý hoàn toàn trong page.tsx
// và pass xuống SettingsPanel qua props

// SettingsPanel.onChange được gọi khi user thay đổi bất kỳ setting nào
const handleSettingsChange = (newSettings: HumanizeSettings) => {
  setSettings(newSettings);  // Cập nhật state trong page.tsx
};

// One-click modes ghi đè nhiều settings cùng lúc:
const applyOneClickMode = (mode: OneClickMode) => {
  onChange({ ...settings, ...modePresets[mode] });
  // Spread operator: giữ các settings không bị ghi đè
};
```

---

## 4. Chiến Lược Data Fetching & Caching

### API Calls Pattern

```typescript
// Pattern trong api.ts:
// 1. Fetch với error handling
// 2. Parse response
// 3. Throw ApiError với status code nếu lỗi

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(data.error, response.status, data.message);
  }
  return data as T;
}

// Usage trong component:
try {
  const result = await humanizeText(text, settings, sessionId);
  // Update state với kết quả
} catch (err) {
  if (err instanceof ApiError) {
    setError(err.details || err.message);
  }
}
```

### Không có Client-side Caching (MVP)

Hiện tại không implement caching vì:
- Text humanization thường unique (không repeat query)
- Session history được lưu ở SQLite backend
- Nếu cần: thêm `useMemo` hoặc `SWR` cho `/api/modes`

### Backend Gemini Calls

```javascript
// geminiService.js pattern:
// 1. Lazy initialize genAI instance
// 2. Build prompt với settings
// 3. Call generateContent
// 4. Parse JSON response với fallback

let genAI = null;  // Lazy singleton
function getGenAI() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}
```

---

## 5. Các Mẫu Thiết Kế Chính

### Pattern 1: Controlled Components

Tất cả form inputs (textarea, range, toggle) đều là **controlled components**:
```tsx
// Mỗi input có value từ state và onChange handler
<textarea
  value={value}              // Controlled: value từ parent state
  onChange={(e) => onChange(e.target.value)}  // Notify parent của changes
/>
```
**Lý do**: Predictable UI state, dễ test, dễ validate.

---

### Pattern 2: Lifting State Up

State được giữ ở component cha cao nhất cần dùng:
```
page.tsx           ← humanizedText, scores (cần cho multiple tabs)
  └── OutputPanel  ← chỉ nhận props, không có local state về text
```
**Lý do**: Tránh state sync bugs, single source of truth.

---

### Pattern 3: Compound Props / Object Props

Settings được truyền như một object thay vì nhiều props riêng lẻ:
```tsx
// Không phải:
<SettingsPanel
  writingStyle={settings.writingStyle}
  platform={settings.platform}
  emotionalDepth={settings.emotionalDepth}
  // ... 10 more props
/>

// Mà là:
<SettingsPanel settings={settings} onChange={setSettings} />
```
**Lý do**: Dễ thêm settings mới, ít thay đổi interface component.

---

### Pattern 4: Service Layer (Backend)

```javascript
// routes/humanize.js — CHỈ xử lý HTTP logic
router.post('/humanize', async (req, res) => {
  const { text, settings } = req.body;
  // Validate input
  const humanizedText = await humanizeText(text, settings);  // Delegate to service
  const scores = await scoreOutput(text, humanizedText);
  saveHistory(...);
  res.json({ humanizedText, scores });
});

// geminiService.js — Business logic AI
async function humanizeText(text, settings) {
  // Build prompt, call Gemini, parse response
}
```
**Lý do**: Dễ test (mock service), dễ swap AI provider, tách concerns rõ ràng.

---

### Pattern 5: Progressive Disclosure (UI)

Settings panel dùng **collapsible sections** để không overwhelm user:
```tsx
<CollapsibleSection title="Writing Style" defaultOpen={true}>
  {/* Chỉ hiển thị khi mở */}
</CollapsibleSection>
```
**Lý do**: Người dùng mới thấy ít options → less overwhelming. Power users có thể mở thêm.

---

## 6. Cách Thêm Tính Năng Mới

### Thêm Writing Style mới

1. Thêm vào type trong `frontend/src/types/index.ts`:
```typescript
export type WritingStyle = 'casual' | '...' | 'new_style';
```

2. Thêm vào array trong `SettingsPanel.tsx`:
```typescript
const writingStyles = [
  ...,
  { value: 'new_style', label: 'New Style', emoji: '🆕', desc: 'Description' }
];
```

3. Thêm description trong `geminiService.js`:
```javascript
const styleDescriptions = {
  ...,
  new_style: 'description of the new writing style for Gemini prompt'
};
```

### Thêm API Endpoint mới

1. Thêm route trong `backend/src/routes/humanize.js`
2. Thêm function trong `backend/src/services/geminiService.js` (nếu cần AI)
3. Thêm TypeScript type trong `frontend/src/types/index.ts`
4. Thêm API function trong `frontend/src/lib/api.ts`
5. Gọi từ component/page cần dùng

---

## 7. Debug Tips

### Debug Gemini Response

```javascript
// Trong geminiService.js, thêm log tạm thời:
const result = await model.generateContent(prompt);
const rawText = result.response.text();
console.log('=== GEMINI RAW RESPONSE ===');
console.log(rawText);
console.log('===========================');
```

### Debug State trong React

```tsx
// Thêm vào page.tsx để xem state:
useEffect(() => {
  console.log('State update:', { 
    humanizedText: humanizedText.slice(0, 50), 
    scores,
    activeView 
  });
}, [humanizedText, scores, activeView]);
```

### Kiểm tra Database

```bash
# Trên Windows với SQLite CLI:
sqlite3 backend/data/humanize.db

# Xem tables:
.tables

# Xem history:
SELECT * FROM session_history ORDER BY timestamp DESC LIMIT 5;

# Xem configs:
SELECT name, parameters_json FROM configs;
```
