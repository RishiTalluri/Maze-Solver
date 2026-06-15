import React from 'react';
import { ALGO_LABELS, ALGO_COLORS } from '../hooks/useSolver';

const ALGOS = ['bfs', 'dfs', 'astar', 'gbfs'];
const ALGO_DESC = {
  bfs: 'Shortest path guaranteed',
  dfs: 'Fast, any valid path',
  astar: 'Optimal heuristic search',
  gbfs: 'Greedy heuristic, fast'
};

const MODES = [
  { key: 'start', label: 'Start', icon: '▶', color: '#22c55e', desc: 'Place start node (1 only)' },
  { key: 'end', label: 'End', icon: '◆', color: '#ef4444', desc: 'Place goal nodes (multiple OK)' },
  { key: 'wall', label: 'Wall', icon: '■', color: '#555', desc: 'Draw walls/obstacles' },
  { key: 'erase', label: 'Erase', icon: '○', color: '#888', desc: 'Erase cells' },
];

export default function ControlsPanel({
  rows, cols, onResizeGrid,
  mode, setMode,
  selectedAlgos, setSelectedAlgos,
  speed, setSpeed,
  onSolve, onReset, onClearPaths, onStop,
  isAnimating, hasResults,
  start, ends,
  comparisonMode, setComparisonMode,
}) {
  const canSolve = start && ends.length > 0 && selectedAlgos.length > 0 && !isAnimating;

  const toggleAlgo = (algo) => {
    setSelectedAlgos(prev =>
      prev.includes(algo) ? prev.filter(a => a !== algo) : [...prev, algo]
    );
  };

  return (
    <div style={{
      background: '#111118',
      borderBottom: '1px solid #2a2a3a',
      padding: '14px 24px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 20,
      alignItems: 'center',
    }}>
      {/* Logo */}
      <div style={{ marginRight: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
          <span style={{ color: '#00d4ff' }}>MAZE</span>
          <span style={{ color: '#e8e8f0' }}>SOLVER</span>
        </div>
        <div style={{ fontSize: 10, color: '#555', fontFamily: 'Space Mono, monospace', letterSpacing: '0.1em' }}>
          PATHFINDING VISUALIZER
        </div>
      </div>

      <Divider />

      {/* Grid size */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Label>GRID</Label>
        <NumberInput
          label="Rows"
          value={rows}
          min={5} max={60}
          onChange={v => onResizeGrid(v, cols)}
        />
        <span style={{ color: '#444', fontSize: 14 }}>×</span>
        <NumberInput
          label="Cols"
          value={cols}
          min={5} max={80}
          onChange={v => onResizeGrid(rows, v)}
        />
      </div>

      <Divider />

      {/* Draw mode */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <Label>DRAW</Label>
        {MODES.map(m => (
          <ModeButton
            key={m.key}
            {...m}
            active={mode === m.key}
            onClick={() => setMode(m.key)}
          />
        ))}
      </div>

      <Divider />

      {/* Algorithm selector */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <Label>ALGO</Label>
        {ALGOS.map(algo => (
          <AlgoButton
            key={algo}
            algo={algo}
            selected={selectedAlgos.includes(algo)}
            onClick={() => toggleAlgo(algo)}
          />
        ))}
      </div>

      <Divider />

      {/* Speed */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Label>SPEED</Label>
        <input
          type="range" min={1} max={100} value={speed}
          onChange={e => setSpeed(Number(e.target.value))}
          style={{
            width: 80,
            accentColor: '#00d4ff',
            cursor: 'pointer',
          }}
        />
        <span style={{ fontSize: 11, fontFamily: 'Space Mono, monospace', color: '#888', minWidth: 28 }}>
          {speed}
        </span>
      </div>

      <Divider />

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
        {isAnimating ? (
          <ActionButton onClick={onStop} color="#ef4444" outline>⏹ Stop</ActionButton>
        ) : (
          <ActionButton onClick={onSolve} color="#00d4ff" disabled={!canSolve}>
            ▶ Solve
          </ActionButton>
        )}
        {hasResults && !isAnimating && (
          <ActionButton onClick={onClearPaths} color="#a855f7" outline>
            ↺ Clear Paths
          </ActionButton>
        )}
        <ActionButton onClick={onReset} color="#555" outline>⊠ Reset</ActionButton>
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 28, background: '#2a2a3a', flexShrink: 0 }} />;
}

function Label({ children }) {
  return (
    <span style={{
      fontSize: 10, fontFamily: 'Space Mono, monospace',
      color: '#555', letterSpacing: '0.12em', marginRight: 2
    }}>
      {children}
    </span>
  );
}

function NumberInput({ label, value, min, max, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 9, color: '#444', fontFamily: 'Space Mono, monospace' }}>{label}</span>
      <input
        type="number" min={min} max={max} value={value}
        onChange={e => {
          const v = Math.min(max, Math.max(min, Number(e.target.value)));
          if (v !== value) onChange(v);
        }}
        style={{
          width: 52, padding: '4px 6px',
          background: '#1a1a25', border: '1px solid #2a2a3a',
          borderRadius: 6, color: '#e8e8f0',
          fontSize: 13, textAlign: 'center',
        }}
      />
    </div>
  );
}

function ModeButton({ key: _k, icon, label, color, active, onClick, desc }) {
  return (
    <button
      title={desc}
      onClick={onClick}
      style={{
        padding: '5px 10px',
        background: active ? `${color}22` : '#1a1a25',
        border: `1px solid ${active ? color : '#2a2a3a'}`,
        borderRadius: 6,
        color: active ? color : '#888',
        fontSize: 12, fontWeight: active ? 700 : 400,
        display: 'flex', alignItems: 'center', gap: 5,
        transition: 'all 0.15s',
        boxShadow: active ? `0 0 8px ${color}44` : 'none',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 10 }}>{icon}</span>
      {label}
    </button>
  );
}

function AlgoButton({ algo, selected, onClick }) {
  const color = ALGO_COLORS[algo]?.path || '#888';
  const label = ALGO_LABELS[algo] || algo;
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px',
        background: selected ? `${color}20` : '#1a1a25',
        border: `1px solid ${selected ? color : '#2a2a3a'}`,
        borderRadius: 6,
        color: selected ? color : '#666',
        fontSize: 12, fontWeight: selected ? 700 : 400,
        transition: 'all 0.15s',
        boxShadow: selected ? `0 0 8px ${color}33` : 'none',
        cursor: 'pointer',
        letterSpacing: '0.05em',
      }}
    >
      {label}
    </button>
  );
}

function ActionButton({ children, onClick, color, disabled, outline }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '7px 14px',
        background: outline ? 'transparent' : disabled ? '#1a1a25' : `${color}22`,
        border: `1px solid ${disabled ? '#2a2a3a' : color}`,
        borderRadius: 7,
        color: disabled ? '#444' : color,
        fontSize: 13, fontWeight: 600,
        transition: 'all 0.15s',
        boxShadow: (!disabled && !outline) ? `0 0 10px ${color}33` : 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: '0.04em',
      }}
    >
      {children}
    </button>
  );
}
