# Kế Hoạch Triển Khai — Humanize AI Content Tool

> **Vai trò**: Quản Lý Dự Án  
> **Ngày**: 2026-04-04  
> **Phiên bản**: 1.0.0

---

## 1. Phân Tích Tính Năng Theo Mức Ưu Tiên

### P0 — Critical (Phải có để ứng dụng hoạt động)

| ID | Tính năng | Mô tả | Module |
|----|-----------|-------|--------|
| F-001 | Text Input | Nhập/paste văn bản cần xử lý | `TextInput.tsx` |
| F-002 | Humanize API | Gọi Gemini để chuyển đổi text | `geminiService.js` |
| F-003 | Output Display | Hiển thị kết quả đã humanize | `OutputPanel.tsx` |
| F-004 | Backend Server | Express server phục vụ requests | `index.js` |
| F-005 | Database | Lưu session history | `database.js` |
| F-006 | Error Handling | Xử lý lỗi gracefully | Toàn bộ app |

### P1 — High (Quan trọng cho trải nghiệm người dùng)

| ID | Tính năng | Mô tả | Module |
|----|-----------|-------|--------|
| F-007 | AI Analysis | Phân tích patterns AI trong text | `AnalysisPanel.tsx` |
| F-008 | Score Display | Hiển thị Human Score, AI Detectability | `ScoreDisplay.tsx` |
| F-009 | Settings Panel | Tùy chỉnh writing style, platform, etc. | `SettingsPanel.tsx` |
| F-010 | One-Click Modes | 4 preset modes (Human/Viral/etc.) | `SettingsPanel.tsx` |
| F-011 | Copy to Clipboard | Copy output nhanh | `OutputPanel.tsx` |
| F-012 | Health Check | Monitor backend status | `index.js` + `page.tsx` |

### P2 — Medium (Cải thiện UX đáng kể)

| ID | Tính năng | Mô tả | Module |
|----|-----------|-------|--------|
| F-013 | Comparison View | So sánh before/after | `ComparisonView.tsx` |
| F-014 | Human Fingerprint | Customization cá nhân | `SettingsPanel.tsx` |
| F-015 | Char Counter | Đếm ký tự với progress bar | `TextInput.tsx` |
| F-016 | Download Output | Tải file .txt | `OutputPanel.tsx` |
| F-017 | Session Persistence | Lưu session ID | `page.tsx` |
| F-018 | Skeleton Loading | Loading states animation | Multiple components |

### P3 — Nice to have (Tính năng tương lai)

| ID | Tính năng | Mô tả | Sprint |
|----|-----------|-------|--------|
| F-019 | History Browser | Xem lại lịch sử humanizations | Sprint 3 |
| F-020 | Export to DOCX/PDF | Export với formatting | Sprint 3 |
| F-021 | Multiple versions | Generate 3 versions, chọn tốt nhất | Sprint 4 |
| F-022 | API Key management UI | Cho phép user input API key | Sprint 4 |
| F-023 | Batch processing | Xử lý nhiều đoạn text cùng lúc | Sprint 5 |
| F-024 | Chrome Extension | Extension cho trình duyệt | Sprint 6 |
| F-025 | User accounts | Login, save preferences | Sprint 6 |

---

## 2. Phân Rã Nhiệm Vụ Theo Sprint

### Sprint 1 — Foundation (Tuần 1-2)
**Mục tiêu**: Ứng dụng chạy được end-to-end cơ bản

| Task | Priority | Estimate | Owner |
|------|----------|----------|-------|
| Thiết lập monorepo structure | P0 | 2h | Dev |
| Backend: Express + CORS setup | P0 | 3h | Dev |
| Backend: SQLite database setup | P0 | 4h | Dev |
| Backend: Gemini Service (analyzeText) | P0 | 6h | Dev |
| Backend: Gemini Service (humanizeText) | P0 | 8h | Dev |
| Backend: Routes /humanize, /analyze | P0 | 4h | Dev |
| Frontend: Next.js + Tailwind setup | P0 | 2h | Dev |
| Frontend: TypeScript interfaces | P0 | 2h | Dev |
| Frontend: API client | P0 | 3h | Dev |
| Frontend: TextInput component | P1 | 4h | Dev |
| Frontend: Basic OutputPanel | P0 | 3h | Dev |
| Frontend: Main page layout | P0 | 4h | Dev |

