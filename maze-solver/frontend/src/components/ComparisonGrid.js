import React, { useCallback, useRef } from 'react';
import { CELL_WALL, CELL_START, CELL_END } from '../hooks/useGrid';
import { ALGO_COLORS, ALGO_LABELS } from '../hooks/useSolver';

const CELL_SIZE_MAX = 20;
const CELL_SIZE_MIN = 6;

export default function ComparisonGrid({ grid, rows, cols, algo, animState, result }) {
  const cellSize = Math.min(CELL_SIZE_MAX, Math.max(CELL_SIZE_MIN, Math.floor(380 / Math.max(rows, cols))));
  const colors = ALGO_COLORS[algo] || {};

  const visitedSet = new Set((animState?.visited || []).map(([r, c]) => `${r},${c}`));
  const pathSet = new Set((animState?.path || []).map(([r, c]) => `${r},${c}`));
  const phase = animState?.phase || 'idle';

  return (
    <div style={{
      background: '#111118',
      borderRadius: '12px',
      padding: '16px',
      border: `1px solid ${colors.path || '#2a2a3a'}44`,
      boxShadow: `0 0 20px ${colors.path || '#00d4ff'}15`,
      flex: '1 1 340px',
      minWidth: 280,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: colors.path || '#888',
          boxShadow: `0 0 8px ${colors.path || '#888'}`,
        }} />
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.08em', color: colors.path }}>
          {ALGO_LABELS[algo] || algo}
        </span>
        <div style={{
          marginLeft: 'auto',
          fontSize: 11,
          fontFamily: 'Space Mono, monospace',
          color: phase === 'done' ? '#22c55e' : '#888',
          background: phase === 'done' ? '#22c55e15' : '#1a1a25',
          padding: '2px 8px',
          borderRadius: 4,
          border: `1px solid ${phase === 'done' ? '#22c55e33' : '#2a2a3a'}`,
        }}>
          {phase === 'idle' ? 'READY' : phase === 'visiting' ? 'EXPLORING' : phase === 'pathing' ? 'TRACING PATH' : 'DONE'}
        </div>
      </div>

      {/* Mini grid */}
      <div style={{
        display: 'inline-block',
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid #2a2a3a',
      }}>
        {grid.map((row, r) => (
          <div key={r} style={{ display: 'flex' }}>
            {row.map((cell, c) => {
              const key = `${r},${c}`;
              const isPath = pathSet.has(key);
              const isVisited = visitedSet.has(key);

              let bg = '#1a1a25';
              if (cell === CELL_WALL) bg = '#0d0d12';
              else if (cell === CELL_START) bg = '#22c55e';
              else if (cell === CELL_END) bg = '#ef4444';
              else if (isPath) bg = colors.path || '#f59e0b';
              else if (isVisited) bg = colors.visitedDark || 'rgba(30,58,95,0.5)';

              return (
                <div key={c} style={{
                  width: cellSize, height: cellSize,
                  backgroundColor: bg,
                  border: '0.5px solid #1e1e2a',
                  boxSizing: 'border-box',
                  boxShadow: isPath ? `0 0 4px ${colors.path}88` : 'none',
                  transition: 'background-color 0.08s ease',
                }} />
              );
            })}
          </div>
        ))}
      </div>

      {/* Stats */}
      {result && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <StatRow label="Path length" value={result.path_length >= 0 ? result.path_length : 'No path'} color={colors.path} />
          <StatRow label="Nodes explored" value={result.nodes_explored} color={colors.path} />
          <StatRow label="Time" value={`${result.time_ms}ms`} color={colors.path} />
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '4px 8px', background: '#0d0d15', borderRadius: 6,
      border: '1px solid #1e1e2a',
    }}>
      <span style={{ fontSize: 11, color: '#666', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 12, fontFamily: 'Space Mono, monospace', color: '#e8e8f0' }}>{value}</span>
    </div>
  );
}
