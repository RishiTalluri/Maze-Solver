import React, { useRef, useCallback, useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useAlgoMeta } from '../../hooks/useSolver';
import { AlgorithmKey } from '../../types';

export const MazeGrid: React.FC<{ disabled?: boolean }> = ({ disabled }) => {
  const { grid, terrainGrid, showTerrain, animStates, isAnimating, setCell, terrainDefs, wallColor } = useEditorStore();
  const ALGO_META = useAlgoMeta();
  const cols = grid[0]?.length || 1;
  const isDrawing = useRef(false);
  const lastCell = useRef<string>('');

  const cellSize = Math.min(32, Math.max(8, Math.floor(Math.min(700, window.innerWidth - 60) / cols)));

  const terrainColorMap = useMemo(() => {
    const map: Record<string,string> = {};
    terrainDefs.forEach(t => { map[t.key] = t.color; });
    return map;
  }, [terrainDefs]);

  const algoSets = useMemo(() => {
    const sets: Record<string,{ visited: Set<string>; path: Set<string> }> = {};
    Object.entries(animStates).forEach(([algo, state]) => {
      sets[algo] = {
        visited: new Set(state.visited.map(([r,c]) => `${r},${c}`)),
        path:    new Set(state.path.map(([r,c])    => `${r},${c}`)),
      };
    });
    return sets;
  }, [animStates]);

  const algos = Object.keys(algoSets) as AlgorithmKey[];

  const getCellStyle = useCallback((r: number, c: number, cellType: number): React.CSSProperties => {
    const key = `${r},${c}`;
    for (const algo of algos) {
      if (algoSets[algo].path.has(key)) {
        const color = ALGO_META[algo]?.color || '#FF6B35';
        return { backgroundColor: color, boxShadow: `0 0 4px ${color}88`, border:'0.5px solid transparent', transition:'background-color 0.08s' };
      }
    }
    for (const algo of algos) {
      if (algoSets[algo].visited.has(key)) {
        return { backgroundColor: ALGO_META[algo]?.visitedColor || 'rgba(59,130,246,0.2)', border:'0.5px solid rgba(255,255,255,0.04)', transition:'background-color 0.08s' };
      }
    }
    if (cellType === 2) return { backgroundColor:'#FFD166', boxShadow:'0 0 8px #FFD16688', border:'0.5px solid #ffd674' };
    if (cellType === 3) return { backgroundColor:'#FF6B35', boxShadow:'0 0 8px #FF6B3588', border:'0.5px solid #ff8752' };
    if (cellType === 1) return { backgroundColor: wallColor, border:'0.5px solid rgba(0,0,0,0.5)' };
    if (showTerrain && terrainGrid[r]?.[c] && terrainGrid[r][c] !== 'empty') {
      const color = terrainColorMap[terrainGrid[r][c]] || '#242424';
      return { backgroundColor: color, border:'0.5px solid rgba(255,255,255,0.06)' };
    }
    return { backgroundColor:'rgba(255,255,255,0.025)', border:'0.5px solid rgba(255,255,255,0.04)' };
  }, [algos, algoSets, showTerrain, terrainGrid, terrainColorMap, wallColor, ALGO_META]);

  const interact = useCallback((r: number, c: number) => {
    if (disabled || isAnimating) return;
    const k = `${r},${c}`;
    if (lastCell.current === k) return;
    lastCell.current = k;
    setCell(r, c);
  }, [disabled, isAnimating, setCell]);

  return (
    <div
      className="inline-block rounded-2xl overflow-hidden"
      style={{ border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 8px 40px rgba(0,0,0,0.5)', userSelect:'none', cursor: disabled?'not-allowed':'crosshair' }}
      onMouseUp={() => { isDrawing.current=false; lastCell.current=''; }}
      onMouseLeave={() => { isDrawing.current=false; lastCell.current=''; }}
    >
      {grid.map((row, r) => (
        <div key={r} style={{ display:'flex' }}>
          {row.map((cell, c) => (
            <div key={c}
              onMouseDown={e => { e.preventDefault(); isDrawing.current=true; lastCell.current=''; interact(r,c); }}
              onMouseEnter={() => { if(isDrawing.current) interact(r,c); }}
              style={{ width:cellSize, height:cellSize, boxSizing:'border-box', display:'flex', alignItems:'center', justifyContent:'center', fontSize:cellSize>18?cellSize*0.5:0, ...getCellStyle(r,c,cell) }}
            >
              {cellSize>18 && cell===2 && '▶'}
              {cellSize>18 && cell===3 && '◆'}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
