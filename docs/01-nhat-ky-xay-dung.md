# Nhật Ký Xây Dựng — Humanize AI Content Tool

> **Vai trò**: Người Quan Sát Xây Dựng  
> **Ngày**: 2026-04-04  
> **Phiên bản**: 1.0.0

---

## Tổng Quan Dự Án

**Mục tiêu**: Xây dựng công cụ chuyển đổi văn bản do AI tạo ra thành nội dung nghe có vẻ tự nhiên, mang dấu ấn con người thật sự — sử dụng Gemini 2.5 Flash làm engine AI.

**Kiến trúc**: Monorepo với hai phần độc lập:
- `frontend/` — Ứng dụng Next.js 14 (App Router)
- `backend/` — API Node.js Express

---

## Cập Nhật Phiên Bản 1.2.0 — 2026-04-04 (Audit Vòng 2)

### Lỗi và Thiếu Sót Được Khắc Phục

#### TC008 — ComparisonView Diff Chính Xác
- **Vấn đề**: ComparisonView cũ dùng so sánh "từ duy nhất" (unique word) — không đúng spec
- **Khắc phục**: Viết lại hoàn toàn dùng `diff-match-patch` thật sự:
  - Từ bị xóa → gạch ngang đỏ + nền đỏ trong cột "Original"
  - Từ được thêm → nền xanh lá trong cột "Humanized"
  - Thống kê: số từ thêm/xóa hiển thị rõ ràng
  - Thông báo "No significant changes" khi không có thay đổi

#### Streaming Display Bug (TC015)
- **Vấn đề**: `OutputPanel` hiện skeleton loading ngay cả khi đã có text từ stream
- **Khắc phục**: 
  - Nếu `isLoading=true` VÀ đã có text → hiện text streaming với con trỏ nhấp nháy
  - Con trỏ tím nhấp nháy ở cuối text khi đang stream
  - Nút Copy/Download bị disable khi đang stream
  - Skeleton chỉ hiện khi chưa có text nào

#### Session History API
- **Vấn đề**: `getHistory()` tồn tại trong DB nhưng không có route API
- **Khắc phục**: Thêm `GET /api/history/:sessionId` → trả về mảng lịch sử session
- Frontend: Thêm `getHistory()` vào `api.ts`

#### Backend Route Log
- Cập nhật log khởi động hiển thị đầy đủ 6 routes bao gồm `/api/humanize/stream` và `/api/history/:sessionId`

---

## Cập Nhật Phiên Bản 1.1.0 — 2026-04-04

### Tính Năng Bổ Sung (Từ Audit Đầy Đủ)

#### TC010 — Human Noise Injection
- Thêm toggle `humanNoise` vào Settings (tách biệt với `imperfections`)
- Backend: Prompt Gemini chèn các cụm từ do dự ("kind of", "maybe", "I guess") và tự sửa ("actually... wait", "let me rephrase")
- Lý do: Test case TC010 yêu cầu tính năng này như một tính năng độc lập

#### TC004_04 — Personality Slider
- Thêm thanh trượt `personalitySlider` (0-100) để kiểm soát mức độ câu chuyện cá nhân
- Giá trị cao → nhiều anecdote cá nhân ("I tried this last week...")
- Giá trị thấp → giọng văn khách quan

#### TC006_04 — Sentence Rhythm (Human Fingerprint)
- Thêm trường `sentenceRhythm` vào Human Fingerprint: `mixed`, `long`, `short`
- Backend: Hướng dẫn Gemini về nhịp điệu câu văn mong muốn

#### TC014 — Inline Sentence Highlighting với Tooltip
- `AnalysisPanel` giờ hiển thị văn bản đầu vào với các câu đáng ngờ gạch chân đỏ
- Hover vào câu → tooltip hiện lý do + gợi ý thay thế (mỗi câu đáng ngờ có `suggestion`)
- Backend: Phân tích giờ trả về trường `suggestion` cho mỗi câu đáng ngờ

#### TC013_05 — One-Click Mode Kích Hoạt Ngay
- Nhấn một chế độ One-Click → tự động gọi API humanize ngay lập tức (không cần nhấn nút "Humanize" riêng)
- Props `onOneClickHumanize` được truyền từ `page.tsx` → `SettingsPanel`