**Total**: ~45 giờ

---

### Sprint 2 — Features Complete (Tuần 3-4)
**Mục tiêu**: Tất cả P1 features hoàn thiện

| Task | Priority | Estimate | Owner |
|------|----------|----------|-------|
| Frontend: SettingsPanel đầy đủ | P1 | 8h | Dev |
| Frontend: AnalysisPanel | P1 | 6h | Dev |
| Frontend: ScoreDisplay (circle) | P1 | 4h | Dev |
| Frontend: ActionButtons | P1 | 2h | Dev |
| Frontend: ComparisonView | P2 | 5h | Dev |
| Frontend: Human Fingerprint | P2 | 3h | Dev |
| Backend: scoreOutput() | P1 | 4h | Dev |
| Backend: Seed 4 default modes | P1 | 2h | Dev |
| Error handling toàn diện | P0 | 4h | Dev |
| Testing: Unit tests backend | P1 | 6h | Dev |
| Documentation: API reference | P2 | 4h | Dev |

**Total**: ~48 giờ

---

### Sprint 3 — Polish & QA (Tuần 5-6)
**Mục tiêu**: Production-ready quality

| Task | Priority | Estimate | Owner |
|------|----------|----------|-------|
| E2E tests với Playwright | P1 | 8h | QA |
| Performance optimization | P2 | 4h | Dev |
| Dark theme polish | P2 | 4h | Dev |
| Mobile responsive | P2 | 6h | Dev |
| History browser (P3 early) | P3 | 8h | Dev |
| Docs hoàn thiện | P2 | 4h | Tech Writer |
| Security review | P1 | 4h | Dev |
| Deploy to Vercel + Railway | P2 | 6h | DevOps |

**Total**: ~44 giờ

---

## 3. Đồ Thị Phụ Thuộc Giữa Các Module

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│                                                         │
│  page.tsx                                               │
│     ├── TextInput.tsx                                   │
│     ├── SettingsPanel.tsx                               │
│     ├── ActionButtons.tsx                               │
│     ├── OutputPanel.tsx ──► ScoreDisplay.tsx            │
│     ├── AnalysisPanel.tsx                               │
│     └── ComparisonView.tsx                              │
│                    ↓                                    │
│              src/lib/api.ts                             │
│                    ↓                                    │
└────────────────────║────────────────────────────────────┘
                     ║ HTTP (localhost:3001)
┌────────────────────╨────────────────────────────────────┐
│                      BACKEND                            │
│                                                         │
│  src/index.js (Express)                                 │
│     └── src/routes/humanize.js                          │
│              ├── geminiService.js ──► @google/gen-ai    │
│              └── database.js ──► better-sqlite3         │
│                                         ↓               │
│                                  data/humanize.db       │
└─────────────────────────────────────────────────────────┘
```

### Dependencies Critical Path

```
Gemini API Key (env) 
    → geminiService.js 
        → routes/humanize.js 
            → index.js (server)
                → api.ts (frontend client)
                    → page.tsx (UI state)
                        → Components (rendering)
