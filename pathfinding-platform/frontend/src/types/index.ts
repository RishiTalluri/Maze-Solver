// ─── Users ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  avatar_url: string | null;
  created_at: string;
  last_login: string | null;
}

export interface PublicUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// ─── Maze ─────────────────────────────────────────────────────────────────────
export type CellType = 0 | 1 | 2 | 3;
export type TerrainType = 'empty' | 'grass' | 'sand' | 'mud' | 'water' | 'mountain' | string;
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type Grid = CellType[][];
export type TerrainGrid = TerrainType[][];

// Custom terrain definition
export interface TerrainDef {
  key: string;
  label: string;
  icon: string;
  cost: number;
  color: string; // hex color for grid display
  isCustom?: boolean;
}

export interface Maze {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  rows: number;
  cols: number;
  grid_data: Grid;
  terrain_data: TerrainGrid | null;
  is_public: boolean;
  difficulty: Difficulty | null;
  tags: string[];
  view_count: number;
  created_at: string;
  updated_at: string;
  owner: PublicUser | null;
}

export interface MazeSummary extends Omit<Maze, 'grid_data' | 'terrain_data'> {}

// ─── Algorithms ───────────────────────────────────────────────────────────────
export type AlgorithmKey = 'bfs' | 'dfs' | 'astar' | 'dijkstra' | 'gbfs' | 'bidirectional_bfs';

export interface AlgorithmInfo {
  key: AlgorithmKey;
  name: string;
  optimal: boolean;
  weighted: boolean;
}

export interface AlgorithmResult {
  visited: [number, number][];
  path: [number, number][];
  path_length: number;
  nodes_explored: number;
  execution_time: number;
  total_cost: number;
  success: boolean;
  error?: string;
}

export type SolveResults = Partial<Record<AlgorithmKey, AlgorithmResult>>;

// ─── Algorithm Run (DB record) ────────────────────────────────────────────────
export interface AlgorithmRun {
  id: string;
  maze_id: string | null;
  algorithm: AlgorithmKey;
  path_length: number | null;
  nodes_explored: number | null;
  execution_time: number | null;
  total_cost: number | null;
  success: boolean;
  ran_at: string;
}

// ─── Experiments ──────────────────────────────────────────────────────────────
export interface Experiment {
  id: string;
  user_id: string;
  maze_id: string;
  name: string;
  algorithms: AlgorithmKey[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
  runs?: AlgorithmRun[];
}

// ─── Shared Links ─────────────────────────────────────────────────────────────
export interface SharedLink {
  id: string;
  maze_id: string;
  token: string;
  expires_at: string | null;
  view_count: number;
  created_at: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface DashboardData {
  summary: {
    total_mazes: number;
    total_experiments: number;
    total_runs: number;
    success_rate: number;
  };
  averages: {
    execution_time: number;
    nodes_explored: number;
    path_length: number;
  };
  algorithm_usage: { algorithm: string; count: number }[];
  recent_runs: AlgorithmRun[];
}

export interface AlgorithmStats {
  algorithm: string;
  total_runs: number;
  avg_execution_time: number;
  avg_nodes_explored: number;
  avg_path_length: number;
  success_rate: number;
}

export interface GlobalAlgorithmStats extends AlgorithmStats {
  distinct_users: number;
}

export interface GlobalStats {
  total_users: number;
  contributing_users: number;
  total_runs: number;
  algorithms: GlobalAlgorithmStats[];
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  per_page: number;
}

// ─── Editor State ─────────────────────────────────────────────────────────────
export type DrawMode = 'start' | 'end' | 'wall' | 'erase' | 'terrain';

export interface AnimState {
  visited: [number, number][];
  path: [number, number][];
  phase: 'idle' | 'visiting' | 'pathing' | 'done';
}

export type AnimStateMap = Partial<Record<AlgorithmKey, AnimState>>;
