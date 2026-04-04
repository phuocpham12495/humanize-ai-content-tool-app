# Hướng Dẫn Cài Đặt — Humanize AI Content Tool

> **Vai trò**: Kỹ Sư DevOps  
> **Phiên bản**: 1.0.0

---

## Yêu Cầu Tiên Quyết

### Phần mềm bắt buộc

| Phần mềm | Phiên bản tối thiểu | Kiểm tra |
|----------|--------------------|---------:|
| Node.js | v18.0.0+ | `node --version` |
| npm | v9.0.0+ | `npm --version` |
| Git | Bất kỳ | `git --version` |

### Tài khoản cần có
- **Google AI Studio account** để lấy Gemini API key
  - Đăng ký miễn phí tại: https://aistudio.google.com/

---

## Các Bước Cài Đặt

### Bước 1: Clone hoặc mở dự án

```bash
# Nếu clone từ GitHub
git clone <repository-url>
cd humanize-ai-content-tool-app

# Hoặc mở thư mục đã có sẵn
cd "d:/AI Agent Projects/humanize-ai-content-tool-app"
```

### Bước 2: Cài đặt Dependencies

**Cách 1 — Dùng script tiện ích (khuyến nghị)**:
```bash
npm run install:all
```

**Cách 2 — Cài thủ công từng phần**:
```bash
# Cài frontend dependencies
cd frontend
npm install

# Cài backend dependencies
cd ../backend
npm install
```

### Bước 3: Cấu hình Environment Variables

#### Backend (`backend/.env`)

```bash
# Sao chép file mẫu
cp backend/.env.example backend/.env
```

Sau đó chỉnh sửa `backend/.env`:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3001
```

**Lấy Gemini API Key**:
1. Truy cập https://aistudio.google.com/apikey
2. Nhấn "Create API Key"
3. Chọn hoặc tạo project Google Cloud
4. Copy key và dán vào `GEMINI_API_KEY`

#### Frontend (`frontend/.env.local`)

```bash
# Sao chép file mẫu
cp frontend/.env.local.example frontend/.env.local
```

Nội dung mặc định (không cần thay đổi cho local dev):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Khởi Động Máy Chủ Phát Triển

### Terminal 1 — Backend:

```bash
cd backend
npm run dev
```

**Output mong đợi**:
```
🚀 Humanize AI Backend running on http://localhost:3001
📊 Health check: http://localhost:3001/api/health
🔑 Gemini API: Configured ✓

Available routes:
  POST /api/humanize
  POST /api/analyze
  GET  /api/modes
  GET  /api/health
```

### Terminal 2 — Frontend:

```bash
cd frontend
npm run dev
```

**Output mong đợi**:
```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.1s
```

### Mở ứng dụng

Truy cập **http://localhost:3000** trong trình duyệt.

---

## Bảng Tham Chiếu Biến Môi Trường

### Backend (`backend/.env`)

| Biến | Bắt buộc | Mặc định | Mô tả |
|------|---------|---------|-------|
| `GEMINI_API_KEY` | ✅ Có | — | API key Google Gemini AI |
| `PORT` | Không | `3001` | Port cho Express server |
| `NODE_ENV` | Không | `development` | Môi trường chạy |

### Frontend (`frontend/.env.local`)

| Biến | Bắt buộc | Mặc định | Mô tả |
|------|---------|---------|-------|
| `NEXT_PUBLIC_API_URL` | Không | `http://localhost:3001` | URL của backend API |

> **Lưu ý**: Biến có prefix `NEXT_PUBLIC_` sẽ được expose ra client-side JavaScript. Không bao giờ đặt secrets vào biến này.

---

## Cấu Trúc Thư Mục Sau Cài Đặt

```
humanize-ai-content-tool-app/
├── package.json              # Root monorepo scripts
├── frontend/
│   ├── node_modules/         # Dependencies frontend
│   ├── .env.local            # Biến môi trường frontend (cần tạo)
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx      # Trang chính
│   │   ├── components/       # React components
│   │   ├── types/            # TypeScript interfaces
│   │   └── lib/              # API client
│   └── ...
└── backend/
    ├── node_modules/         # Dependencies backend
    ├── .env                  # Biến môi trường backend (cần tạo)
    ├── data/
    │   └── humanize.db       # SQLite database (tự tạo khi chạy)
    └── src/
        ├── index.js          # Entry point
        ├── db/
        ├── services/
        └── routes/
```

---

## Kiểm Tra Cài Đặt

### Kiểm tra backend hoạt động:
```bash
curl http://localhost:3001/api/health
```

**Response mong đợi**:
```json
{
  "status": "ok",
  "timestamp": "2026-04-04T...",
  "service": "humanize-ai-backend",
  "version": "1.0.0",
  "geminiConfigured": true
}
```

### Kiểm tra modes API:
```bash
curl http://localhost:3001/api/modes
```

---

## Xử Lý Lỗi Thường Gặp

### Lỗi: "Cannot find module 'better-sqlite3'"
```bash
# Windows có thể cần build tools
npm install --global windows-build-tools
# Hoặc cài Visual Studio Build Tools
cd backend && npm rebuild better-sqlite3
```

### Lỗi: "GEMINI_API_KEY environment variable is not set"
- Kiểm tra file `backend/.env` đã tồn tại chưa
- Kiểm tra GEMINI_API_KEY không có khoảng trắng thừa
- Restart backend server sau khi sửa .env

### Lỗi: CORS (frontend không gọi được backend)
- Đảm bảo backend đang chạy ở port 3001
- Kiểm tra `NEXT_PUBLIC_API_URL` trong `frontend/.env.local`
- Thử tắt VPN hoặc proxy

### Lỗi: Port 3000/3001 đã được dùng
```bash
# Tìm process đang dùng port
netstat -ano | findstr :3001  # Windows
lsof -i :3001                  # Mac/Linux

# Kill process
taskkill /PID <pid> /F         # Windows
kill -9 <pid>                  # Mac/Linux
```