```

---

## 4. Đánh Giá Rủi Ro & Giảm Thiểu

### Rủi ro Kỹ thuật

| Rủi ro | Mức độ | Xác suất | Kế hoạch giảm thiểu |
|--------|--------|----------|---------------------|
| Gemini API rate limiting | Cao | Trung bình | Implement retry logic với exponential backoff; cache responses |
| Gemini trả về non-JSON | Trung bình | Cao | Robust JSON parsing với regex fallback (đã implement) |
| better-sqlite3 build lỗi trên Windows | Cao | Trung bình | Pre-built binaries; hướng dẫn windows-build-tools |
| Context window Gemini quá nhỏ | Thấp | Thấp | Gemini 2.5 Flash có 1M token context |
| Latency Gemini cao (>30s) | Trung bình | Trung bình | Loading states rõ ràng; timeout handling |

### Rủi ro Kinh Doanh

| Rủi ro | Mức độ | Kế hoạch giảm thiểu |
|--------|--------|---------------------|
| Google thay đổi Gemini pricing | Trung bình | Abstract AI service layer → dễ swap provider |
| Google thay đổi Gemini API | Cao | Theo dõi changelog; versioning trong SDK |
| Chất lượng humanization không đủ tốt | Cao | Liên tục cải thiện prompts; thu thập user feedback |
| GDPR/Privacy concerns về user text | Thấp | Không lưu text lên cloud; SQLite local only |

### Rủi ro Phụ Thuộc

| Dependency | Rủi ro | Mitigation |
|------------|--------|------------|
| `@google/generative-ai` | Breaking changes | Pin version; test trước khi upgrade |
| `better-sqlite3` | Platform compatibility | Document setup requirements |
| `next@14` | App Router instability | Stick to stable patterns, avoid experimental features |

---

## 5. Definition of Done (DoD)

Một feature được coi là hoàn thành khi:
- [ ] Code đã được implement và chạy đúng
- [ ] Unit tests viết và pass
- [ ] Error handling đầy đủ
- [ ] TypeScript types đầy đủ (không có `any`)
- [ ] UI states (loading, error, empty, success) đầy đủ
- [ ] Code review (nếu team)
- [ ] Documentation cập nhật

---

## 6. Metrics Thành Công

| Metric | Target | Đo lường |
|--------|--------|----------|
| Human Score trung bình sau humanize | > 75 | Gemini scoring |
| AI Detectability sau humanize | < 30% | Gemini scoring |
| Thời gian xử lý humanize | < 15 giây | Performance monitoring |
| Tỷ lệ lỗi API | < 5% | Error logging |
| User retention (dùng lại) | > 40% | Session tracking |

---

## 7. Tính Năng Đã Hoàn Thành (v4.0.0 — 2026-04-07)

| Tính năng | Ưu tiên | Trạng thái | Ghi chú |
|-----------|---------|-----------|---------|
| Tạo ảnh AI (Imagen 4 Fast) | P0 | ✅ Done | Two-phase: generate prompts → generate images |
| Logo watermark (Canvas API) | P1 | ✅ Done | Overlay góc dưới phải, 85% opacity |
| Caption cho ảnh | P1 | ✅ Done | Punchy quote, copyable |
| No-text rule cho ảnh | P0 | ✅ Done | Appended vào mọi Imagen prompt |
| Video Prompt Generator (Veo3) | P1 | ✅ Done | Công thức chuẩn Veo3, 12 slots |
| AI Agent CRUD | P0 | ✅ Done | Few-shot style transfer |
| Agent isolation (no settings bleed) | P1 | ✅ Done | Pure style transfer |
| SettingsPanel disable khi Agent active | P1 | ✅ Done | Frosted overlay |
| Copy button trong Agent preview | P2 | ✅ Done | Copy generated text |
| Max 12 ảnh/video | P2 | ✅ Done | Backend + frontend |
| Streaming SSE (humanize + agent) | P0 | ✅ Done | AbortController cancel |
| Diff view (ComparisonView) | P1 | ✅ Done | diff-match-patch word-level |

## 8. Backlog (Chưa Implement)

| Tính năng | Ưu tiên | Lý do chưa làm |
|-----------|---------|----------------|
| Veo3 API actual video generation | P1 | API chưa publicly available |
| Export/import agent settings | P2 | Nice-to-have |
| Batch humanize nhiều bài | P2 | Scope hiện tại: single post |
| Auth / multi-user | P3 | Local tool, không cần |
| Rate limiting | P2 | Chưa deploy production |
