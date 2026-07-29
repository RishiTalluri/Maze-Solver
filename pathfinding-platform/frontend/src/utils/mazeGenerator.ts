import { Grid, TerrainGrid, TerrainDef } from '../types';

export interface GeneratorOptions {
  rows: number;
  cols: number;
  terrainEnabled: boolean;
  terrainDefs: TerrainDef[];
  terrainProbabilities: Record<string, number>;
  wallDensity: number;
  algorithm: 'recursive_backtracker' | 'random_walls';
}

function recursiveBacktracker(rows: number, cols: number): Grid {
  const R = rows % 2 === 0 ? rows - 1 : rows;
  const C = cols % 2 === 0 ? cols - 1 : cols;
  const grid: number[][] = Array.from({ length: R }, () => Array(C).fill(1));
  const carve = (r: number, c: number) => {
    grid[r][c] = 0;
    const dirs = [[-2,0],[2,0],[0,-2],[0,2]].sort(() => Math.random() - 0.5);
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr > 0 && nr < R && nc > 0 && nc < C && grid[nr][nc] === 1) {
        grid[r + dr/2][c + dc/2] = 0;
        carve(nr, nc);
      }
    }
  };
  carve(1, 1);
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ((r >= R || c >= C) ? 1 : grid[r][c])) as any
  );
}

function randomWalls(rows: number, cols: number, wallDensity: number): Grid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() * 100 < wallDensity ? 1 : 0)) as any
  );
}

function placeStartEnd(grid: Grid, rows: number, cols: number): Grid {
  const g = grid.map(r => [...r]) as Grid;
  let placed = false;
  for (let r = 0; r < rows && !placed; r++)
    for (let c = 0; c < cols && !placed; c++)
      if (g[r][c] === 0) { g[r][c] = 2 as any; placed = true; }
  placed = false;
  for (let r = rows - 1; r >= 0 && !placed; r--)
    for (let c = cols - 1; c >= 0 && !placed; c--)
      if (g[r][c] === 0) { g[r][c] = 3 as any; placed = true; }
  return g;
}

export function hasSolution(grid: Grid): boolean {
  const rows = grid.length, cols = grid[0]?.length || 0;
  let start: [number,number] | null = null;
  const goals: [number,number][] = [];
  grid.forEach((row, r) => row.forEach((cell, c) => {
    if (cell === 2) start = [r,c];
    if (cell === 3) goals.push([r,c]);
  }));
  if (!start || !goals.length) return false;
  const goalSet = new Set(goals.map(([r,c]) => `${r},${c}`));
  const visited = new Set([`${(start as [number,number])[0]},${(start as [number,number])[1]}`]);
  const queue: [number,number][] = [start];
  while (queue.length) {
    const [r,c] = queue.shift()!;
    if (goalSet.has(`${r},${c}`)) return true;
    for (const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr=r+dr, nc=c+dc, k=`${nr},${nc}`;
      if (nr>=0&&nr<rows&&nc>=0&&nc<cols&&!visited.has(k)&&grid[nr][nc]!==1)
        { visited.add(k); queue.push([nr,nc]); }
    }
  }
  return false;
}

function paintTerrain(grid: Grid, rows: number, cols: number, terrainDefs: TerrainDef[], probs: Record<string,number>): TerrainGrid {
  const total = Object.values(probs).reduce((a,b) => a+b, 0);
  const terrain: TerrainGrid = Array.from({length:rows},()=>Array(cols).fill('empty'));
  grid.forEach((row,r) => row.forEach((cell,c) => {
    if (cell !== 0) return;
    const rand = Math.random() * (total || 1);
    let cum = 0;
    for (const def of terrainDefs) {
      cum += (probs[def.key] || 0);
      if (rand < cum) { terrain[r][c] = def.key; break; }
    }
  }));
  return terrain;
}

export function generateMaze(opts: GeneratorOptions): { grid: Grid; terrainGrid: TerrainGrid; start: [number,number]; ends: [number,number][] } {
  const { rows, cols, terrainEnabled, terrainDefs, terrainProbabilities, wallDensity, algorithm } = opts;
  let grid: Grid = Array.from({length:rows},()=>Array(cols).fill(0) as any);
  let attempts = 0;
  do {
    const raw = algorithm === 'recursive_backtracker'
      ? recursiveBacktracker(rows, cols)
      : randomWalls(rows, cols, wallDensity);
    grid = placeStartEnd(raw, rows, cols);
    attempts++;
  } while (!hasSolution(grid) && attempts < 20);

  let start: [number,number] = [0,0];
  const ends: [number,number][] = [];
  grid.forEach((row,r) => row.forEach((cell,c) => {
    if (cell===2) start=[r,c];
    if (cell===3) ends.push([r,c]);
  }));

  const terrainGrid = (terrainEnabled && terrainDefs.length > 0)
    ? paintTerrain(grid, rows, cols, terrainDefs, terrainProbabilities)
    : Array.from({length:rows},()=>Array(cols).fill('empty')) as TerrainGrid;

  return { grid, terrainGrid, start, ends };
}
