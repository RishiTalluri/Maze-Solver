import { useState, useRef, useCallback } from 'react';

export const ALGO_LABELS = {
  bfs: 'BFS',
  dfs: 'DFS',
  astar: 'A*',
  gbfs: 'Greedy BFS'
};

export const ALGO_COLORS = {
  bfs: { visited: 'rgba(0, 212, 255, 0.35)', path: '#00d4ff', visitedDark: 'rgba(0, 212, 255, 0.15)' },
  dfs: { visited: 'rgba(168, 85, 247, 0.35)', path: '#a855f7', visitedDark: 'rgba(168, 85, 247, 0.15)' },
  astar: { visited: 'rgba(34, 197, 94, 0.35)', path: '#22c55e', visitedDark: 'rgba(34, 197, 94, 0.15)' },
  gbfs: { visited: 'rgba(249, 115, 22, 0.35)', path: '#f97316', visitedDark: 'rgba(249, 115, 22, 0.15)' },
};

export function useSolver() {
  const [results, setResults] = useState({});
  const [animState, setAnimState] = useState({}); // { algo: { visited: [], path: [], phase: 'idle'|'visiting'|'pathing'|'done' } }
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState(null);
  const timeoutsRef = useRef([]);

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const stopAnimation = useCallback(() => {
    clearTimeouts();
    setIsAnimating(false);
  }, [clearTimeouts]);

  const solve = useCallback(async (grid, start, goals, algorithms, speed) => {
    if (!start || goals.length === 0 || algorithms.length === 0) return;
    clearTimeouts();
    setError(null);
    setResults({});

    // Initialize anim state
    const initAnim = {};
    algorithms.forEach(a => { initAnim[a] = { visited: [], path: [], phase: 'idle' }; });
    setAnimState(initAnim);
    setIsAnimating(true);

    try {
      const res = await fetch('/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grid, start, goals, algorithms })
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setResults(data);

      // Animate each algorithm
      const delay = Math.max(10, 310 - speed * 3); // speed 1-100 → delay 10-300ms
      let maxTime = 0;

      algorithms.forEach((algo, algoIdx) => {
        const result = data[algo];
        if (!result) return;
        const visited = result.visited || [];
        const path = result.path || [];

        // Animate visited nodes
        visited.forEach((node, i) => {
          const t = setTimeout(() => {
            setAnimState(prev => ({
              ...prev,
              [algo]: {
                ...prev[algo],
                visited: prev[algo].visited.concat([node]),
                phase: 'visiting'
              }
            }));
          }, i * delay);
          timeoutsRef.current.push(t);
        });

        // Then animate path
        const pathStart = visited.length * delay;
        path.forEach((node, i) => {
          const t = setTimeout(() => {
            setAnimState(prev => ({
              ...prev,
              [algo]: {
                ...prev[algo],
                path: prev[algo].path.concat([node]),
                phase: 'pathing'
              }
            }));
          }, pathStart + i * delay * 0.5);
          timeoutsRef.current.push(t);
        });

        const total = pathStart + path.length * delay * 0.5 + 100;
        if (total > maxTime) maxTime = total;

        const doneT = setTimeout(() => {
          setAnimState(prev => ({
            ...prev,
            [algo]: { ...prev[algo], phase: 'done' }
          }));
        }, pathStart + path.length * delay * 0.5 + 50);
        timeoutsRef.current.push(doneT);
      });

      const finishT = setTimeout(() => {
        setIsAnimating(false);
      }, maxTime);
      timeoutsRef.current.push(finishT);

    } catch (e) {
      setError(e.message || 'Failed to connect to backend');
      setIsAnimating(false);
    }
  }, [clearTimeouts]);

  const clearResults = useCallback(() => {
    clearTimeouts();
    setResults({});
    setAnimState({});
    setIsAnimating(false);
    setError(null);
  }, [clearTimeouts]);

  return { results, animState, isAnimating, error, solve, stopAnimation, clearResults };
}
