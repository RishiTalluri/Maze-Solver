import React, { useState, useCallback } from 'react';
import { useGrid } from './hooks/useGrid';
import { useSolver, ALGO_COLORS } from './hooks/useSolver';
import MazeGrid from './components/MazeGrid';
import ComparisonGrid from './components/ComparisonGrid';
import ControlsPanel from './components/ControlsPanel';
import { Legend, StatsPanel } from './components/StatsPanel';

export default function App() {
  const [mode, setMode] = useState('wall');
  const [selectedAlgos, setSelectedAlgos] = useState(['bfs']);
  const [speed, setSpeed] = useState(60);
  const [comparisonMode, setComparisonMode] = useState(false);

  const { grid, rows, cols, start, ends, setCellType, resizeGrid, resetGrid } = useGrid(20, 30);
  const { results, animState, isAnimating, error, solve, stopAnimation, clearResults } = useSolver();

  const handleCellInteract = useCallback((r, c) => {
    if (isAnimating) return;
    setCellType(r, c, mode);
  }, [mode, setCellType, isAnimating]);

  const handleSolve = useCallback(() => {
    if (!start || ends.length === 0 || selectedAlgos.length === 0) return;
    // Comparison mode if multiple algos selected
    setComparisonMode(selectedAlgos.length > 1);
    solve(grid, start, ends, selectedAlgos, speed);
  }, [grid, start, ends, selectedAlgos, speed, solve]);

  const handleReset = useCallback(() => {
    stopAnimation();
    clearResults();
    resetGrid();
  }, [stopAnimation, clearResults, resetGrid]);

  const handleClearPaths = useCallback(() => {
    stopAnimation();
    clearResults();
  }, [stopAnimation, clearResults]);

  const handleResizeGrid = useCallback((r, c) => {
    stopAnimation();
    clearResults();
    resizeGrid(r, c);
  }, [resizeGrid, stopAnimation, clearResults]);

  const isComparison = selectedAlgos.length > 1 && Object.keys(results).length > 0;

  // Combine animStates for the main grid (show first algo in single mode)
  const mainAlgo = !isComparison && selectedAlgos[0];
  const mainAnimStates = mainAlgo && animState[mainAlgo]
    ? { [mainAlgo]: animState[mainAlgo] }
    : {};

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
    }}>
      <ControlsPanel
        rows={rows} cols={cols} onResizeGrid={handleResizeGrid}
        mode={mode} setMode={setMode}
        selectedAlgos={selectedAlgos} setSelectedAlgos={setSelectedAlgos}
        speed={speed} setSpeed={setSpeed}
        onSolve={handleSolve} onReset={handleReset}
        onClearPaths={handleClearPaths} onStop={stopAnimation}
        isAnimating={isAnimating}
        hasResults={Object.keys(results).length > 0}
        start={start} ends={ends}
        comparisonMode={comparisonMode} setComparisonMode={setComparisonMode}
      />

      {/* Status bar */}
      <div style={{
        background: '#0d0d12',
        padding: '6px 24px',
        display: 'flex',
        gap: 20,
        alignItems: 'center',
        borderBottom: '1px solid #1e1e2a',
        fontSize: 11,
        fontFamily: 'Space Mono, monospace',
        color: '#555',
        flexWrap: 'wrap',
      }}>
        <StatusDot active={!!start} color="#22c55e">
          {start ? `Start: (${start[0]},${start[1]})` : 'No start node'}
        </StatusDot>
        <StatusDot active={ends.length > 0} color="#ef4444">
          {ends.length > 0 ? `${ends.length} goal${ends.length > 1 ? 's' : ''}` : 'No goal nodes'}
        </StatusDot>
        <StatusDot active={selectedAlgos.length > 0} color="#00d4ff">
          {selectedAlgos.length > 0 ? selectedAlgos.map(a => a.toUpperCase()).join(' + ') : 'No algorithm'}
        </StatusDot>
        {isAnimating && (
          <span style={{ color: '#f59e0b', animation: 'pulse 1s infinite' }}>
            ◉ ANIMATING...
          </span>
        )}
        {error && <span style={{ color: '#ef4444' }}>✗ {error}</span>}
        {!start || ends.length === 0 ? (
          <span style={{ color: '#555', marginLeft: 'auto' }}>
            {!start ? '← Place a start node' : '← Place at least one goal'}
          </span>
        ) : null}
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px',
        gap: 24,
        overflowY: 'auto',
      }}>
        {/* Primary grid */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}>
          <MazeGrid
            grid={grid}
            rows={rows}
            cols={cols}
            mode={mode}
            onCellInteract={handleCellInteract}
            animStates={isComparison ? {} : mainAnimStates}
            singleAlgo={mainAlgo}
            comparisonMode={isComparison}
            disabled={isAnimating}
          />
        </div>

        {/* Comparison panels */}
        {isComparison && (
          <div style={{ width: '100%' }}>
            <div style={{
              fontSize: 11, fontFamily: 'Space Mono, monospace',
              color: '#555', letterSpacing: '0.1em', marginBottom: 16,
              textAlign: 'center',
            }}>
              ALGORITHM COMPARISON
            </div>
            <div style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              {selectedAlgos.map(algo => (
                <ComparisonGrid
                  key={algo}
                  grid={grid}
                  rows={rows}
                  cols={cols}
                  algo={algo}
                  animState={animState[algo]}
                  result={results[algo]}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Legend />
      <StatsPanel results={results} selectedAlgos={selectedAlgos} isAnimating={isAnimating} />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function StatusDot({ active, color, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: active ? color : '#333',
        boxShadow: active ? `0 0 5px ${color}` : 'none',
        transition: 'all 0.3s',
      }} />
      <span style={{ color: active ? '#888' : '#444' }}>{children}</span>
    </div>
  );
}
