# 🧩 Maze Solver — Pathfinding Visualizer

A full-stack, production-quality pathfinding visualizer built with **React** (frontend) and **Flask** (backend). Interactively create mazes, place start/end nodes, and watch multiple algorithms compete to find the path.

---

## ✨ Features

- **4 Algorithms**: BFS, DFS, A*, Greedy Best-First Search
- **Multi-algorithm comparison** — run 2+ algorithms simultaneously with side-by-side panels
- **Interactive grid** — click & drag to draw walls, place start/end nodes
- **Multiple goal nodes** — algorithms stop at the nearest reachable goal
- **Step-by-step animation** — watch exploration and path tracing with adjustable speed
- **Stats panel** — path length, nodes explored, execution time per algorithm
- **Dark theme** — clean, modern UI with algorithm-specific color coding
- **Scalable grid** — up to 60×80 cells

---

## 🏗️ Project Structure

```
maze-solver/
├── frontend/          # React app
│   ├── public/
│   └── src/
│       ├── App.js
│       ├── components/
│       │   ├── MazeGrid.js        # Main interactive grid
│       │   ├── ComparisonGrid.js  # Per-algorithm mini-grids
│       │   ├── ControlsPanel.js   # Top controls bar
│       │   └── StatsPanel.js      # Legend + results
│       └── hooks/
│           ├── useGrid.js         # Grid state management
│           └── useSolver.js       # Algorithm runner + animation
├── backend/           # Flask API
│   ├── app.py
│   └── requirements.txt
├── .gitignore
└── README.md
```

---

## 🚀 Setup

### Backend (Flask)

```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The API will run at `http://localhost:5000`.

### Frontend (React)

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`.

---

## 🎮 How to Use

1. **Set grid size** — adjust Rows and Cols in the top controls
2. **Select a draw mode** — Start, End, Wall, or Erase
3. **Draw your maze** — click or click+drag on the grid
4. **Choose algorithm(s)** — click one or multiple (BFS, DFS, A*, GBFS)
5. **Adjust speed** — use the slider (higher = faster)
6. **Click Solve** — watch the algorithms animate
7. **Compare** — select 2+ algorithms to see side-by-side comparison panels

---

## 🎨 Color Legend

| Color | Meaning |
|-------|---------|
| 🟢 Green | Start node |
| 🔴 Red | End node(s) |
| ⚫ Dark | Wall / obstacle |
| Tinted cells | Visited/explored nodes |
| Bright cells | Final path |

**Algorithm colors:**
- **BFS** → Cyan `#00d4ff`
- **DFS** → Purple `#a855f7`
- **A*** → Green `#22c55e`
- **GBFS** → Orange `#f97316`

---

## 📡 API

### `POST /solve`

**Request:**
```json
{
  "grid": [[0,1,0],[0,0,0],[0,1,0]],
  "start": [0, 0],
  "goals": [[2, 2]],
  "algorithms": ["bfs", "astar"]
}
```

**Response:**
```json
{
  "bfs": {
    "visited": [[0,0],[1,0],...],
    "path": [[0,0],[1,0],[2,0],[2,1],[2,2]],
    "path_length": 4,
    "nodes_explored": 7,
    "time_ms": 0.12
  },
  "astar": { ... }
}
```

Cell values: `0` = empty, `1` = wall, `2` = start, `3` = end

---

## 📦 Tech Stack

- **Frontend**: React 18, no external UI libraries
- **Backend**: Flask, Flask-CORS
- **Algorithms**: Pure Python (BFS, DFS, A*, GBFS)

---

## 🧠 Algorithm Notes

| Algorithm | Optimal? | Complete? | Heuristic? |
|-----------|----------|-----------|------------|
| BFS | ✅ Yes | ✅ Yes | ❌ No |
| DFS | ❌ No | ✅ Yes | ❌ No |
| A* | ✅ Yes | ✅ Yes | ✅ Manhattan |
| GBFS | ❌ No | ✅ Yes* | ✅ Manhattan |

*GBFS may fail in some graphs but works well in open mazes.
