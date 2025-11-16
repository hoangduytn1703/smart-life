# Expense & Task Manager

Ứng dụng quản lý chi tiêu cá nhân được xây dựng với Next.js 14 và NestJS 10.

## ✨ Tính năng Phase 1

### Authentication
- ✅ Đăng ký tài khoản
- ✅ Đăng nhập với JWT (Access + Refresh Token)
- ✅ Quên mật khẩu
- ✅ Tự động refresh token

### Quản lý Chi tiêu
- ✅ Thêm, sửa, xóa chi tiêu
- ✅ Lọc chi tiêu theo ngày, danh mục
- ✅ Thống kê chi tiêu theo ngày/tuần/tháng
- ✅ Biểu đồ phân bổ chi tiêu theo danh mục
- ✅ Biểu đồ chi tiêu 7 ngày gần nhất

### Quản lý Danh mục
- ✅ Thêm, sửa, xóa danh mục
- ✅ Mỗi user có danh mục riêng
- ✅ Tự động tạo 3 danh mục mặc định khi đăng ký

## 🏗️ Cấu trúc dự án

```
Big-projects/
├── frontend/          # Next.js 14 frontend application
├── backend/           # NestJS 10 backend API
├── DATABASE_SCHEMA.md # ERD và mô tả database
├── SETUP_GUIDE.md     # Hướng dẫn setup chi tiết
└── README.md          # This file
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** + **Shadcn/UI**
- **TanStack Query** (React Query)
- **React Hook Form** + **Zod**
- **Recharts** (Biểu đồ)
- **Axios**

### Backend
- **NestJS 10**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**
- **JWT Authentication** (Access + Refresh Token)
- **Passport**
- **bcrypt** (Hash password)
- **class-validator** (DTO Validation)

## 🚀 Quick Start

Xem hướng dẫn chi tiết trong [SETUP_GUIDE.md](./SETUP_GUIDE.md)

### Tóm tắt

1. **Setup Database**
   ```sql
   CREATE DATABASE expense_task_manager;
   ```

2. **Backend**
   ```bash
   cd backend
   npm install
   # Tạo file .env (xem SETUP_GUIDE.md)
   npx prisma generate
   npx prisma migrate dev
   npm run start:dev
   ```

3. **Frontend**
   ```bash
   cd frontend
   npm install
   # Tạo file .env.local với NEXT_PUBLIC_API_URL=http://localhost:3001
   npm run dev
   ```

4. **Truy cập**: http://localhost:3000

## 📚 Tài liệu

- [Database Schema](./DATABASE_SCHEMA.md) - ERD và mô tả database
- [Setup Guide](./SETUP_GUIDE.md) - Hướng dẫn setup chi tiết
- [Frontend README](./frontend/README.md) - Tài liệu frontend
- [Backend README](./backend/README.md) - Tài liệu backend

## 📝 API Documentation

Tất cả API endpoints đều yêu cầu JWT token (trừ `/auth/*`).

Xem chi tiết trong [SETUP_GUIDE.md](./SETUP_GUIDE.md#api-endpoints)

## 🔐 Bảo mật

- Password được hash bằng bcrypt
- JWT với Access Token (15 phút) và Refresh Token (7 ngày)
- Tự động refresh token khi hết hạn
- Protected routes với JWT Guard
- Input validation với class-validator và Zod

## 🎨 UI/UX

- Giao diện tiếng Việt, thân thiện người dùng
- Responsive design (mobile, tablet, desktop)
- Dark mode support (sẵn sàng)
- Biểu đồ trực quan với Recharts
- Toast notifications

## 📦 Database Schema

Xem chi tiết trong [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

### Các bảng chính:
- **users**: Thông tin người dùng
- **categories**: Danh mục chi tiêu (mỗi user có danh mục riêng)
- **expenses**: Chi tiêu (liên kết với user và category)

## 🚧 Roadmap

### Phase 1 (Hoàn thành) ✅
- [x] Authentication
- [x] Quản lý chi tiêu
- [x] Quản lý danh mục
- [x] Dashboard với thống kê

### Phase 2 (Tương lai)
- [ ] Quản lý công việc (Tasks)
- [ ] Quản lý mục tiêu cá nhân
- [ ] Export dữ liệu (Excel, PDF)
- [ ] Thông báo nhắc nhở
- [ ] Multi-currency support

## 📄 License

MIT

