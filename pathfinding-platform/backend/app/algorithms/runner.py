import heapq
import time
from collections import deque

CELL_WALL = 1

# Default terrain costs — overridden by client-sent terrain_costs map
DEFAULT_TERRAIN_COSTS: dict = {
    'empty': 1, 'grass': 1, 'sand': 3, 'mud': 5,
    'water': 8, 'mountain': 15,
}


def get_terrain_cost(terrain_data, r, c, cost_map: dict) -> float:
    if not terrain_data:
        return 1
    try:
        t = terrain_data[r][c]
        return cost_map.get(t, 1)
    except (IndexError, TypeError):
        return 1


def get_neighbors(grid, r, c, rows, cols):
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != CELL_WALL:
            yield (nr, nc)


def manhattan(pos, goals):
    return min(abs(pos[0] - g[0]) + abs(pos[1] - g[1]) for g in goals)


# ── BFS ───────────────────────────────────────────────────────────────────────
def bfs(grid, start, goals, rows, cols, terrain_data=None, cost_map=None):
    t0 = time.time()
    goal_set = set(map(tuple, goals))
    queue = [(tuple(start), [tuple(start)])]
    from collections import deque
    queue = deque([(tuple(start), [tuple(start)])])
    visited = {tuple(start)}
    visited_order = []

    while queue:
        (r, c), path = queue.popleft()
        visited_order.append([r, c])
        if (r, c) in goal_set:
            return _result(visited_order, path, t0, terrain_data, grid, cost_map)
        for nr, nc in get_neighbors(grid, r, c, rows, cols):
            if (nr, nc) not in visited:
                visited.add((nr, nc))
                queue.append(((nr, nc), path + [(nr, nc)]))
    return _no_path(visited_order, t0)


# ── DFS ───────────────────────────────────────────────────────────────────────
def dfs(grid, start, goals, rows, cols, terrain_data=None, cost_map=None):
    t0 = time.time()
    goal_set = set(map(tuple, goals))
    stack = [(tuple(start), [tuple(start)])]
    visited = set()
    visited_order = []

    while stack:
        (r, c), path = stack.pop()
        if (r, c) in visited:
            continue
        visited.add((r, c))
        visited_order.append([r, c])
        if (r, c) in goal_set:
            return _result(visited_order, path, t0, terrain_data, grid, cost_map)
        for nr, nc in get_neighbors(grid, r, c, rows, cols):
            if (nr, nc) not in visited:
                stack.append(((nr, nc), path + [(nr, nc)]))
    return _no_path(visited_order, t0)


# ── A* ────────────────────────────────────────────────────────────────────────
def astar(grid, start, goals, rows, cols, terrain_data=None, cost_map=None):
    t0 = time.time()
    cm = cost_map or DEFAULT_TERRAIN_COSTS
    goal_set = set(map(tuple, goals))
    start = tuple(start)
    heap = [(manhattan(start, goals), 0, start, [start])]
    g_costs = {start: 0}
    visited_order = []

    while heap:
        f, g, (r, c), path = heapq.heappop(heap)
        if g > g_costs.get((r, c), float('inf')):
            continue
        visited_order.append([r, c])
        if (r, c) in goal_set:
            return _result(visited_order, path, t0, terrain_data, grid, cm)
        for nr, nc in get_neighbors(grid, r, c, rows, cols):
            tc = get_terrain_cost(terrain_data, nr, nc, cm)
            new_g = g + tc
            if new_g < g_costs.get((nr, nc), float('inf')):
                g_costs[(nr, nc)] = new_g
                heapq.heappush(heap, (new_g + manhattan((nr, nc), goals), new_g, (nr, nc), path + [(nr, nc)]))
    return _no_path(visited_order, t0)


# ── Dijkstra ──────────────────────────────────────────────────────────────────
def dijkstra(grid, start, goals, rows, cols, terrain_data=None, cost_map=None):
    t0 = time.time()
    cm = cost_map or DEFAULT_TERRAIN_COSTS
    goal_set = set(map(tuple, goals))
    start = tuple(start)
    heap = [(0, start, [start])]
    dist = {start: 0}
    visited_order = []

    while heap:
        cost, (r, c), path = heapq.heappop(heap)
        if cost > dist.get((r, c), float('inf')):
            continue
        visited_order.append([r, c])
        if (r, c) in goal_set:
            return _result(visited_order, path, t0, terrain_data, grid, cm)
        for nr, nc in get_neighbors(grid, r, c, rows, cols):
            tc = get_terrain_cost(terrain_data, nr, nc, cm)
            new_cost = cost + tc
            if new_cost < dist.get((nr, nc), float('inf')):
                dist[(nr, nc)] = new_cost
                heapq.heappush(heap, (new_cost, (nr, nc), path + [(nr, nc)]))
    return _no_path(visited_order, t0)


