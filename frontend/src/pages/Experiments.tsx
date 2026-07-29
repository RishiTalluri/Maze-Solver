import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { experimentsApi, solveApi } from '../api/experiments';
import { mazesApi } from '../api/mazes';
import { Experiment, MazeSummary, AlgorithmKey, Grid, SolveResults, AlgorithmResult } from '../types';
import { Spinner, EmptyState, Button, Modal, SectionHeader } from '../components/ui';
import { ALGO_META } from '../hooks/useSolver';

const ALL_ALGOS = Object.keys(ALGO_META) as AlgorithmKey[];

// ── Mini animated grid for one algorithm ──────────────────────────────────────
interface AlgoGridProps { grid: Grid; result: AlgorithmResult; algo: AlgorithmKey; speed: number; label: string; }

const AlgoGrid: React.FC<AlgoGridProps> = ({ grid, result, algo, speed, label }) => {
  const meta = ALGO_META[algo];
  const [visitedShown, setVisitedShown] = useState(0);
  const [pathShown, setPathShown] = useState(0);
  const [phase, setPhase] = useState<'idle'|'visiting'|'pathing'|'done'>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setVisitedShown(0); setPathShown(0); setPhase('idle');

    const delay = Math.max(8, 110 - speed);
    result.visited.forEach((_, i) => {
      const t = setTimeout(() => { setVisitedShown(i+1); setPhase('visiting'); }, i * delay);
      timers.current.push(t);
    });
    const pathStart = result.visited.length * delay + 100;
    result.path.forEach((_, i) => {
      const t = setTimeout(() => { setPathShown(i+1); setPhase('pathing'); }, pathStart + i * delay * 0.5);
      timers.current.push(t);
    });
    const doneAt = pathStart + result.path.length * delay * 0.5 + 200;
    timers.current.push(setTimeout(() => setPhase('done'), doneAt));
    return () => timers.current.forEach(clearTimeout);
  }, [result, speed]);

  const rows = grid.length, cols = grid[0]?.length || 0;
  const cellSize = Math.min(14, Math.max(4, Math.floor(320 / Math.max(rows, cols))));
  const visitedSet = new Set(result.visited.slice(0, visitedShown).map(([r,c]) => `${r},${c}`));
  const pathSet   = new Set(result.path.slice(0, pathShown).map(([r,c]) => `${r},${c}`));

  return (
    <div className="glass rounded-2xl p-4 flex-1 min-w-[280px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div style={{ width:8, height:8, borderRadius:'50%', background: meta.color, boxShadow:`0 0 8px ${meta.color}` }}/>
        <span style={{ color: meta.color }} className="text-xs font-bold">{label}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
            phase==='done' ? (result.success ? 'badge-green' : 'text-red-400 bg-red-500/15 border border-red-500/30')
            : 'badge-gray'
          }`}>
            {phase==='idle'?'READY': phase==='visiting'?'EXPLORING': phase==='pathing'?'TRACING': result.success?'FOUND':'NO PATH'}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex justify-center mb-3">
        <div className="rounded-lg overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.08)' }}>
          {grid.map((row, r) => (
            <div key={r} style={{ display:'flex' }}>
              {row.map((cell, c) => {
                const k = `${r},${c}`;
                let bg = 'rgba(255,255,255,0.03)';
                if (cell===1) bg = '#0d1829';
                else if (cell===2) bg = '#10B981';
                else if (cell===3) bg = '#EA580C';
                else if (pathSet.has(k)) bg = meta.color;
                else if (visitedSet.has(k)) bg = meta.visitedColor;
                return <div key={c} style={{ width:cellSize, height:cellSize, backgroundColor:bg, border:'0.5px solid rgba(255,255,255,0.04)', boxSizing:'border-box', transition:'background-color 0.06s' }}/>;
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-1.5">
        {[
          ['Path', result.success ? result.path_length : '—'],
          ['Explored', result.nodes_explored],
          ['Time', `${result.execution_time}ms`],
          ['Cost', result.success ? result.total_cost.toFixed(1) : '—'],
        ].map(([label, value]) => (
          <div key={label as string} className="bg-white/3 rounded-lg px-2 py-1.5">
            <div className="text-[9px] text-surface-500 font-medium">{label}</div>
            <div style={{ color: meta.color }} className="text-xs font-bold font-mono">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main experiments page ─────────────────────────────────────────────────────
export const ExperimentsPage: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [myMazes, setMyMazes] = useState<MazeSummary[]>([]);
  const [selectedMaze, setSelectedMaze] = useState('');
  const [selectedAlgos, setSelectedAlgos] = useState<AlgorithmKey[]>(['bfs', 'astar']);
  const [expName, setExpName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [activeExp, setActiveExp] = useState<{ exp: Experiment; grid: Grid; results: SolveResults } | null>(null);
  const [animSpeed, setAnimSpeed] = useState(60);

  useEffect(() => {
    Promise.all([experimentsApi.list(), mazesApi.getMine()])
      .then(([e, m]) => { setExperiments(e.data.items); setMyMazes(m.data.items); })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!selectedMaze || selectedAlgos.length < 2) { setCreateError('Select a maze and at least 2 algorithms'); return; }
    setCreating(true); setCreateError('');
    try {
      const res = await experimentsApi.create(selectedMaze, selectedAlgos, expName || undefined);
      setExperiments(prev => [res.data.experiment, ...prev]);

      // Load the maze grid for visualization
      const mazeRes = await mazesApi.get(selectedMaze);
      setActiveExp({ exp: res.data.experiment, grid: mazeRes.data.grid_data, results: res.data.raw_results });
      setShowCreate(false); setSelectedMaze(''); setSelectedAlgos(['bfs','astar']); setExpName('');
    } catch (e: any) {
      setCreateError(e.response?.data?.error || 'Failed to create experiment');
    } finally { setCreating(false); }
  };

  const handleViewExp = async (exp: Experiment) => {
    try {
      const [, mazeRes] = await Promise.all([
        experimentsApi.get(exp.id),
        mazesApi.get(exp.maze_id),
      ]);
      // Re-run algorithms to get visualization data
      const grid = mazeRes.data.grid_data;
      let start: [number,number] = [0,0];
      const ends: [number,number][] = [];
      grid.forEach((row: number[], r: number) => row.forEach((cell: number, c: number) => {
        if (cell===2) start=[r,c]; if (cell===3) ends.push([r,c]);
      }));
      const solveRes = await solveApi.solve({ grid, start, goals: ends, algorithms: exp.algorithms });
      setActiveExp({ exp, grid, results: solveRes.data });
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this experiment?')) return;
    await experimentsApi.delete(id);
    setExperiments(prev => prev.filter(e => e.id !== id));
    if (activeExp?.exp.id === id) setActiveExp(null);
  };

  const toggleAlgo = (algo: AlgorithmKey) =>
    setSelectedAlgos(prev => prev.includes(algo) ? prev.filter(a=>a!==algo) : [...prev, algo]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg"/></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <SectionHeader title="Experiments" subtitle="Run algorithms side-by-side and compare in real time"
        action={<Button variant="primary" onClick={() => setShowCreate(true)} disabled={myMazes.length === 0}>+ New Experiment</Button>}/>

      {myMazes.length === 0 && (
        <div className="glass rounded-xl p-4 border border-amber-500/20 bg-amber-500/5">
          <p className="text-sm text-amber-300">💡 Save a maze first to run experiments on it.{' '}
            <Link to="/editor" className="underline">Create one →</Link></p>
        </div>
      )}

      {/* Live visualization panel */}
      {activeExp && (
        <div className="glass rounded-2xl p-5 border border-white/8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-surface-100">{activeExp.exp.name || 'Experiment Results'}</h3>
              <p className="text-xs text-surface-500 mt-0.5">Side-by-side algorithm comparison</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-surface-500 uppercase tracking-widest">Anim Speed</span>
                <input type="range" min={10} max={100} value={animSpeed} onChange={e => setAnimSpeed(+e.target.value)}
                  className="w-20 accent-primary-500 cursor-pointer"/>
              </div>
              <button onClick={() => setActiveExp(null)} className="text-surface-500 hover:text-surface-200 transition-colors text-lg">×</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {activeExp.exp.algorithms.map(algo => {
              const result = activeExp.results[algo];
              if (!result || !result.success === undefined) return null;
              return (
                <AlgoGrid key={algo} grid={activeExp.grid} result={result as AlgorithmResult}
                  algo={algo} speed={animSpeed} label={ALGO_META[algo].label}/>
              );
            })}
          </div>
        </div>
      )}

      {/* Experiments list */}
      {experiments.length === 0 ? (
        <EmptyState icon="🧪" title="No experiments yet" description="Create an experiment to see algorithms compete side-by-side"/>
      ) : (
        <div className="space-y-2">
          {experiments.map(exp => (
            <div key={exp.id} className="glass rounded-xl px-4 py-3 hover:bg-white/5 transition-all">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-surface-100">{exp.name || 'Untitled Experiment'}</span>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {exp.algorithms.map(algo => {
                      const meta = ALGO_META[algo];
                      return <span key={algo} style={{ color:meta.color, background:`${meta.color}15`, borderColor:`${meta.color}30` }}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border">{meta.label}</span>;
                    })}
                    <span className="text-[9px] text-surface-600 font-mono">{new Date(exp.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${exp.status==='completed' ? 'badge-green' : 'badge-gray'}`}>
                    {exp.status.toUpperCase()}
                  </span>
                  <button onClick={() => handleViewExp(exp)}
                    className="btn-sm btn-accent">▶ View</button>
                  <button onClick={() => handleDelete(exp.id)}
                    className="btn-sm btn-ghost text-red-400 hover:text-red-300">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="🧪 New Experiment" maxWidth="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="label">Experiment Name (optional)</label>
            <input value={expName} onChange={e => setExpName(e.target.value)} placeholder="e.g. BFS vs A* on large maze" className="input"/>
          </div>
          <div>
            <label className="label">Select Maze</label>
            <select value={selectedMaze} onChange={e => setSelectedMaze(e.target.value)} className="input">
              <option value="">Choose a maze...</option>
              {myMazes.map(m => <option key={m.id} value={m.id}>{m.name} ({m.rows}×{m.cols})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Algorithms — select 2 or more</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {ALL_ALGOS.map(algo => {
                const meta = ALGO_META[algo];
                const sel = selectedAlgos.includes(algo);
                return (
                  <button key={algo} onClick={() => toggleAlgo(algo)}
                    style={sel ? { color:meta.color, borderColor:`${meta.color}50`, background:`${meta.color}15` } : {}}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-all ${sel ? '' : 'border-white/8 text-surface-400 hover:text-surface-200 hover:bg-white/5'}`}>
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
          {createError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{createError}</p>}
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={creating} className="flex-1 btn-md btn-primary">
              {creating ? '⏳ Running...' : '▶ Run Experiment'}
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-md btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
