import { useState, useCallback } from 'react';

export const CELL_EMPTY = 0;
export const CELL_WALL = 1;
export const CELL_START = 2;
export const CELL_END = 3;

export function createGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill(CELL_EMPTY));
}

export function useGrid(initialRows = 20, initialCols = 30) {
  const [rows, setRows] = useState(initialRows);
  const [cols, setCols] = useState(initialCols);
  const [grid, setGrid] = useState(() => createGrid(initialRows, initialCols));
  const [start, setStart] = useState(null);
  const [ends, setEnds] = useState([]);

  const resizeGrid = useCallback((newRows, newCols) => {
    setRows(newRows);
    setCols(newCols);
    setGrid(createGrid(newRows, newCols));
    setStart(null);
    setEnds([]);
  }, []);

  const setCellType = useCallback((r, c, mode) => {
    setGrid(prev => {
      const next = prev.map(row => [...row]);
      const current = next[r][c];

      if (mode === 'start') {
        // Clear existing start
        if (start) next[start[0]][start[1]] = CELL_EMPTY;
        next[r][c] = CELL_START;
        setStart([r, c]);
      } else if (mode === 'end') {
        if (current === CELL_END) {
          // Toggle off
          next[r][c] = CELL_EMPTY;
          setEnds(prev => prev.filter(e => !(e[0] === r && e[1] === c)));
        } else {
          next[r][c] = CELL_END;
          setEnds(prev => [...prev.filter(e => !(e[0] === r && e[1] === c)), [r, c]]);
        }
      } else if (mode === 'wall') {
        if (current === CELL_START) { setStart(null); }
        if (current === CELL_END) { setEnds(prev => prev.filter(e => !(e[0] === r && e[1] === c))); }
        next[r][c] = CELL_WALL;
      } else if (mode === 'erase') {
        if (current === CELL_START) setStart(null);
        if (current === CELL_END) setEnds(prev => prev.filter(e => !(e[0] === r && e[1] === c)));
        next[r][c] = CELL_EMPTY;
      }
      return next;
    });
  }, [start]);

  const resetGrid = useCallback(() => {
    setGrid(createGrid(rows, cols));
    setStart(null);
    setEnds([]);
  }, [rows, cols]);

  const clearPaths = useCallback(() => {
    // Keeps walls, start, end — clears visited/path overlays only
    // (overlays are in separate state, so this just signals a reset)
  }, []);

  return { grid, rows, cols, start, ends, setCellType, resizeGrid, resetGrid, clearPaths };
}
