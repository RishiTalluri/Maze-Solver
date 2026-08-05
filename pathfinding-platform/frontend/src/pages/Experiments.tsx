import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { experimentsApi, solveApi } from '../api/experiments';
import { mazesApi } from '../api/mazes';
import { Experiment, MazeSummary, AlgorithmKey, Grid, TerrainGrid, SolveResults, AlgorithmResult } from '../types';
import { Spinner, EmptyState, Modal, SectionHeader } from '../components/ui';
import { ALL_ALGOS, useAlgoMeta } from '../hooks/useSolver';
import { useEditorStore } from '../store/editorStore';
import { ColorsEditor } from '../components/shared/ColorsEditor';

interface AlgoGridProps {
  grid: Grid;
  terrainGrid: TerrainGrid | null;
  result: AlgorithmResult;
  algo: AlgorithmKey;
  speedRef: React.MutableRefObject<number>;
  label: string;
}

const AlgoGrid: React.FC<AlgoGridProps> = ({ grid, terrainGrid, result, algo, speedRef, label }) => {
  const liveAlgoMeta = useAlgoMeta();
  const meta = liveAlgoMeta[algo];
  const { terrainDefs } = useEditorStore();
  const [visitedShown, setVisitedShown] = useState(0);
  const [pathShown, setPathShown]       = useState(0);
  const [phase, setPhase]               = useState<'idle'|'visiting'|'pathing'|'done'>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const terrainColorMap = useRef<Record<string,string>>({});

  useEffect(() => {
    const m: Record<string,string> = {};
    terrainDefs.forEach(t => { m[t.key] = t.color; });
    terrainColorMap.current = m;
  }, [terrainDefs]);

  // Only re-run when result changes — speed is read live from ref, never restarts
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setVisitedShown(0); setPathShown(0); setPhase('idle');

    const scheduleNext = (isPath: boolean, index: number) => {
      const delay = Math.max(6, 110 - speedRef.current);
      const list  = isPath ? result.path : result.visited;
      if (index >= list.length) {
        if (isPath) {
          timers.current.push(setTimeout(() => setPhase('done'), delay + 50));
        } else {
          scheduleNext(true, 0);
        }
        return;
      }
      const t = setTimeout(() => {
        if (isPath) { setPathShown(index + 1); setPhase('pathing'); }
        else        { setVisitedShown(index + 1); setPhase('visiting'); }
        scheduleNext(isPath, index + 1);
      }, delay);
      timers.current.push(t);
    };

    scheduleNext(false, 0);
    return () => timers.current.forEach(clearTimeout);
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = grid.length, cols = grid[0]?.length || 0;
  const cellSize = Math.min(14, Math.max(4, Math.floor(320 / Math.max(rows, cols))));
  const visitedSet = new Set(result.visited.slice(0, visitedShown).map(([r,c]) => `${r},${c}`));
  const pathSet    = new Set(result.path.slice(0, pathShown).map(([r,c]) => `${r},${c}`));

  return (
    <div className="glass rounded-2xl p-4 flex-1 min-w-[280px]">
      <div className="flex items-center gap-2 mb-3">
        <div style={{ width:8,height:8,borderRadius:'50%',background:meta.color,boxShadow:`0 0 8px ${meta.color}` }}/>
        <span style={{ color:meta.color }} className="text-xs font-bold">{label}</span>
        <div className="ml-auto">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
            phase==='done'
              ? (result.success ? 'badge-green' : 'text-red-400 bg-red-500/15 border border-red-500/30')
              : 'badge-gray'
          }`}>
            {phase==='idle'?'READY': phase==='visiting'?'EXPLORING': phase==='pathing'?'TRACING': result.success?'FOUND':'NO PATH'}
          </span>
        </div>
      </div>

      <div className="flex justify-center mb-3">
        <div className="rounded-lg overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.08)' }}>
          {grid.map((row, r) => (
            <div key={r} style={{ display:'flex' }}>
              {row.map((cell, c) => {
                const k = `${r},${c}`;
                let bg = 'rgba(255,255,255,0.025)';
                if      (cell === 1)         bg = '#121212';
                else if (cell === 2)         bg = '#FFD166';
                else if (cell === 3)         bg = '#FF6B35';
                else if (pathSet.has(k))     bg = meta.color;
                else if (visitedSet.has(k))  bg = meta.visitedColor;
                else if (terrainGrid && terrainGrid[r]?.[c] && terrainGrid[r][c] !== 'empty') {
                  bg = terrainColorMap.current[terrainGrid[r][c]] || '#242424';
                }
                return (
                  <div key={c} style={{
                    width: cellSize, height: cellSize, backgroundColor: bg,
                    border: '0.5px solid rgba(255,255,255,0.04)',
                    boxSizing: 'border-box', transition: 'background-color 0.06s',
                  }}/>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {[
          ['Path', result.success ? result.path_length : '—'],
          ['Explored', result.nodes_explored],
          ['Time', `${result.execution_time}ms`],
          ['Cost', result.success ? result.total_cost.toFixed(1) : '—'],
        ].map(([l, v]) => (
          <div key={l as string} className="bg-white/3 rounded-lg px-2 py-1.5">
            <div className="text-[9px] text-surface-500 font-medium">{l}</div>
            <div style={{ color: meta.color }} className="text-xs font-bold font-mono">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ExperimentsPage: React.FC = () => {
  const liveAlgoMeta = useAlgoMeta();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [showColors, setShowColors]   = useState(false);
  const [myMazes, setMyMazes]         = useState<MazeSummary[]>([]);
  const [selectedMaze, setSelectedMaze]   = useState('');
  const [selectedAlgos, setSelectedAlgos] = useState<AlgorithmKey[]>(['bfs', 'astar']);
  const [expName, setExpName]   = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [animSpeed, setAnimSpeed]     = useState(60);
  const speedRef = useRef(60);

  const [activeExp, setActiveExp] = useState<{
    exp: Experiment; grid: Grid;
    terrainGrid: TerrainGrid | null; results: SolveResults;
  } | null>(null);

  const handleSpeedChange = useCallback((v: number) => {
    setAnimSpeed(v); speedRef.current = v;
  }, []);

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
      const mazeRes = await mazesApi.get(selectedMaze);
      setActiveExp({
        exp: res.data.experiment,
        grid: mazeRes.data.grid_data,
        terrainGrid: mazeRes.data.terrain_data || null,
        results: res.data.raw_results,
      });
      setShowCreate(false); setSelectedMaze(''); setSelectedAlgos(['bfs','astar']); setExpName('');
    } catch (e: any) {
      setCreateError(e.response?.data?.error || 'Failed to create experiment');
    } finally { setCreating(false); }
  };

  const handleViewExp = async (exp: Experiment) => {
    try {
      const [, mazeRes] = await Promise.all([experimentsApi.get(exp.id), mazesApi.get(exp.maze_id)]);
      const grid = mazeRes.data.grid_data;
      const terrainGrid = mazeRes.data.terrain_data || null;
      let start: [number,number] = [0,0]; const ends: [number,number][] = [];
      grid.forEach((row: number[], r: number) => row.forEach((cell: number, c: number) => {
        if (cell===2) start=[r,c]; if (cell===3) ends.push([r,c]);
      }));
      const solveRes = await solveApi.solve({ grid, start, goals: ends, algorithms: exp.algorithms, terrain_data: terrainGrid });
      setActiveExp({ exp, grid, terrainGrid, results: solveRes.data });
    } catch (e) { console.error('Failed to load experiment', e); }
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
      <SectionHeader
        title="Experiments"
        subtitle="Run algorithms side-by-side and compare in real time"
        action={
          <div className="flex items-center gap-2">
            <button className="btn-md btn-ghost" onClick={() => setShowColors(true)} title="Edit path, explored, wall & terrain colors">
              🎨 Colors
            </button>
            <button className="btn-md btn-primary" onClick={() => setShowCreate(true)} disabled={myMazes.length === 0}>
              + New Experiment
            </button>
          </div>
        }
      />

      <Modal open={showColors} onClose={() => setShowColors(false)} title="🎨 Colors" maxWidth="max-w-lg">
        <ColorsEditor/>
      </Modal>

      {myMazes.length === 0 && (
        <div className="glass rounded-xl p-4 border border-amber-500/20 bg-amber-500/5">
          <p className="text-sm text-amber-300">
            💡 Save a maze first to run experiments on it.{' '}
            <Link to="/editor" className="underline font-semibold">Create one →</Link>
          </p>
        </div>
      )}

      {/* Live visualization panel */}
      {activeExp && (
        <div className="glass rounded-2xl p-5 border border-white/8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-surface-100">{activeExp.exp.name || 'Experiment Results'}</h3>
              <p className="text-xs text-surface-500 mt-0.5">Adjust speed without restarting the animation</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-surface-500 uppercase tracking-widest font-mono">Speed {animSpeed}</span>
                <input type="range" min={10} max={100} value={animSpeed}
                  onChange={e => handleSpeedChange(+e.target.value)}
                  className="w-24 accent-primary-500 cursor-pointer"/>
              </div>
              <button
                onClick={() => setActiveExp(null)}
                className="text-surface-500 hover:text-surface-200 transition-colors text-xl w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/8">
                ×
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {activeExp.exp.algorithms.map(algo => {
              const result = activeExp.results[algo];
              if (!result) return null;
              return (
                <AlgoGrid
                  key={algo}
                  grid={activeExp.grid}
                  terrainGrid={activeExp.terrainGrid}
                  result={result as AlgorithmResult}
                  algo={algo}
                  speedRef={speedRef}
                  label={liveAlgoMeta[algo].label}
                />
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
                      const meta = liveAlgoMeta[algo];
                      return (
                        <span key={algo}
                          style={{ color:meta.color, background:`${meta.color}15`, borderColor:`${meta.color}30` }}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border">
                          {meta.label}
                        </span>
                      );
                    })}
                    <span className="text-[9px] text-surface-600 font-mono ml-1">
                      {new Date(exp.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${exp.status==='completed' ? 'badge-green' : 'badge-gray'}`}>
                    {exp.status.toUpperCase()}
                  </span>
                  <button onClick={() => handleViewExp(exp)} className="btn-sm btn-accent">▶ View</button>
                  <button onClick={() => handleDelete(exp.id)} title="Delete experiment" className="btn-sm btn-ghost text-red-400 hover:text-red-300">🗑️</button>
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
            <input value={expName} onChange={e => setExpName(e.target.value)}
              placeholder="e.g. BFS vs A* comparison" className="input"/>
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
            <div className="flex flex-wrap gap-1.5 mt-2">
              {ALL_ALGOS.map(algo => {
                const meta = liveAlgoMeta[algo]; const sel = selectedAlgos.includes(algo);
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
          {createError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{createError}</p>
          )}
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
