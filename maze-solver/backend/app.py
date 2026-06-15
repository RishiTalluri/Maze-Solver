from flask import Flask, request, jsonify
from flask_cors import CORS
import heapq
import time
from collections import deque

app = Flask(__name__)
CORS(app)


def get_neighbors(grid, row, col, rows, cols):
    
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    neighbors = []
    for dr, dc in directions:
        nr, nc = row + dr, col + dc
        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != 1:
            neighbors.append((nr, nc))
    return neighbors


def manhattan_distance(pos, goals):
    """Minimum Manhattan distance to any goal."""
    return min(abs(pos[0] - g[0]) + abs(pos[1] - g[1]) for g in goals)


def bfs(grid, start, goals, rows, cols):
    
    t_start = time.time()
    queue = deque([(start, [start])])
    visited = {start}
    visited_order = []
    goal_set = set(map(tuple, goals))

    while queue:
        (r, c), path = queue.popleft()
        visited_order.append([r, c])

        if (r, c) in goal_set:
            return {
                "visited": visited_order,
                "path": [list(p) for p in path],
                "path_length": len(path) - 1,
                "nodes_explored": len(visited_order),
                "time_ms": round((time.time() - t_start) * 1000, 3)
            }

        for nr, nc in get_neighbors(grid, r, c, rows, cols):
            if (nr, nc) not in visited:
                visited.add((nr, nc))
                queue.append(((nr, nc), path + [(nr, nc)]))

    return {"visited": visited_order, "path": [], "path_length": -1,
            "nodes_explored": len(visited_order), "time_ms": round((time.time() - t_start) * 1000, 3)}


def dfs(grid, start, goals, rows, cols):
    
    t_start = time.time()
    stack = [(start, [start])]
    visited = set()
    visited_order = []
    goal_set = set(map(tuple, goals))

    while stack:
        (r, c), path = stack.pop()
        if (r, c) in visited:
            continue
        visited.add((r, c))
        visited_order.append([r, c])

        if (r, c) in goal_set:
            return {
                "visited": visited_order,
                "path": [list(p) for p in path],
                "path_length": len(path) - 1,
                "nodes_explored": len(visited_order),
                "time_ms": round((time.time() - t_start) * 1000, 3)
            }

        for nr, nc in get_neighbors(grid, r, c, rows, cols):
            if (nr, nc) not in visited:
                stack.append(((nr, nc), path + [(nr, nc)]))

    return {"visited": visited_order, "path": [], "path_length": -1,
            "nodes_explored": len(visited_order), "time_ms": round((time.time() - t_start) * 1000, 3)}


def astar(grid, start, goals, rows, cols):
    
    t_start = time.time()
    goal_set = set(map(tuple, goals))
    h = manhattan_distance(start, goals)
    open_heap = [(h, 0, start, [start])]
    g_costs = {start: 0}
    visited_order = []

    while open_heap:
        f, g, (r, c), path = heapq.heappop(open_heap)

        if (r, c) in goal_set:
            return {
                "visited": visited_order,
                "path": [list(p) for p in path],
                "path_length": len(path) - 1,
                "nodes_explored": len(visited_order),
                "time_ms": round((time.time() - t_start) * 1000, 3)
            }

        if g > g_costs.get((r, c), float('inf')):
            continue

        visited_order.append([r, c])

        for nr, nc in get_neighbors(grid, r, c, rows, cols):
            new_g = g + 1
            if new_g < g_costs.get((nr, nc), float('inf')):
                g_costs[(nr, nc)] = new_g
                h = manhattan_distance((nr, nc), goals)
                heapq.heappush(open_heap, (new_g + h, new_g, (nr, nc), path + [(nr, nc)]))

    return {"visited": visited_order, "path": [], "path_length": -1,
            "nodes_explored": len(visited_order), "time_ms": round((time.time() - t_start) * 1000, 3)}


def gbfs(grid, start, goals, rows, cols):
    
    t_start = time.time()
    goal_set = set(map(tuple, goals))
    h = manhattan_distance(start, goals)
    open_heap = [(h, start, [start])]
    visited = set()
    visited_order = []

    while open_heap:
        _, (r, c), path = heapq.heappop(open_heap)

        if (r, c) in visited:
            continue
        visited.add((r, c))
        visited_order.append([r, c])

        if (r, c) in goal_set:
            return {
                "visited": visited_order,
                "path": [list(p) for p in path],
                "path_length": len(path) - 1,
                "nodes_explored": len(visited_order),
                "time_ms": round((time.time() - t_start) * 1000, 3)
            }

        for nr, nc in get_neighbors(grid, r, c, rows, cols):
            if (nr, nc) not in visited:
                h = manhattan_distance((nr, nc), goals)
                heapq.heappush(open_heap, (h, (nr, nc), path + [(nr, nc)]))

    return {"visited": visited_order, "path": [], "path_length": -1,
            "nodes_explored": len(visited_order), "time_ms": round((time.time() - t_start) * 1000, 3)}


ALGORITHMS = {
    "bfs": bfs,
    "dfs": dfs,
    "astar": astar,
    "gbfs": gbfs
}


@app.route("/solve", methods=["POST"])
def solve():
    data = request.json
    grid = data["grid"]
    start = tuple(data["start"])
    goals = [tuple(g) for g in data["goals"]]
    algorithms = data["algorithms"]
    rows = len(grid)
    cols = len(grid[0]) if rows > 0 else 0

    if not goals:
        return jsonify({"error": "No goal nodes provided"}), 400
    if not start:
        return jsonify({"error": "No start node provided"}), 400

    results = {}
    for algo in algorithms:
        if algo in ALGORITHMS:
            results[algo] = ALGORITHMS[algo](grid, start, goals, rows, cols)

    return jsonify(results)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
