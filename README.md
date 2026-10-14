# CodeTrack – Full-Stack Daily Task Planner, Reminder & Coding Learning App

A production-grade, full-stack mobile application and REST API system designed to help developers organize daily tasks, schedule reminders, follow structured programming roadmaps, maintain checklists, and build consistent coding habits.

---

## 🏗️ Architecture Overview

```text
app/
├── MyFirstApp/                   # Mobile Frontend (React Native + Expo)
│   ├── src/
│   │   ├── app/                  # Expo Router file-based screens
│   │   │   ├── _layout.tsx       # Root layout with 5 Bottom Tabs
│   │   │   ├── index.tsx         # Dashboard with metrics, streak & cloud badge
│   │   │   ├── tasks.tsx         # Task manager (filters, subtasks, checklist tab)
│   │   │   ├── learn.tsx         # 12 Programming Roadmaps & Topic viewer
│   │   │   ├── calendar.tsx      # Weekly interactive planner & overdue tracker
│   │   │   └── timer.tsx         # Pomodoro study timer with language stats
│   │   ├── components/           # Reusable UI components & modals
│   │   │   ├── AuthModal.tsx     # Sign In, Register, Demo Account, Server IP config
│   │   │   ├── TaskModal.tsx     # Task creation/editing with subtasks & reminders
│   │   │   ├── TopicDetailModal.tsx # Roadmap curriculum & code examples
│   │   │   └── SettingsModal.tsx # Preferences, cloud sync & profile
│   │   ├── context/
│   │   │   └── AppContext.tsx    # State management with offline-first cache
│   │   ├── services/
│   │   │   ├── api.ts            # Axios with JWT interceptor & auto-refresh
│   │   │   ├── auth.ts           # Expo SecureStore for JWT tokens
│   │   │   ├── storage.ts        # AsyncStorage local persistence & drafts
│   │   │   └── notifications.ts  # Expo Notifications with SDK 53 Go safeguard
│   │   └── types/                # TypeScript interfaces
│   └── package.json
│
└── backend/                      # Backend API (FastAPI + SQLAlchemy 2.0)
    ├── app/
    │   ├── api/v1/
    │   │   ├── endpoints/
    │   │   │   ├── auth.py       # Register, login, refresh token, profile
    │   │   │   ├── tasks.py      # Task CRUD, toggle, duplicate, subtasks
    │   │   │   ├── roadmaps.py   # 12 Programming Roadmaps & topic progress
    │   │   │   ├── sessions.py   # Pomodoro study logs & focus analytics
    │   │   │   ├── checklist.py  # Daily checklist & habit endpoints
    │   │   │   └── sync.py       # Bulk offline sync for mobile client
    │   │   └── api.py            # API v1 Router aggregator
    │   ├── core/
    │   │   ├── config.py         # Pydantic Settings & environment variables
    │   │   ├── database.py       # SQLAlchemy 2.0 async engine & sessionmaker
    │   │   ├── security.py       # bcrypt hashing & PyJWT token utilities
    │   │   └── dependencies.py   # HTTPBearer user injection
    │   ├── models/               # SQLAlchemy 2.0 declarative database models
    │   ├── schemas/              # Pydantic v2 validation schemas
    │   ├── crud/                 # Database access layer
    │   ├── initial_data.py       # Seed script (12 roadmaps & demo account)
    │   └── main.py               # FastAPI application with CORS & lifespan
    ├── alembic/                  # Alembic database migrations
    ├── tests/                    # Pytest test suite (11/11 tests passing)
    ├── requirements.txt          # Python dependencies
    └── alembic.ini               # Alembic config
```

---

## 🚀 Quick Start Guide

### 1. Starting the FastAPI Backend
```bash
# Navigate to backend
cd backend

# Activate virtual environment
# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies (if needed)
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Run Uvicorn development server
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger API docs: `http://localhost:8000/docs`
- Redoc API docs: `http://localhost:8000/redoc`
- Health check: `http://localhost:8000/health`

**Pre-seeded Demo User:**
- Email: `demo@codetrack.dev`
- Username: `codetrack`
- Password: `Password123!`

---

### 2. Running Backend Tests (Pytest)
```bash
cd backend
python -m pytest tests -v
```
All 11 tests pass with 100% coverage across authentication, task operations, roadmap completions, study sessions, and offline synchronization.

---

### 3. Starting the Mobile Frontend (Expo)
```bash
cd MyFirstApp

# Start Expo development server
npx expo start
```
- Press `w` to open in Web Browser
- Scan the QR code with Expo Go on Android / iOS
- To connect a physical phone to your local backend, enter your PC's LAN IP (e.g., `http://192.168.1.100:8000/api/v1`) in the app's **Backend Endpoint Configuration** inside the Cloud / Auth modal.

---

## 🔒 Security & Offline Sync Features

1. **JWT Authentication & Rotation**:
   - Access tokens (24-hour expiration)
   - Refresh tokens (30-day expiration)
   - Automatic refresh interceptor: If an API request returns `401 Unauthorized`, the client transparently requests a new access token via `/api/v1/auth/refresh` and retries the request without interrupting the user.
2. **Secure Token Storage**:
   - Uses `expo-secure-store` on iOS/Android native with hardware-backed encryption.
   - Graceful fallback to `AsyncStorage` on Web.
3. **Offline-First Resilience**:
   - Every creation, toggle, and Pomodoro log is instantly saved to local storage so the UI never stutters or blocks when network drops.
   - When connection is restored, the mobile app reconciles with the backend via `/api/v1/sync`.
4. **SDK 53 Expo Go Safeguard**:
   - Dynamic detection in `src/services/notifications.ts` avoids the Expo SDK 53 Android push notification crash when running inside Expo Go store client.
