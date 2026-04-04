# Kiến Trúc ADR — Architecture Decision Records

> **Vai trò**: Kiểm Toán Kiến Trúc  
> **Ngày**: 2026-04-04  
> **Dự án**: Humanize AI Content Tool v1.0.0

---

## ADR-001: Kiến Trúc Monorepo với Tách Biệt Frontend/Backend

**Trạng thái**: Accepted  
**Ngày**: 2026-04-04

### Bối cảnh
Cần quyết định cách tổ chức code: Fullstack Next.js hay tách riêng Frontend/Backend.

### Quyết định
Chọn **monorepo với tách biệt rõ ràng** giữa frontend (Next.js) và backend (Express.js).

### Các lựa chọn đã xem xét

| Lựa chọn | Ưu điểm | Nhược điểm |
|----------|---------|------------|
| Next.js API Routes (fullstack) | Đơn giản, một codebase | Khó scale, không phù hợp AI workloads nặng |
| Tách hoàn toàn hai repo | Độc lập tuyệt đối | Phức tạp hơn khi phát triển |
| **Monorepo tách frontend/backend** | Cân bằng đơn giản/linh hoạt | Cần quản lý ports |

### Lý do
- Backend Express có thể chạy timeout dài cho AI calls (Gemini có thể mất 10-30s)
- Next.js API Routes có giới hạn timeout mặc định
- Dễ deploy backend lên server riêng biệt sau này
- Developer experience tốt với monorepo (một `git clone`, một project)

### Đánh đổi
- Cần quản lý CORS giữa `:3000` và `:3001`
- Cần chạy hai process khi phát triển

---

## ADR-002: Chọn SQLite thay vì PostgreSQL/MySQL

**Trạng thái**: Accepted  
**Ngày**: 2026-04-04

### Bối cảnh
Cần lưu trữ: session history, preset configs. Lựa chọn database.

### Quyết định
Chọn **SQLite với better-sqlite3**.

### Các lựa chọn đã xem xét

| Database | Phù hợp | Không phù hợp |
|----------|---------|---------------|
| PostgreSQL | Scale tốt, nhiều features | Over-engineering cho MVP, cần server riêng |
| MySQL | Quen thuộc | Tương tự PostgreSQL |
| MongoDB | Schema linh hoạt | Không cần NoSQL cho data có cấu trúc |
| **SQLite (better-sqlite3)** | Zero-config, embedded, nhanh | Không scale cho multi-user production |

### Lý do
- Ứng dụng này là single-user hoặc low-concurrent tool
- SQLite không cần cài đặt thêm (zero-config deployment)
- `better-sqlite3` cung cấp API đồng bộ → code đơn giản hơn
- Schema đơn giản: 2 bảng, không cần transactions phức tạp

### Đánh đổi
- Không scale tốt cho nhiều concurrent users
- Không có built-in replication/backup
- **Mitigation**: Dễ migrate sang PostgreSQL sau nếu cần (SQL tương thích)

---

## ADR-003: Sử dụng Gemini 2.5 Flash thay vì GPT-4 hoặc Claude

**Trạng thái**: Accepted  
**Ngày**: 2026-04-04

### Bối cảnh
Cần AI model để: phân tích text, humanize text, và score output.

### Quyết định
Chọn **Google Gemini 2.5 Flash** via `@google/generative-ai`.

### So sánh models

| Model | Tốc độ | Chi phí | Chất lượng | API |
|-------|--------|---------|------------|-----|
| GPT-4o | Chậm hơn | Đắt hơn | Tốt | OpenAI API |
| Claude 3.5 Sonnet | Tốt | Trung bình | Rất tốt | Anthropic API |
| **Gemini 2.5 Flash** | **Rất nhanh** | **Rẻ** | **Tốt** | Google AI |
| Gemini 1.5 Pro | Chậm hơn | Đắt hơn | Tốt hơn | Google AI |

### Lý do
- Tốc độ phản hồi tốt cho UX (user không chờ lâu)
- Chi phí thấp phù hợp development và demo
- Context window lớn (1M tokens) — không bị giới hạn với text dài
- SDK chính thức `@google/generative-ai` stable và được maintain tốt

