# Expense & Task Manager - Backend

Backend API built with NestJS, TypeScript, and PostgreSQL.

## Tech Stack

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **TypeORM** - ORM
- **JWT** - Authentication
- **Passport** - Authentication strategies
- **bcrypt** - Password hashing
- **class-validator** - Validation

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run start:dev
```

The API will be available at [http://localhost:3001](http://localhost:3001)

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=expense_task_manager

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```

## Project Structure

```
backend/
├── src/
│   ├── auth/          # Authentication module
│   ├── users/         # Users module
│   ├── expenses/      # Expenses module
│   ├── tasks/         # Tasks module
│   ├── common/        # Shared utilities
│   └── main.ts        # Application entry point
├── test/              # E2E tests
└── dist/              # Compiled output
```

## Available Scripts

- `npm run start:dev` - Start development server with watch mode
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run unit tests
- `npm run test:e2e` - Run E2E tests

## API Endpoints

### Health Check
- `GET /health` - Health check endpoint

