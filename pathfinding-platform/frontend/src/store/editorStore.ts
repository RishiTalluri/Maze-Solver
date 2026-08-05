import { create } from 'zustand';
import { Grid, TerrainGrid, DrawMode, AlgorithmKey, AnimStateMap, SolveResults, CellType, TerrainDef } from '../types';

// Default terrain definitions — user can edit costs or add custom ones
export const DEFAULT_TERRAINS: TerrainDef[] = [
  { key: 'grass',    label: 'Grass',    icon: '🌿', cost: 1,  color: '#166534' },
  { key: 'sand',     label: 'Sand',     icon: '🏖',  cost: 3,  color: '#92400e' },
  { key: 'mud',      label: 'Mud',      icon: '🪨',  cost: 5,  color: '#78350f' },
  { key: 'water',    label: 'Water',    icon: '💧', cost: 8,  color: '#1e3a5f' },
  { key: 'mountain', label: 'Mountain', icon: '⛰',  cost: 15, color: '#1c1917' },
];

export interface AlgoColorPair { path: string; visited: string; }

// Default path/explore colors per algorithm — fully user-editable at runtime,
// independently for the solved path vs. the explored/visited trail.
// NOTE: never default to purple/violet shades here (product decision).
export const DEFAULT_ALGO_COLORS: Record<AlgorithmKey, AlgoColorPair> = {
  bfs:                { path: '#3b82f6', visited: '#3b82f6' }, // blue
  dfs:                { path: '#06b6d4', visited: '#06b6d4' }, // cyan
  astar:              { path: '#FFD166', visited: '#FFD166' }, // accent amber
  dijkstra:           { path: '#FF6B35', visited: '#FF6B35' }, // primary orange
  gbfs:               { path: '#8BC34A', visited: '#8BC34A' }, // lime — distinct from astar's amber
  bidirectional_bfs:  { path: '#ec4899', visited: '#ec4899' }, // pink
};

// Wall is drawn like a "terrain" for probability purposes but isn't in terrainDefs.
export const WALL_COLOR_KEY = '__wall__';
export const DEFAULT_WALL_COLOR = '#0A0A0A';

function makeGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () => Array(cols).fill(0) as CellType[]);
}

function makeTerrainGrid(rows: number, cols: number): TerrainGrid {
  return Array.from({ length: rows }, () => Array(cols).fill('empty'));
}

interface EditorStore {
  rows: number;
  cols: number;
  grid: Grid;
  terrainGrid: TerrainGrid;
  start: [number, number] | null;
  ends: [number, number][];
  drawMode: DrawMode;
  selectedAlgos: AlgorithmKey[];
  speed: number;
  showTerrain: boolean;
  selectedTerrain: string;
  terrainDefs: TerrainDef[];
  algoColors: Record<AlgorithmKey, AlgoColorPair>;
  wallColor: string;
  animStates: AnimStateMap;
  results: SolveResults;
  isAnimating: boolean;
  animTimeouts: ReturnType<typeof setTimeout>[];

  setSize: (rows: number, cols: number) => void;
  setCell: (r: number, c: number) => void;
  resetGrid: () => void;
  clearPaths: () => void;
  setDrawMode: (mode: DrawMode) => void;
  setSelectedAlgos: (algos: AlgorithmKey[]) => void;
  setSpeed: (speed: number) => void;
  setShowTerrain: (v: boolean) => void;
  setSelectedTerrain: (t: string) => void;

  // Terrain management
  updateTerrainCost: (key: string, cost: number) => void;
  addCustomTerrain: (def: TerrainDef) => void;
  removeCustomTerrain: (key: string) => void;
  updateTerrainColor: (key: string, color: string) => void;

  // Path & wall colors
  setAlgoColor: (algo: AlgorithmKey, kind: keyof AlgoColorPair, color: string) => void;
  setWallColor: (color: string) => void;

  setResults: (results: SolveResults) => void;
  setIsAnimating: (v: boolean) => void;
  setAnimStates: (states: AnimStateMap) => void;
  addAnimTimeout: (t: ReturnType<typeof setTimeout>) => void;
  clearAnimTimeouts: () => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  rows: 20,
  cols: 30,
  grid: makeGrid(20, 30),
  terrainGrid: makeTerrainGrid(20, 30),
  start: null,
  ends: [],
  drawMode: 'wall',
  selectedAlgos: ['bfs'],
  speed: 60,
  showTerrain: false,
  selectedTerrain: 'grass',
  terrainDefs: DEFAULT_TERRAINS,
  algoColors: { ...DEFAULT_ALGO_COLORS },
  wallColor: DEFAULT_WALL_COLOR,
  animStates: {},
  results: {},
  isAnimating: false,
  animTimeouts: [],