#### TC015 — Streaming / Live Rewrite
- Backend: Endpoint mới `POST /api/humanize/stream` sử dụng Server-Sent Events (SSE)
- Frontend: `humanizeTextStream()` trong `api.ts` dùng Fetch API + ReadableStream
- Văn bản output cập nhật theo thời gian thực từng chunk
- Fallback tự động về API thông thường nếu SSE lỗi

---

## Nhật Ký Xây Dựng Theo Thời Gian

### [2026-04-04 08:00] — Khởi tạo cấu trúc thư mục

**Hành động**: Tạo cây thư mục monorepo:
```
humanize-ai-content-tool-app/
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── types/
│       └── lib/
├── backend/
│   └── src/
│       ├── db/
│       ├── services/
│       └── routes/
└── docs/
```

**Lý do quyết định**: 
- Tách frontend/backend để dễ deploy độc lập
- Cấu trúc phẳng, không lồng nhau quá sâu để dễ bảo trì
- Thư mục `docs/` tách riêng để tài liệu không lẫn với code

---

### [2026-04-04 08:15] — Tạo Root package.json (Monorepo)

**Hành động**: Tạo `package.json` gốc với các scripts tiện ích:
- `dev:frontend` — Khởi động Next.js dev server
- `dev:backend` — Khởi động Express với nodemon
- `install:all` — Cài dependencies cho cả hai phần

**Lý do quyết định**: Monorepo đơn giản không dùng Turborepo hay Nx vì quy mô dự án nhỏ — scripts npm đơn giản là đủ.

---

### [2026-04-04 08:20] — Backend: Cấu hình package.json

**Hành động**: Chọn các dependencies:
- `express@^4.18.2` — Framework web ổn định, được dùng rộng rãi
- `cors@^2.8.5` — Xử lý Cross-Origin Resource Sharing
- `better-sqlite3@^9.4.3` — SQLite đồng bộ, hiệu năng cao
- `@google/generative-ai@^0.21.0` — SDK chính thức Gemini
- `dotenv@^16.4.1` — Quản lý biến môi trường
- `nodemon@^3.0.3` (dev) — Hot reload khi phát triển

**Lý do chọn better-sqlite3 thay vì sqlite3**:
- API đồng bộ → code đơn giản hơn, không cần async/await cho DB ops
- Hiệu năng tốt hơn (native bindings, không callback hell)
- Type-safe hơn trong môi trường Node.js

---

### [2026-04-04 08:35] — Backend: Thiết kế Database Schema

**Hành động**: Tạo hai bảng SQLite:

```sql
configs (id, name, parameters_json, created_at)
session_history (id, session_id, original_text, humanized_text, 
                 settings_json, scores_json, timestamp)
```

**Lý do quyết định — Lưu JSON dạng text**:
- SQLite không có kiểu JSON native (khác PostgreSQL)
- Dùng TEXT + JSON.stringify/parse đơn giản và linh hoạt
- Tránh over-engineering schema cho dự án MVP

**Seed data**: Tạo 4 config mặc định:
1. "Make it Human" — Focus on authenticity
2. "Make it Viral" — Optimize for shares
3. "Make it Controversial" — Spark debate
4. "Make it Relatable" — Personal connection

---

### [2026-04-04 09:00] — Backend: Gemini Service

**Hành động**: Xây dựng `geminiService.js` với 3 functions chính:

**`analyzeText(text)`**:
- Prompt yêu cầu Gemini phân tích 4 metrics: AI Likeness Score, Burstiness, Perplexity, Sentence Variance
- Trả về JSON có cấu trúc chặt chẽ
- Parse JSON response, xử lý cả trường hợp Gemini wrap trong markdown code blocks

**`humanizeText(text, settings)`**:
- Prompt 5 layers: Vocabulary → Sentence Rhythm → Personality → Platform Fit → Human Fingerprint
- 8+ biến điều chỉnh: writingStyle, platform, emotionalDepth, imperfections, antiAIDetector, persona, culturalTone, oneClickMode
- Chế độ Anti-AI Detector: Tránh patterns điển hình của AI (parallel structures, formal transitions, etc.)

