# PathFinder — Pathfinding Experimentation & Analytics Platform

A full-stack, production-quality pathfinding platform built with **React + TypeScript** (frontend) and **Flask + SQLite** (backend).

---

## ✨ Features

### Core
- 🧩 **Interactive Maze Editor** — click + drag to draw walls, place start/end nodes, paint terrain
- ⚡ **6 Algorithms** — BFS, DFS, A\*, Dijkstra, Greedy BFS, Bidirectional BFS
- 🎬 **Real-time Animation** — step-by-step visualization with adjustable speed
- 🏔 **Weighted Terrain** — grass, sand, mud, water, mountain with configurable costs
- 🎯 **Multiple Goals** — algorithms stop at the nearest reachable goal

### Platform
- 🔐 **JWT Authentication** — register, login, protected routes, token refresh
- 💾 **Save & Load Mazes** — CRUD with public/private visibility
- 🔗 **Share Links** — generate shareable links with optional expiry
- 🔬 **Experiment Mode** — run N algorithms on one maze, store + compare results
- 📊 **Analytics Dashboard** — charts for execution time, nodes explored, success rate
- 🌍 **Public Maze Browser** — search, filter by difficulty, duplicate community mazes
- ⬇ **CSV Export** — download experiment results

### Technical
- 🗃 **SQLite Database** — normalized schema with 6 tables, foreign keys, relationships
- 🐳 **Docker Support** — Dockerfile + docker-compose for both services
- ✅ **20 Backend Tests** — auth, maze CRUD, algorithm correctness
- 🔒 **Admin Panel** — system stats, user management (admin role)

---

## 🚀 Quick Start

### Option 1 — Manual setup (recommended for development)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # edit secrets if needed
python run.py                 # DB auto-creates, runs on :5000
```

**Frontend:**
```bash
cd frontend
npm install
npm start                     # runs on :3000
```

Open http://localhost:3000

### Option 2 — Docker

```bash
cp backend/.env.example backend/.env
docker-compose up --build
```

Open http://localhost:3000

---

## 🏗 Project Structure

```
pathfinding-platform/
├── backend/
│   ├── app/
│   │   ├── __init__.py          ← App factory
│   │   ├── config.py            ← Env-based config
│   │   ├── extensions.py        ← db, jwt, migrate
│   │   ├── models/              ← SQLAlchemy models
│   │   ├── auth/                ← Register, login, JWT
│   │   ├── mazes/               ← CRUD, sharing, favorites
│   │   ├── algorithms/          ← All 6 algorithms + runner
│   │   ├── experiments/         ← Multi-algo runs + CSV export
│   │   ├── analytics/           ← Dashboard + chart data
│   │   └── admin/               ← Admin-only endpoints
│   ├── tests/                   ← pytest suite (20 tests)
│   ├── run.py                   ← Entry point
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── pages/               ← Landing, Login, Editor, Dashboard, etc.
        ├── components/
        │   ├── editor/          ← MazeGrid, ControlsPanel, StatsPanel
        │   ├── shared/          ← Navbar (ProtectedRoute is defined inline here, not its own file), ColorsEditor
        │   └── ui/              ← Button, Input, Card, Modal, Badge
        ├── hooks/               ← useSolver (animation engine)
        ├── store/               ← Zustand: authStore, editorStore
        ├── api/                 ← Axios calls: auth, mazes, experiments, analytics
        ├── utils/               ← mazeGenerator (maze/terrain generation)
        └── types/               ← Full TypeScript types
```

---

## 🗃 Database Schema

```
users          → id, username, email, password_hash, role, created_at
mazes          → id, user_id (FK), name, rows, cols, grid_data (JSON), terrain_data, is_public
algorithm_runs → id, maze_id (FK), user_id (FK), experiment_id (FK), algorithm, path_length, nodes_explored, execution_time
experiments    → id, user_id (FK), maze_id (FK), name, algorithms (JSON array), status
shared_links   → id, maze_id (FK), token, expires_at, view_count
favorites      → user_id (FK) + maze_id (FK) [composite PK]
```

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | — | Create account |
| POST | /api/auth/login | — | Get JWT tokens |
| GET | /api/auth/me | ✓ | Current user |
| POST | /api/solve | opt | Run algorithms |
| GET | /api/algorithms | — | List algorithms |
| GET | /api/mazes | — | Public mazes |
| POST | /api/mazes | ✓ | Save maze |
| PUT | /api/mazes/:id | ✓ | Update maze |
| DELETE | /api/mazes/:id | ✓ | Delete maze |
| POST | /api/mazes/:id/duplicate | ✓ | Clone maze |
| POST | /api/mazes/:id/share | ✓ | Share link |
| POST | /api/experiments | ✓ | Run experiment |
| GET | /api/experiments | ✓ | My experiments |
| GET | /api/experiments/:id/export | ✓ | CSV export |
| GET | /api/analytics/dashboard | ✓ | Stats summary |
| GET | /api/analytics/algorithms | ✓ | Per-algo charts |
| GET | /api/analytics/global | — | Platform-wide stats, all users |

---

## 🧠 Algorithm Reference

| Algorithm | Optimal | Weighted | Notes |
|-----------|---------|----------|-------|
| BFS | ✅ | ❌ | Shortest path guaranteed |
| DFS | ❌ | ❌ | Fast, any valid path |
| A\* | ✅ | ✅ | Optimal + heuristic |
| Dijkstra | ✅ | ✅ | Optimal, no heuristic |
| Greedy BFS | ❌ | ❌ | Fast, heuristic-only |
| Bidirectional BFS | ✅ | ❌ | Searches from both ends |

---

## 🧪 Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

Expected: **20 passed**

---

## 🛠 Tech Stack

**Frontend:** React 18 · TypeScript · Tailwind CSS · Zustand · Recharts · Axios · React Router  
**Backend:** Flask · SQLAlchemy · Flask-JWT-Extended · Flask-Migrate · Werkzeug  
**Database:** SQLite (development) — swap to PostgreSQL by changing `DATABASE_URL` env var  
**DevOps:** Docker · docker-compose · Nginx (production SPA routing)
