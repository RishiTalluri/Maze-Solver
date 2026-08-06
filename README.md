# PathFinder - Pathfinding Experimentation & Analytics Platform

A full-stack, production-quality pathfinding platform built with **React + TypeScript** (frontend) and **Flask + SQLite** (backend).

> The app itself lives in [`pathfinding-platform/`](./pathfinding-platform). This top-level README covers how to get it running from the repo root; see [`pathfinding-platform/README.md`](./pathfinding-platform/README.md) for the full project structure and database schema.

---

## ✨ Features

### Core
- 🧩 **Interactive Maze Editor** - click + drag to draw walls, place start/end nodes, paint terrain
- ⚡ **6 Algorithms** - BFS, DFS, A\*, Dijkstra, Greedy BFS, Bidirectional BFS
- 🎬 **Real-time Animation** - step-by-step visualization with adjustable speed
- 🏔 **Weighted Terrain** - grass, sand, mud, water, mountain with configurable costs
- 🎨 **Fully Customizable Colors** - terrain, walls, and each algorithm's path/explored colors
- 🎯 **Multiple Goals** - algorithms stop at the nearest reachable goal

### Platform
- 🔐 **JWT Authentication** - register, login, protected routes, token refresh
- 💾 **Save & Load Mazes** - CRUD with public/private visibility
- 🔗 **Share Links** - generate shareable links with optional expiry
- 🔬 **Experiment Mode** - run N algorithms on one maze, store + compare results
- 📊 **Analytics Dashboard** - charts for execution time, nodes explored, success rate
- 🌐 **Global Stats** - per-algorithm performance aggregated across every user of the platform
- 🌍 **Public Maze Browser** - search, filter by difficulty, duplicate community mazes
- ⬇ **CSV Export** - download experiment results

### Technical
- 🗃 **SQLite Database** - normalized schema with 6 tables, foreign keys, relationships
- 🐳 **Docker Support** - Dockerfile + docker-compose for both services
- ✅ **20 Backend Tests** - auth, maze CRUD, algorithm correctness
- 🔒 **Admin Panel** - system stats, user management (admin role)

---

## 🚀 Quick Start

This README's commands assume you're at the **repo root** — note the `pathfinding-platform/` prefix on every path below, since that's where the actual app lives. (If you `cd pathfinding-platform` first, drop that prefix and follow `pathfinding-platform/README.md` instead.)

### Option 1 - Manual setup (recommended for development)

**Backend:**
```bash
cd pathfinding-platform/backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # edit secrets if needed
python run.py                 # DB auto-creates, runs on :5000
```

**Frontend:**
```bash
cd pathfinding-platform/frontend
npm install
npm start                     # runs on :3000
```

Open http://localhost:3000

### Option 2 - Docker

```bash
cp pathfinding-platform/backend/.env.example pathfinding-platform/backend/.env
docker-compose up --build
```

Open http://localhost:3000

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

## 🏗 Project Structure & 🛠 Tech Stack

See [`pathfinding-platform/README.md`](./pathfinding-platform/README.md) for the full folder-by-folder breakdown and the tech stack — kept there rather than duplicated here so it can't drift out of sync with the code.
