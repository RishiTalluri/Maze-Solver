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

  setResults: (results) => set({ results }),
  setIsAnimating: (isAnimating) => set({ isAnimating }),
  setAnimStates: (animStates) => set({ animStates }),
  addAnimTimeout: (t) => set(s => ({ animTimeouts: [...s.animTimeouts, t] })),
  clearAnimTimeouts: () => {
    get().animTimeouts.forEach(clearTimeout);
    set({ animTimeouts: [], isAnimating: false });
  },
}));