# ── Greedy BFS ────────────────────────────────────────────────────────────────
def gbfs(grid, start, goals, rows, cols, terrain_data=None, cost_map=None):
    t0 = time.time()
    goal_set = set(map(tuple, goals))
    start = tuple(start)
    heap = [(manhattan(start, goals), start, [start])]
    visited = set()
    visited_order = []

    while heap:
        _, (r, c), path = heapq.heappop(heap)
        if (r, c) in visited:
            continue
        visited.add((r, c))
        visited_order.append([r, c])
        if (r, c) in goal_set:
            return _result(visited_order, path, t0, terrain_data, grid, cost_map)
        for nr, nc in get_neighbors(grid, r, c, rows, cols):
            if (nr, nc) not in visited:
                heapq.heappush(heap, (manhattan((nr, nc), goals), (nr, nc), path + [(nr, nc)]))
    return _no_path(visited_order, t0)


# ── Bidirectional BFS ─────────────────────────────────────────────────────────
def bidirectional_bfs(grid, start, goals, rows, cols, terrain_data=None, cost_map=None):
    from collections import deque
    t0 = time.time()
    start = tuple(start)
    goal = tuple(goals[0])
    if start == goal:
        return _result([[start[0], start[1]]], [start], t0, terrain_data, grid, cost_map)

    fwd_visited = {start: [start]}
    bwd_visited = {goal: [goal]}
    fwd_queue = deque([start])
    bwd_queue = deque([goal])
    visited_order = []

    while fwd_queue or bwd_queue:
        if fwd_queue:
            node = fwd_queue.popleft()
            visited_order.append(list(node))
            for nr, nc in get_neighbors(grid, node[0], node[1], rows, cols):
                nb = (nr, nc)
                if nb not in fwd_visited:
                    fwd_visited[nb] = fwd_visited[node] + [nb]
                    fwd_queue.append(nb)
                    if nb in bwd_visited:
                        path = fwd_visited[nb] + list(reversed(bwd_visited[nb][:-1]))
                        return _result(visited_order, path, t0, terrain_data, grid, cost_map)
        if bwd_queue:
            node = bwd_queue.popleft()
            visited_order.append(list(node))
            for nr, nc in get_neighbors(grid, node[0], node[1], rows, cols):
                nb = (nr, nc)
                if nb not in bwd_visited:
                    bwd_visited[nb] = bwd_visited[node] + [nb]
                    bwd_queue.append(nb)
                    if nb in fwd_visited:
                        path = fwd_visited[nb] + list(reversed(bwd_visited[nb][:-1]))
                        return _result(visited_order, path, t0, terrain_data, grid, cost_map)
    return _no_path(visited_order, t0)


# ── Helpers ───────────────────────────────────────────────────────────────────
def _calc_cost(path, terrain_data, grid, cost_map):
    if not terrain_data or not path:
        return len(path) - 1 if path else 0
    cm = cost_map or DEFAULT_TERRAIN_COSTS
    return sum(get_terrain_cost(terrain_data, r, c, cm) for r, c in path[1:])


def _result(visited_order, path, t0, terrain_data, grid, cost_map):
    path_list = [list(p) for p in path]
    return {
        'visited': visited_order,
        'path': path_list,
        'path_length': len(path_list) - 1,
        'nodes_explored': len(visited_order),
        'execution_time': round((time.time() - t0) * 1000, 3),
        'total_cost': _calc_cost(path, terrain_data, grid, cost_map),
        'success': True,
    }


def _no_path(visited_order, t0):
    return {
        'visited': visited_order,
        'path': [],
        'path_length': -1,
        'nodes_explored': len(visited_order),
        'execution_time': round((time.time() - t0) * 1000, 3),
        'total_cost': -1,
        'success': False,
    }


ALGORITHMS = {
    'bfs': bfs, 'dfs': dfs, 'astar': astar,
    'dijkstra': dijkstra, 'gbfs': gbfs, 'bidirectional_bfs': bidirectional_bfs,
}


def run_algorithm(algo_name, grid, start, goals, terrain_data=None, cost_map=None):
    fn = ALGORITHMS.get(algo_name)
    if not fn:
        raise ValueError(f'Unknown algorithm: {algo_name}')
    rows = len(grid)
    cols = len(grid[0]) if rows > 0 else 0
    return fn(grid, start, goals, rows, cols, terrain_data, cost_map)


def run_all(algorithms, grid, start, goals, terrain_data=None, cost_map=None):
    results = {}
    for algo in algorithms:
        try:
            results[algo] = run_algorithm(algo, grid, start, goals, terrain_data, cost_map)
        except Exception as e:
            results[algo] = {'error': str(e), 'success': False}
    return results