  setSize: (rows, cols) => set({
    rows, cols,
    grid: makeGrid(rows, cols),
    terrainGrid: makeTerrainGrid(rows, cols),
    start: null, ends: [],
    animStates: {}, results: {},
  }),

  setCell: (r, c) => {
    const { grid, terrainGrid, drawMode, start, ends, selectedTerrain } = get();
    const newGrid = grid.map(row => [...row]) as Grid;
    const newTerrain = terrainGrid.map(row => [...row]) as TerrainGrid;
    let newStart = start;
    let newEnds = [...ends];

    if (drawMode === 'terrain') {
      newTerrain[r][c] = selectedTerrain;
      set({ terrainGrid: newTerrain });
      return;
    }

    const current = newGrid[r][c];

    if (drawMode === 'start') {
      if (newStart) newGrid[newStart[0]][newStart[1]] = 0;
      newGrid[r][c] = 2;
      newStart = [r, c];
    } else if (drawMode === 'end') {
      if (current === 3) {
        newGrid[r][c] = 0;
        newEnds = newEnds.filter(e => !(e[0] === r && e[1] === c));
      } else {
        if (current === 2) newStart = null;
        newGrid[r][c] = 3;
        newEnds = [...newEnds.filter(e => !(e[0] === r && e[1] === c)), [r, c]];
      }
    } else if (drawMode === 'wall') {
      if (current === 2) newStart = null;
      if (current === 3) newEnds = newEnds.filter(e => !(e[0] === r && e[1] === c));
      newGrid[r][c] = 1;
    } else if (drawMode === 'erase') {
      if (current === 2) newStart = null;
      if (current === 3) newEnds = newEnds.filter(e => !(e[0] === r && e[1] === c));
      newGrid[r][c] = 0;
      newTerrain[r][c] = 'empty';
    }

    set({ grid: newGrid, terrainGrid: newTerrain, start: newStart, ends: newEnds });
  },

  resetGrid: () => {
    const { rows, cols } = get();
    get().clearAnimTimeouts();
    set({
      grid: makeGrid(rows, cols),
      terrainGrid: makeTerrainGrid(rows, cols),
      start: null, ends: [],
      animStates: {}, results: {},
    });
  },

  clearPaths: () => {
    get().clearAnimTimeouts();
    set({ animStates: {}, results: {} });
  },

  setDrawMode: (drawMode) => set({ drawMode }),
  setSelectedAlgos: (selectedAlgos) => set({ selectedAlgos }),
  setSpeed: (speed) => set({ speed }),
  setShowTerrain: (showTerrain) => set({ showTerrain }),
  setSelectedTerrain: (selectedTerrain) => set({ selectedTerrain }),

  updateTerrainCost: (key, cost) => set(s => ({
    terrainDefs: s.terrainDefs.map(t => t.key === key ? { ...t, cost: Math.max(1, cost) } : t)
  })),

  updateTerrainColor: (key, color) => set(s => ({
    terrainDefs: s.terrainDefs.map(t => t.key === key ? { ...t, color } : t)
  })),

  addCustomTerrain: (def) => set(s => ({
    terrainDefs: [...s.terrainDefs, { ...def, isCustom: true }]
  })),

  removeCustomTerrain: (key) => set(s => ({
    terrainDefs: s.terrainDefs.filter(t => t.key !== key),
    selectedTerrain: s.selectedTerrain === key ? 'grass' : s.selectedTerrain,
  })),

  setAlgoColor: (algo, kind, color) => set(s => ({ algoColors: { ...s.algoColors, [algo]: { ...s.algoColors[algo], [kind]: color } } })),
  setWallColor: (wallColor) => set({ wallColor }),

  setResults: (results) => set({ results }),
  setIsAnimating: (isAnimating) => set({ isAnimating }),
  setAnimStates: (animStates) => set({ animStates }),
  addAnimTimeout: (t) => set(s => ({ animTimeouts: [...s.animTimeouts, t] })),
  clearAnimTimeouts: () => {
    get().animTimeouts.forEach(clearTimeout);
    set({ animTimeouts: [], isAnimating: false });
  },
}));