### Đánh đổi
- Phụ thuộc vào Google Cloud (vendor lock-in)
- Có thể kém hơn GPT-4 trong một số task sáng tạo phức tạp
- **Mitigation**: Service layer (`geminiService.js`) có thể thay thế provider khác dễ dàng

---

## ADR-004: Next.js App Router thay vì Pages Router

**Trạng thái**: Accepted  
**Ngày**: 2026-04-04

### Bối cảnh
Next.js 14 hỗ trợ cả App Router (mới) và Pages Router (cũ).

### Quyết định
Chọn **App Router** (`src/app/`).

### Lý do
- App Router là hướng đi chính thức của Next.js (React Server Components)
- Layouts, loading, error boundaries đẹp hơn
- Metadata API đơn giản hơn
- Tương lai — Pages Router sẽ deprecated

### Đánh đổi
- Một số thư viện cũ chưa tương thích hoàn toàn
- Learning curve cao hơn nếu dev quen Pages Router
- **Solution**: Dùng `'use client'` directive cho tất cả components tương tác

---

## ADR-005: Quản lý State với React useState thay vì Zustand/Redux

**Trạng thái**: Accepted  
**Ngày**: 2026-04-04

### Bối cảnh
Cần quản lý state cho: inputText, humanizedText, settings, analysis, scores, loading states.

### Quyết định
Chọn **React useState + useCallback** thuần, không dùng external state library.

### Các lựa chọn

| Library | Khi nào phù hợp | Overhead |
|---------|----------------|----------|
| Redux Toolkit | App lớn, nhiều developers, complex state | Cao |
| Zustand | State chia sẻ nhiều components | Thấp |
| Jotai/Recoil | Atomic state | Trung bình |
| **useState** | Single-page, state đơn giản | Không có |

### Lý do
- Tất cả state nằm trong `page.tsx` và pass xuống qua props
- Không có shared state giữa các routes khác nhau
- Không cần persistence complex state
- Ít dependencies = ít bugs

### Đánh đổi
- Prop drilling nếu component tree sâu hơn
- **Mitigation**: Nếu app mở rộng, extract sang Zustand store dễ dàng

---

## ADR-006: Tailwind CSS thay vì CSS Modules hoặc styled-components

**Trạng thái**: Accepted  
**Ngày**: 2026-04-04

### Quyết định
Chọn **Tailwind CSS** cho toàn bộ styling.

### Lý do
- Utility-first → nhanh khi prototype và build UI
- Dark theme với `dark:` variants built-in
- Không cần switch context giữa TSX và CSS files
- Bundle size nhỏ với purge/JIT
- Nhất quán với ecosystem (shadcn/ui, Headless UI sử dụng Tailwind)

### Đánh đổi
- Class names dài trong JSX
- Học Tailwind class names lúc đầu
- **Mitigation**: Quen sau 1-2 ngày, IntelliSense plugin giúp autocomplete

---

## ADR-007: Design Pattern — Layered Humanization

**Trạng thái**: Accepted  
**Ngày**: 2026-04-04

### Bối cảnh
Cần chiến lược để "humanize" text hiệu quả — không chỉ paraphrase đơn giản.

### Quyết định
Thiết kế **5-layer transformation pipeline** trong Gemini prompt:

```
Layer 1: Vocabulary Swap (AI words → Human words)
Layer 2: Sentence Rhythm (Break uniformity)
Layer 3: Personality Injection (Voice + persona)
Layer 4: Platform Optimization (Tone + length)
Layer 5: Human Fingerprint (Quirks + signature phrases)
```

### Lý do
- Mỗi layer giải quyết một vấn đề riêng biệt của AI text
- Layered approach cho kết quả tốt hơn single large prompt
- Có thể disable/enable từng layer theo settings
- Dễ debug khi output không như mong muốn

---

## Mẫu Thiết Kế Sử Dụng

| Module | Pattern | Lý do |
|--------|---------|-------|
| `geminiService.js` | Service Layer | Tách business logic AI khỏi routes |
| `database.js` | Repository Pattern (đơn giản) | Tập trung database operations |
| `api.ts` | API Client Pattern | Centralize HTTP calls, error handling |
| Components | Controlled Components | Form state rõ ràng, predictable |
| Settings | Props drilling + Lifting State Up | State ở page.tsx, pass xuống |
