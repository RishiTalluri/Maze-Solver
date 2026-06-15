import React from 'react';
import { ALGO_COLORS, ALGO_LABELS } from '../hooks/useSolver';

export function Legend() {
  const items = [
    { color: '#22c55e', label: 'Start', glow: true },
    { color: '#ef4444', label: 'End', glow: true },
    { color: '#0d0d12', label: 'Wall', border: '#2a2a3a' },
    { color: 'rgba(0, 212, 255, 0.35)', label: 'Visited' },
    { color: '#00d4ff', label: 'Path', glow: true },
  ];

  return (
    <div style={{
      display: 'flex', gap: 16, alignItems: 'center',
      padding: '8px 24px',
      background: '#0d0d15',
      borderTop: '1px solid #1e1e2a',
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 10, color: '#555', fontFamily: 'Space Mono, monospace', letterSpacing: '0.1em' }}>
        LEGEND
      </span>
      {items.map(({ color, label, border, glow }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 14, height: 14, borderRadius: 3,
            background: color,
            border: `1px solid ${border || color}`,
            boxShadow: glow ? `0 0 6px ${color}88` : 'none',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 12, color: '#888' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function StatsPanel({ results, selectedAlgos, isAnimating }) {
  if (!results || Object.keys(results).length === 0) return null;

  return (
    <div style={{
      background: '#111118',
      borderTop: '1px solid #2a2a3a',
      padding: '16px 24px',
    }}>
      <div style={{ fontSize: 11, color: '#555', fontFamily: 'Space Mono, monospace', letterSpacing: '0.1em', marginBottom: 12 }}>
        RESULTS
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {selectedAlgos.map(algo => {
          const r = results[algo];
          if (!r) return null;
          const color = ALGO_COLORS[algo]?.path || '#888';
          const noPath = r.path_length < 0;

          return (
            <div key={algo} style={{
              background: '#0d0d15',
              border: `1px solid ${color}33`,
              borderRadius: 10,
              padding: '12px 16px',
              minWidth: 160,
              boxShadow: `0 0 12px ${color}10`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                <span style={{ fontWeight: 700, fontSize: 13, color, letterSpacing: '0.06em' }}>
                  {ALGO_LABELS[algo]}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Stat label="Path" value={noPath ? '✗ No path' : r.path_length} color={noPath ? '#ef4444' : color} />
                <Stat label="Explored" value={r.nodes_explored} color={color} />
                <Stat label="Time" value={`${r.time_ms}ms`} color={color} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ fontSize: 11, color: '#555' }}>{label}</span>
      <span style={{ fontSize: 12, fontFamily: 'Space Mono, monospace', color: color || '#e8e8f0', fontWeight: 700 }}>
        {value}
      </span>
    </div>
  );
}
