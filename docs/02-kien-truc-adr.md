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

**Trạng thái**: Accepted (Updated 2026-04-11)  
**Ngày**: 2026-04-04

### Bối cảnh
Cần lưu trữ: session history, preset configs, prompt logs, app settings. Lựa chọn database.

### Quyết định
Chọn **SQLite với `node:sqlite`** (Node.js built-in module, available since Node 22.5).

### Các lựa chọn đã xem xét

| Database | Phù hợp | Không phù hợp |
|----------|---------|---------------|
| PostgreSQL | Scale tốt, nhiều features | Over-engineering cho MVP, cần server riêng |
| MySQL | Quen thuộc | Tương tự PostgreSQL |
| MongoDB | Schema linh hoạt | Không cần NoSQL cho data có cấu trúc |
| **SQLite (node:sqlite)** | Zero-config, embedded, nhanh, no native build | Không scale cho multi-user production |

### Lý do
- Ứng dụng này là single-user hoặc low-concurrent tool
- SQLite không cần cài đặt thêm (zero-config deployment)
- `node:sqlite` (built-in) cung cấp API đồng bộ (`DatabaseSync`) → không cần native build tools
- Schema: 6 bảng (configs, session_history, agents, agent_posts, app_settings, prompt_logs)

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
| `imageService.js` | Two-Step Pipeline | Extract concept (Gemini) → Build prompt → Call Imagen |
| `videoService.js` | Single-Step Generation | Gemini tạo Veo3 prompt trực tiếp (no image API call) |
| `ImageGenerator.tsx` | Two-Phase UX | Generate Prompts → Generate Images (per slot) |
| `VideoGenerator.tsx` | Single-Phase UX | Generate Prompts → Copy & use in Veo3 |
| AgentManager | Overlay Disable Pattern | Frosted overlay khi Agent active → prevent settings conflict |
| `promptLogs.js` | CRUD API Pattern | Simple REST cho log entries (GET list, DELETE clear) |
| `PromptLogPanel.tsx` | Expandable List Pattern | Collapsible entries, filter, copy |
| Prompt Logging | Instrumentation Pattern | Services tự log prompt/response, routes log cho streaming |
| `settings.js` (available-models) | Live Fetch + Fallback | Fetch từ API, fallback về defaults |
| `videoService.js` | Two-Step Generation | Step 1: base character → Step 2: N prompts with character |

---

## ADR-007: Hai Giai Đoạn Tạo Ảnh (Prompt-First)

**Trạng thái**: Accepted  
**Ngày**: 2026-04-07

### Bối cảnh
Người dùng cần tạo nhiều ảnh khác nhau từ cùng một bài viết. Cách cũ: mỗi lần nhấn Generate → gọi Gemini để extract concept → build prompt → call Imagen. Tốn nhiều Gemini API calls, không cho phép review/edit trước khi tạo ảnh.

### Quyết định
**Tách thành 2 bước**:
1. **Generate Prompts** (1 lần): Gemini tạo N concept + caption + Imagen prompt trong một JSON response
2. **Generate Image** (per slot): Dùng pre-built prompt → chỉ gọi Imagen API

### Lợi ích
- Giảm Gemini API calls từ N xuống 1 khi tạo prompts
- Người dùng có thể edit từng prompt trước khi tạo ảnh
- Caption được generate cùng lúc, không cần thêm API call
- UX rõ ràng: Step 1 → Step 2

### Đánh đổi
- Thêm 1 bước trong flow → phức tạp hơn 1 click
- Nếu settings thay đổi sau khi generate prompts → phải regenerate

---

## ADR-008: Video = Prompt Only (Không Gọi Video API)

**Trạng thái**: Accepted  
**Ngày**: 2026-04-07

### Bối cảnh
Veo3 API chưa publicly available. Người dùng muốn tạo video từ nội dung humanized.

