import { Grid, TerrainGrid, TerrainDef } from '../types';

export interface GeneratorOptions {
  rows: number; cols: number;
  terrainEnabled: boolean; terrainDefs: TerrainDef[];
  terrainWeights: Record<string, number>;
  wallDensity: number;
  algorithm: 'recursive_backtracker' | 'random_walls';
}

function recursiveBacktracker(rows: number, cols: number): Grid {
  const R = rows % 2 === 0 ? rows - 1 : rows;
  const C = cols % 2 === 0 ? cols - 1 : cols;
  const g: number[][] = Array.from({ length: R }, () => Array(C).fill(1));
  const carve = (r: number, c: number) => {
    g[r][c] = 0;
    const dirs = [[-2,0],[2,0],[0,-2],[0,2]].sort(() => Math.random() - 0.5);
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr > 0 && nr < R && nc > 0 && nc < C && g[nr][nc] === 1) {
        g[r + dr/2][c + dc/2] = 0; carve(nr, nc);
      }
    }
  };
  carve(1, 1);
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ((r >= R || c >= C) ? 1 : g[r][c])) as any);
}

function randomWalls(rows: number, cols: number, wd: number): Grid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() * 100 < wd ? 1 : 0)) as any);
}

// Picks Start/End from anywhere among the open cells (not just whichever cell
// the raster scan happens to hit first, which was always the top-left/bottom-right
// corner). Biased — not fully random — toward being reasonably far apart: Start is
// picked uniformly at random, then End is picked at random from whichever open
// cells clear a minimum distance threshold, so mazes stay interesting instead of
// occasionally placing Start and End right next to each other.
function placeStartEnd(grid: Grid, rows: number, cols: number): Grid {
  const g = grid.map(r => [...r]) as Grid;

  const open: [number, number][] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (g[r][c] === 0) open.push([r, c]);

  if (open.length === 0) return g; // defensive — shouldn't happen
  if (open.length === 1) {
    const [r, c] = open[0];
    g[r][c] = 2 as any;
    return g;
  }

  const [sr, sc] = open[Math.floor(Math.random() * open.length)];
  g[sr][sc] = 2 as any;

  // "A little far away": require at least ~40% of the grid's diagonal span
  // (Manhattan distance) between Start and End.
  const minDist = Math.floor((rows + cols) * 0.4);
  const dist = ([r, c]: [number, number]) => Math.abs(r - sr) + Math.abs(c - sc);

  let candidates = open.filter(cell => (cell[0] !== sr || cell[1] !== sc) && dist(cell) >= minDist);

  // Small/cramped mazes might not have anything that far — fall back to
  // whatever open cell is farthest from Start instead of failing the constraint.
  if (candidates.length === 0) {
    let best: [number, number] = open[0];
    let bestDist = -1;
    for (const cell of open) {
      if (cell[0] === sr && cell[1] === sc) continue;
      const d = dist(cell);
      if (d > bestDist) { bestDist = d; best = cell; }
    }
    candidates = [best];
  }

  const [er, ec] = candidates[Math.floor(Math.random() * candidates.length)];
  g[er][ec] = 3 as any;

  return g;
}

export function hasSolution(grid: Grid): boolean {
  const rows = grid.length, cols = grid[0]?.length || 0;
  let start: [number,number] | null = null;
  const goals: [number,number][] = [];
  grid.forEach((row, r) => row.forEach((cell, c) => {
    if (cell === 2) start = [r, c];
    if (cell === 3) goals.push([r, c]);
  }));
  if (!start || !goals.length) return false;
  const gs = new Set(goals.map(([r,c]) => `${r},${c}`));
  const vs = new Set([`${(start as [number,number])[0]},${(start as [number,number])[1]}`]);
  const q: [number,number][] = [start];
  while (q.length) {
    const [r, c] = q.shift()!;
    if (gs.has(`${r},${c}`)) return true;
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r+dr, nc = c+dc, k = `${nr},${nc}`;
      if (nr>=0&&nr<rows&&nc>=0&&nc<cols&&!vs.has(k)&&grid[nr][nc]!==1) { vs.add(k); q.push([nr,nc]); }
    }
  }
  return false;
}

function paintTerrain(grid: Grid, rows: number, cols: number, defs: TerrainDef[], weights: Record<string,number>): TerrainGrid {
  const t: TerrainGrid = Array.from({ length: rows }, () => Array(cols).fill('empty'));
  const total = defs.reduce((s, d) => s + (weights[d.key] || 0), 0);
  if (total === 0) return t;
  grid.forEach((row, r) => row.forEach((cell, c) => {
    if (cell !== 0) return;
    const rand = Math.random() * total;
    let cum = 0;
    for (const def of defs) { cum += (weights[def.key] || 0); if (rand < cum) { t[r][c] = def.key; break; } }
  }));
  return t;
}

export function generateMaze(opts: GeneratorOptions): { grid: Grid; terrainGrid: TerrainGrid; start: [number,number]; ends: [number,number][] } {
  const { rows, cols, terrainEnabled, terrainDefs, terrainWeights, wallDensity, algorithm } = opts;
  let grid: Grid = Array.from({ length: rows }, () => Array(cols).fill(0) as any);
  let attempts = 0;
  do {
    const raw = algorithm === 'recursive_backtracker'
      ? recursiveBacktracker(rows, cols) : randomWalls(rows, cols, wallDensity);
    grid = placeStartEnd(raw, rows, cols); attempts++;
  } while (!hasSolution(grid) && attempts < 20);

  let start: [number,number] = [0,0]; const ends: [number,number][] = [];
  grid.forEach((row, r) => row.forEach((cell, c) => { if (cell===2) start=[r,c]; if (cell===3) ends.push([r,c]); }));
  const terrainGrid = (terrainEnabled && terrainDefs.length > 0)
    ? paintTerrain(grid, rows, cols, terrainDefs, terrainWeights)
    : Array.from({ length: rows }, () => Array(cols).fill('empty')) as TerrainGrid;
  return { grid, terrainGrid, start, ends };
}
