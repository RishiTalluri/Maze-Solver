import { useCallback } from 'react';
import { solveApi } from '../api/experiments';
import { useEditorStore } from '../store/editorStore';
import { AlgorithmKey, AnimStateMap } from '../types';

export const ALGO_META: Record<AlgorithmKey, { label: string; color: string; visitedColor: string }> = {
  bfs:               { label: 'BFS',         color: '#3b82f6', visitedColor: 'rgba(59,130,246,0.18)'  },
  dfs:               { label: 'DFS',         color: '#a855f7', visitedColor: 'rgba(168,85,247,0.18)'  },
  astar:             { label: 'A*',          color: '#10B981', visitedColor: 'rgba(16,185,129,0.18)'  },
  dijkstra:          { label: 'Dijkstra',    color: '#EA580C', visitedColor: 'rgba(234,88,12,0.18)'   },
  gbfs:              { label: 'Greedy BFS',  color: '#f59e0b', visitedColor: 'rgba(245,158,11,0.18)'  },
  bidirectional_bfs: { label: 'Bidir. BFS',  color: '#ec4899', visitedColor: 'rgba(236,72,153,0.18)'  },
};

export function useSolver() {
  const {
    grid, start, ends, selectedAlgos, speed, terrainGrid, showTerrain, terrainDefs,
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

      const stepDelay = Math.max(5, 205 - speed * 2);
      let globalMax = 0;

      selectedAlgos.forEach(algo => {
        const result = data[algo];
        if (!result) return;
        const visited = result.visited || [];
        const path = result.path || [];

        visited.forEach((node, i) => {
          const t = setTimeout(() => {
            const cur = useEditorStore.getState().animStates[algo];
            if (!cur) return;
            setAnimStates({
              ...useEditorStore.getState().animStates,
              [algo]: { ...cur, visited: cur.visited.concat([node]), phase: 'visiting' },
            });
          }, i * stepDelay);
          addAnimTimeout(t);
        });

        const pathStart = visited.length * stepDelay;
        path.forEach((node, i) => {
          const t = setTimeout(() => {
            const cur = useEditorStore.getState().animStates[algo];
            if (!cur) return;
            setAnimStates({
              ...useEditorStore.getState().animStates,
              [algo]: { ...cur, path: cur.path.concat([node]), phase: 'pathing' },
            });
          }, pathStart + i * stepDelay * 0.6);
          addAnimTimeout(t);
        });

        const doneAt = pathStart + path.length * stepDelay * 0.6 + 100;
        const doneT = setTimeout(() => {
          const cur = useEditorStore.getState().animStates[algo];
          if (!cur) return;
          setAnimStates({ ...useEditorStore.getState().animStates, [algo]: { ...cur, phase: 'done' } });
        }, doneAt);
        addAnimTimeout(doneT);
        if (doneAt > globalMax) globalMax = doneAt;
      });

      const finishT = setTimeout(() => setIsAnimating(false), globalMax + 50);
      addAnimTimeout(finishT);
    } catch (err: any) {
      setIsAnimating(false);
      throw new Error(err.response?.data?.error || 'Failed to connect to backend');
    }
  }, [grid, start, ends, selectedAlgos, speed, terrainGrid, showTerrain, terrainDefs,
      setResults, setIsAnimating, setAnimStates, addAnimTimeout, clearAnimTimeouts]);

  return { solve };
}