**`scoreOutput(originalText, humanizedText)`**:
- So sánh 2 văn bản, trả về humanScore, aiDetectability, engagementPotential
- Kèm gợi ý cải thiện (improvements) và điểm mạnh (strengths)

**Lý do thiết kế prompt**:
- Yêu cầu JSON output rõ ràng → dễ parse, ít lỗi format
- Có fallback xử lý khi Gemini thêm markdown code blocks
- Mỗi layer trong humanization có mục tiêu cụ thể → output tốt hơn

---

### [2026-04-04 09:30] — Backend: Routes & Server

**Hành động**: Tạo Express server với:
- CORS chỉ cho `localhost:3000`
- JSON body parser với giới hạn 1MB
- Request logging middleware
- Error handlers (404, 500)
- Health check endpoint với status Gemini API

---

### [2026-04-04 10:00] — Frontend: Cấu hình Next.js 14

**Hành động**: Thiết lập Next.js với:
- TypeScript strict mode
- Tailwind CSS với custom colors (brand-purple, brand-violet)
- App Router (không dùng Pages Router)
- Path alias `@/*` → `src/*`

**Lý do chọn App Router**: 
- Next.js 14 khuyến khích App Router
- Server Components và Client Components rõ ràng hơn
- Tương lai của Next.js

---

### [2026-04-04 10:15] — Frontend: TypeScript Interfaces

**Hành động**: Định nghĩa toàn bộ types trong `src/types/index.ts`:
- `HumanizeSettings` — Toàn bộ settings cho humanization
- `AnalysisResult` — Kết quả phân tích AI
- `OutputScores` — Điểm số output
- `HumanFingerprint` — Customization fingerprint
- `defaultSettings` — Giá trị mặc định

**Lý do quyết định**: Centralize tất cả types → dễ maintain, tránh duplication giữa components.

---

### [2026-04-04 10:30] — Frontend: API Client

**Hành động**: Tạo `src/lib/api.ts` với:
- `ApiError` class extends `Error` → error handling nhất quán
- `handleResponse<T>()` — Generic helper parse response
- Functions: `humanizeText`, `analyzeText`, `getModes`, `checkHealth`

---

### [2026-04-04 11:00] — Frontend: Components

**Thứ tự tạo components**:

1. **TextInput** — Textarea với progress bar đếm ký tự, nút Paste/Clear
2. **SettingsPanel** — 8 sections collapsible với tất cả settings
3. **ScoreDisplay** — Circle progress chart + badges
4. **OutputPanel** — Text output với copy/download, skeleton loading
5. **AnalysisPanel** — AI score bar, metric bars, suspicious sentences
6. **ComparisonView** — Side-by-side diff highlighting
7. **ActionButtons** — 3 action buttons với states

---

### [2026-04-04 12:00] — Frontend: Main Page

**Hành động**: Tạo `page.tsx` với layout 3 cột:
- Cột 1 (sidebar): SettingsPanel
- Cột 2: TextInput
- Cột 3: Output/Analysis/Comparison tabs

**State management**: Dùng React `useState` + `useCallback` đơn giản — không cần Redux/Zustand vì state không quá phức tạp.

---

### [2026-04-04 13:00] — Documentation

**Hành động**: Tạo 7 files tài liệu trong `docs/` viết bằng tiếng Việt theo các vai trò khác nhau.

---

## Các Vấn Đề Gặp Phải & Giải Pháp

| Vấn đề | Giải pháp |
|--------|-----------|
| Gemini đôi khi wrap JSON trong markdown | Thêm regex strip ```` ```json ``` ```` trước khi parse |
| SQLite không tương thích Windows path | Dùng `path.join(__dirname, ...)` thay vì hardcode |
| CORS issue giữa :3000 và :3001 | Cấu hình explicit allowedHeaders |
| Range input styling không đồng nhất cross-browser | Custom CSS với `accent-color` và webkit-slider-thumb |

---

## Kết Quả Build

- Tổng số files tạo: ~25 files code + 7 files docs
- Backend: 5 files JS + 1 env.example
- Frontend: 15 files TypeScript/TSX + config files
- Docs: 7 files Markdown
