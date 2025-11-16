# Hướng dẫn Setup và Chạy Project

## Yêu cầu hệ thống

- Node.js 18+ 
- PostgreSQL 14+
- npm hoặc yarn

## Bước 1: Setup Database

### 1.1. Tạo database PostgreSQL

```sql
CREATE DATABASE expense_task_manager;
```

### 1.2. Cấu hình biến môi trường Backend

Tạo file `backend/.env`:

```env
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/expense_task_manager?schema=public"

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_change_this_in_production_min_32_chars
JWT_REFRESH_EXPIRES_IN=7d
```

**Lưu ý**: Thay `username` và `password` bằng thông tin PostgreSQL của bạn.

### 1.3. Chạy Prisma Migration

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
```

Hoặc sử dụng script:

```bash
npm run prisma:generate
npm run prisma:migrate
```

## Bước 2: Setup Backend

### 2.1. Cài đặt dependencies

```bash
cd backend
npm install
```

### 2.2. Chạy backend

Development mode:
```bash
npm run start:dev
```

Backend sẽ chạy tại: http://localhost:3001

### 2.3. Kiểm tra backend

Truy cập: http://localhost:3001/health

Bạn sẽ thấy response:
```json
{
  "status": "ok",
  "message": "Expense & Task Manager API is running",
  "timestamp": "2024-..."
}
```

## Bước 3: Setup Frontend

### 3.1. Cấu hình biến môi trường Frontend

Tạo file `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3.2. Cài đặt dependencies

```bash
cd frontend
npm install
```

### 3.3. Chạy frontend

Development mode:
```bash
npm run dev
```

Frontend sẽ chạy tại: http://localhost:3000

## Bước 4: Sử dụng ứng dụng

### 4.1. Đăng ký tài khoản

1. Truy cập http://localhost:3000
2. Click "Đăng ký"
3. Điền thông tin:
   - Họ và tên
   - Email
   - Mật khẩu (tối thiểu 6 ký tự)
4. Sau khi đăng ký thành công, hệ thống sẽ tự động tạo 3 danh mục mặc định:
   - Ăn uống
   - Đi lại
   - Sinh hoạt

### 4.2. Đăng nhập

1. Truy cập http://localhost:3000/login
2. Nhập email và mật khẩu
3. Click "Đăng nhập"

### 4.3. Sử dụng các tính năng

- **Dashboard**: Xem tổng quan chi tiêu (hôm nay, tuần này, tháng này)
- **Quản lý chi tiêu**: Thêm, sửa, xóa các khoản chi tiêu
- **Quản lý danh mục**: Tạo và quản lý các danh mục chi tiêu
- **Thống kê**: Xem biểu đồ phân bổ chi tiêu theo danh mục và theo ngày

## Cấu trúc Database

Sau khi chạy migration, database sẽ có 3 bảng:

1. **users**: Thông tin người dùng
2. **categories**: Danh mục chi tiêu (mỗi user có danh mục riêng)
3. **expenses**: Chi tiêu (liên kết với user và category)

## API Endpoints

### Authentication
- `POST /auth/register` - Đăng ký
- `POST /auth/login` - Đăng nhập
- `POST /auth/refresh` - Làm mới token
- `POST /auth/forgot-password` - Quên mật khẩu

### Users
- `GET /users/me` - Lấy thông tin user hiện tại

### Categories
- `GET /categories` - Lấy danh sách danh mục
- `POST /categories` - Tạo danh mục mới
- `GET /categories/:id` - Lấy thông tin danh mục
- `PATCH /categories/:id` - Cập nhật danh mục
- `DELETE /categories/:id` - Xóa danh mục

### Expenses
- `GET /expenses` - Lấy danh sách chi tiêu (có thể filter theo startDate, endDate, categoryId)
- `POST /expenses` - Tạo chi tiêu mới
- `GET /expenses/:id` - Lấy thông tin chi tiêu
- `PATCH /expenses/:id` - Cập nhật chi tiêu
- `DELETE /expenses/:id` - Xóa chi tiêu
- `GET /expenses/analytics` - Lấy thống kê chi tiêu
- `GET /expenses/daily/:date` - Tổng chi tiêu theo ngày
- `GET /expenses/weekly/:startDate` - Tổng chi tiêu theo tuần
- `GET /expenses/monthly/:year/:month` - Tổng chi tiêu theo tháng

## Troubleshooting

### Lỗi kết nối database

- Kiểm tra PostgreSQL đã chạy chưa
- Kiểm tra thông tin trong `DATABASE_URL` trong file `.env`
- Kiểm tra database đã được tạo chưa

### Lỗi CORS

- Đảm bảo `FRONTEND_URL` trong backend `.env` đúng với URL frontend
- Kiểm tra frontend đang chạy đúng port

### Lỗi JWT

- Đảm bảo `JWT_SECRET` và `JWT_REFRESH_SECRET` đã được set trong `.env`
- Secret phải có ít nhất 32 ký tự

### Lỗi Prisma

- Chạy lại `npx prisma generate`
- Kiểm tra schema trong `backend/prisma/schema.prisma`
- Xóa và tạo lại migration nếu cần: `npx prisma migrate reset`

## Production Build

### Backend

```bash
cd backend
npm run build
npm run start:prod
```

### Frontend

```bash
cd frontend
npm run build
npm start
```

## Prisma Studio (Optional)

Để xem và quản lý database trực quan:

```bash
cd backend
npm run prisma:studio
```

Truy cập: http://localhost:5555

