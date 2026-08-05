import { useCallback } from 'react';
import { solveApi } from '../api/experiments';
import { useEditorStore } from '../store/editorStore';
import { AlgorithmKey, AnimStateMap } from '../types';

// Static labels only — colors now live in the editor store (algoColors) so
// they're user-editable at runtime. Use `useAlgoMeta()` inside components to
// get the current { label, color, visitedColor } for an algorithm; it updates
// live whenever the user edits colors, no page refresh needed.
export const ALGO_LABELS: Record<AlgorithmKey, string> = {
  bfs:               'BFS',
  dfs:               'DFS',
  astar:             'A*',
  dijkstra:          'Dijkstra',
  gbfs:              'Greedy BFS',
  bidirectional_bfs: 'Bidir. BFS',
};

export function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const num = parseInt(h, 16);
  if (isNaN(num)) return `rgba(148,163,184,${alpha})`;
  const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function buildAlgoMeta(algoColors: Record<AlgorithmKey, { path: string; visited: string }>) {
  const out = {} as Record<AlgorithmKey, { label: string; color: string; pathColor: string; visitedColorHex: string; visitedColor: string }>;
  (Object.keys(ALGO_LABELS) as AlgorithmKey[]).forEach(algo => {
    const pair = algoColors[algo];
    out[algo] = {
      label: ALGO_LABELS[algo],
      color: pair.path,                       // back-compat alias — solid path color
      pathColor: pair.path,
      visitedColorHex: pair.visited,           // raw hex, for color pickers
      visitedColor: hexToRgba(pair.visited, 0.35), // translucent, for grid rendering
    };
  });
  return out;
}

export type AlgoMeta = ReturnType<typeof buildAlgoMeta>[AlgorithmKey];

// Back-compat snapshot for call sites outside React render (helper functions, etc).
// Reflects the palette at import time only — prefer `useAlgoMeta()` inside components.
export const ALGO_META = buildAlgoMeta(useEditorStore.getState().algoColors);
export const ALL_ALGOS = Object.keys(ALGO_LABELS) as AlgorithmKey[];

// Live hook — use this inside components so path/visited colors update immediately
// when the user edits them in the Colors editor.
export function useAlgoMeta(): Record<AlgorithmKey, AlgoMeta> {
  const algoColors = useEditorStore(s => s.algoColors);
  return buildAlgoMeta(algoColors);
}

export function useSolver() {
  const {
    grid, start, ends, selectedAlgos, terrainGrid, showTerrain, terrainDefs,
    setResults, setIsAnimating, setAnimStates, addAnimTimeout, clearAnimTimeouts,
  } = useEditorStore();

  const solve = useCallback(async (mazeId?: string) => {
    if (!start || ends.length === 0 || selectedAlgos.length === 0) return;
    clearAnimTimeouts();
    setResults({});

    const initStates: AnimStateMap = {};
    selectedAlgos.forEach(a => { initStates[a] = { visited: [], path: [], phase: 'idle' }; });
    setAnimStates(initStates);
    setIsAnimating(true);

    // Build terrain cost map from current terrainDefs
    const terrainCostMap: Record<string, number> = {};
    terrainDefs.forEach(t => { terrainCostMap[t.key] = t.cost; });

    // Inject custom costs into terrain grid before sending
    const enrichedTerrainGrid = showTerrain ? terrainGrid : null;

    try {
      const res = await solveApi.solve({
        grid,
        start,
        goals: ends,
        algorithms: selectedAlgos,
        terrain_data: enrichedTerrainGrid,
        terrain_costs: terrainCostMap,
        maze_id: mazeId,
      });

      const data = res.data;
      setResults(data);

      let pending = 0;
      const onAlgoDone = () => {
        pending -= 1;
        if (pending <= 0) setIsAnimating(false);
      };

      selectedAlgos.forEach(algo => {
        const result = data[algo];
        if (!result) return;
        const visited = result.visited || [];
        const path = result.path || [];
        pending += 1;

        // Each step re-reads speed from the store live (instead of capturing it once
        // up front), so dragging the speed slider mid-animation actually speeds up or
        // slows down the run in progress — it no longer takes a fresh Solve to apply.
        // Moving the slider itself never touches grid/results, so the maze never resets.
        const scheduleNext = (isPath: boolean, index: number) => {
          const liveSpeed = useEditorStore.getState().speed;
          const delay = Math.max(5, 205 - liveSpeed * 2);
          const list = isPath ? path : visited;

          if (index >= list.length) {
            if (isPath) {
              addAnimTimeout(setTimeout(onAlgoDone, delay));
            } else {
              scheduleNext(true, 0);
            }
            return;
          }

          const t = setTimeout(() => {
            const cur = useEditorStore.getState().animStates[algo];
            if (!cur) return;
            const node = list[index];
            const next = isPath
              ? { ...cur, path: cur.path.concat([node]), phase: 'pathing' as const }
              : { ...cur, visited: cur.visited.concat([node]), phase: 'visiting' as const };
            setAnimStates({ ...useEditorStore.getState().animStates, [algo]: next });
            scheduleNext(isPath, index + 1);
          }, delay);
          addAnimTimeout(t);
        };

        scheduleNext(false, 0);
      });

      if (pending === 0) setIsAnimating(false);
    } catch (err: any) {
      setIsAnimating(false);
      throw new Error(err.response?.data?.error || 'Failed to connect to backend');
    }
  }, [grid, start, ends, selectedAlgos, terrainGrid, showTerrain, terrainDefs,
      setResults, setIsAnimating, setAnimStates, addAnimTimeout, clearAnimTimeouts]);

  return { solve };
}
