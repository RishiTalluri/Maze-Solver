import React, { useCallback, useRef, useState } from 'react';
import { CELL_WALL, CELL_START, CELL_END } from '../hooks/useGrid';
import { ALGO_COLORS } from '../hooks/useSolver';

const CELL_SIZE_MAX = 32;
const CELL_SIZE_MIN = 8;

function getCellColor(cellType, isVisited, isPath, algoColors) {
  if (isPath) return algoColors?.path || '#f59e0b';
  if (isVisited) return algoColors?.visited || 'rgba(30, 58, 95, 0.8)';
  if (cellType === CELL_START) return '#22c55e';
  if (cellType === CELL_END) return '#ef4444';
  if (cellType === CELL_WALL) return '#0d0d12';
  return '#1a1a25';
}

function getCellBorder(cellType) {
  if (cellType === CELL_START) return '1px solid #4ade80';
  if (cellType === CELL_END) return '1px solid #f87171';
  if (cellType === CELL_WALL) return '1px solid #0a0a0f';
  return '1px solid #1e1e2a';
}

function getCellGlow(cellType, isPath, algoColors) {
  if (isPath) return `0 0 6px ${algoColors?.path || '#f59e0b'}88`;
  if (cellType === CELL_START) return '0 0 8px #22c55e88';
  if (cellType === CELL_END) return '0 0 8px #ef444488';
  return 'none';
}

export default function MazeGrid({
  grid, rows, cols,
  mode, onCellInteract,
  animStates, // { [algo]: { visited: [], path: [] } } — may have multiple algos
  singleAlgo, // if comparison mode is off, the selected single algo key
  comparisonMode,
  disabled
}) {
  const isDrawing = useRef(false);
  const lastCell = useRef(null);
  const containerRef = useRef(null);

  const cellSize = Math.min(CELL_SIZE_MAX, Math.max(CELL_SIZE_MIN, Math.floor(700 / Math.max(rows, cols))));

  // Build visited/path sets per algo
  const algoData = {};
  Object.entries(animStates || {}).forEach(([algo, state]) => {
    const visitedSet = new Set(state.visited.map(([r, c]) => `${r},${c}`));
    const pathSet = new Set(state.path.map(([r, c]) => `${r},${c}`));
    algoData[algo] = { visitedSet, pathSet };
  });

  const algos = Object.keys(algoData);

  const handleCellInteract = useCallback((r, c) => {
    if (disabled) return;
    const key = `${r},${c}`;
    if (lastCell.current === key) return;
    lastCell.current = key;
    onCellInteract(r, c);
  }, [disabled, onCellInteract]);

  const handleMouseDown = useCallback((r, c) => (e) => {
    e.preventDefault();
    isDrawing.current = true;
    lastCell.current = null;
    handleCellInteract(r, c);
  }, [handleCellInteract]);

  const handleMouseEnter = useCallback((r, c) => () => {
    if (isDrawing.current) handleCellInteract(r, c);
  }, [handleCellInteract]);

  const handleMouseUp = useCallback(() => {
    isDrawing.current = false;
    lastCell.current = null;
  }, []);

  // For comparison mode — show all algos stacked; use first algo's colors for each cell
  const getCellAlgoInfo = (r, c) => {
    const key = `${r},${c}`;
    for (const algo of algos) {
      if (algoData[algo].pathSet.has(key)) {
        return { isPath: true, isVisited: false, colors: ALGO_COLORS[algo] };
      }
    }
    for (const algo of algos) {
      if (algoData[algo].visitedSet.has(key)) {
        return { isPath: false, isVisited: true, colors: ALGO_COLORS[algo] };
      }
    }
    return { isPath: false, isVisited: false, colors: null };
  };

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        display: 'inline-block',
        userSelect: 'none',
        cursor: disabled ? 'not-allowed' : 'crosshair',
        borderRadius: '6px',
        overflow: 'hidden',
        border: '1px solid #2a2a3a',
        boxShadow: '0 0 40px rgba(0,0,0,0.5)',
      }}
    >
      {grid.map((row, r) => (
        <div key={r} style={{ display: 'flex' }}>
          {row.map((cell, c) => {
            const { isPath, isVisited, colors } = getCellAlgoInfo(r, c);
            const bg = getCellColor(cell, isVisited, isPath, colors);
            const border = getCellBorder(cell);
            const glow = getCellGlow(cell, isPath, colors);
            const isSpecial = cell === CELL_START || cell === CELL_END;

            return (
              <div
                key={c}
                onMouseDown={handleMouseDown(r, c)}
                onMouseEnter={handleMouseEnter(r, c)}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: bg,
                  border,
                  boxSizing: 'border-box',
                  boxShadow: glow,
                  transition: isSpecial ? 'none' : 'background-color 0.12s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: cellSize > 16 ? Math.floor(cellSize * 0.55) : 0,
                  lineHeight: 1,
                }}
              >
                {cellSize > 16 && cell === CELL_START && '▶'}
                {cellSize > 16 && cell === CELL_END && '◆'}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