### Quyết định
Chỉ generate **Veo3-formatted prompt** theo công thức chính thức, không gọi video generation API. Người dùng copy prompt và dùng thủ công trong Google Veo3.

### Lợi ích
- Không phụ thuộc vào Veo3 API availability
- Vẫn cung cấp giá trị thực: prompts đúng chuẩn, khác cinematography per slot, kèm caption
- Dễ upgrade sau khi Veo3 API public

### Công thức Veo3 áp dụng
```
[Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]
```

---

## ADR-009: Agent Isolation — Pure Style Transfer

**Trạng thái**: Accepted  
**Ngày**: 2026-04-07

### Bối cảnh
Khi AI Agent được chọn, settings panel vẫn visible và settings vẫn được pass vào `generateWithAgentStream`. Điều này gây conflict: agent học phong cách từ bài mẫu, nhưng lại bị override bởi HumanizeSettings.

### Quyết định
1. Khi Agent active → không pass `settings` vào `generateWithAgentStream`
2. Khi Agent active → overlay frosted trên SettingsPanel, không cho tương tác
3. Agent generation chỉ dùng `agentId` + `inputText` → pure style transfer

### Lợi ích
- Style agent học được không bị contaminate bởi settings
- UX rõ ràng: user biết rõ mình đang dùng mode nào
- Dễ debug: agent output = chỉ phụ thuộc vào training posts

---

## ADR-010: Prompt Logging — Observability cho AI Calls

**Trạng thái**: Accepted  
**Ngày**: 2026-04-11

### Bối cảnh
Người dùng không thể thấy prompt thực tế gửi cho AI model. Khi output không như mong muốn, không có cách debug.

### Quyết định
Log tất cả AI prompts + responses vào bảng `prompt_logs` trong SQLite. Hiển thị trong tab "Prompt Log" trên frontend.

### Thiết kế
- **Backend instrumentation**: Mỗi service function (analyze, humanize, score, image, video, agent) tự log sau khi gọi AI
- **Streaming**: Log prompt lúc bắt đầu, response sau khi stream hoàn thành (accumulate full text)
- **Schema**: `feature`, `model`, `prompt` (full text), `response` (full text hoặc `[image binary data]`), `status`, `error_message`, `duration_ms`
- **Frontend**: Expandable entries với copy, filter by feature, refresh, clear

### Lý do
- Debug prompts mà không cần console.log thủ công
- Track model usage và performance (duration_ms)
- Giáo dục: user thấy prompt thực tế AI nhận được

### Đánh đổi
- Database size tăng nhanh (prompts + responses dài) → Clear button
- Prompt text có thể chứa user data nhạy cảm → Local SQLite only, không gửi ra ngoài

---

## ADR-011: Dynamic Model Fetching thay vì Hardcoded List

**Trạng thái**: Accepted  
**Ngày**: 2026-04-11

### Bối cảnh
Danh sách model Gemini và Imagen được hardcode. Khi Google thêm model mới, cần update code.

### Quyết định
Fetch danh sách model live từ Gemini API (`/v1beta/models`), phân loại tự động, fallback về danh sách mặc định.

### Lợi ích
- Model mới tự động xuất hiện
- Không cần deploy lại khi Google thêm model
- Prefix-based validation (`gemini-*`, `imagen-*`) thay vì whitelist

---

## ADR-012: Video Character Consistency

**Trạng thái**: Accepted  
**Ngày**: 2026-04-11

### Bối cảnh
Video prompts tạo ra mỗi clip với nhân vật khác nhau → không cohesive cho video series.

### Quyết định
Yêu cầu Gemini tạo **base character description** trước, sau đó embed character traits vào mỗi video prompt.

### Output format
```json
{
  "character": "Full character description...",
  "prompts": [{"veoPrompt": "...character traits repeated...", "caption": "...", "index": 0}]
}
```

### Lợi ích
- Tất cả video prompts có cùng nhân vật kể chuyện
- Character traits lặp lại trong mỗi prompt → Veo3 render nhất quán

