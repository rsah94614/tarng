# tarng 🌐

A modern full-stack social media platform.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui |
| State | Zustand + React Query |
| Backend | FastAPI + SQLAlchemy + Alembic |
| Auth | JWT (python-jose) + bcrypt |
| Database | PostgreSQL |
| Cache / Sessions | Redis |
| Real-time | FastAPI WebSockets + Redis Pub/Sub |
| Background Jobs | Arq + Redis |
| File Storage | MinIO (S3-compatible) |
| Error Tracking | Sentry |

---

## Prerequisites

- **Python** ≥ 3.10
- **Node.js** ≥ 20
- **Docker & Docker Compose** (for local services)
- **Git**

---

## Quick Start

### 1. Clone & env files

```bash
git clone <repo-url> tarng
cd tarng

# Backend env
cp backend/.env.example backend/.env

# Frontend env
cp frontend/.env.local.example frontend/.env.local
```

### 2. Start local services (Postgres, Redis, MinIO)

```bash
docker compose up -d postgres redis minio
```

### 3. Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start dev server
uvicorn app.main:app --reload --port 8000
```

Health check: http://localhost:8000/health

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

---

## Project Structure

```
tarng/
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers (versioned)
│   │   ├── core/         # Config, security, dependencies
│   │   ├── db/           # Database engine + session
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   ├── websocket/    # WebSocket connection manager
│   │   ├── workers/      # Arq background jobs
│   │   └── utils/        # Helpers
│   ├── alembic/
│   ├── tests/
│   └── Dockerfile
└── frontend/
    ├── app/              # Next.js App Router pages
    ├── components/       # Shared UI components
    ├── features/         # Feature-sliced modules
    ├── hooks/            # Custom React hooks
    ├── lib/              # Client singletons (axios, queryClient, ws)
    ├── services/         # API service functions
    ├── store/            # Zustand stores
    ├── types/            # TypeScript types
    └── utils/            # Utility functions
```

---

## Useful Commands

```bash
# Create a new migration
cd backend && alembic revision --autogenerate -m "describe change"

# Apply migrations
cd backend && alembic upgrade head

# Run backend tests
cd backend && pytest

# Run frontend type check
cd frontend && npx tsc --noEmit

# Run frontend lint
cd frontend && npm run lint
```
