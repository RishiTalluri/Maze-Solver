import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../api/analytics';
import { mazesApi } from '../api/mazes';
import { solveApi } from '../api/experiments';
import { useAuthStore } from '../store/authStore';
import { DashboardData, MazeSummary, AlgorithmKey, Grid, SolveResults, AlgorithmResult } from '../types';
import { Spinner, EmptyState, Button, StatCard, SectionHeader } from '../components/ui';
import { ALGO_META } from '../hooks/useSolver';

const ALL_ALGOS = Object.keys(ALGO_META) as AlgorithmKey[];

// ── Mini grid display ────────────────────────────────────────────────────────
interface MiniGridProps { grid: Grid; result: AlgorithmResult; algo: AlgorithmKey; speed: number; }
const MiniGrid: React.FC<MiniGridProps> = ({ grid, result, algo, speed }) => {
  const meta = ALGO_META[algo];
  const [visitedShown, setVisitedShown] = useState(0);
  const [pathShown, setPathShown] = useState(0);
  const [done, setDone] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    setVisitedShown(0); setPathShown(0); setDone(false);
    const delay = Math.max(6, 110 - speed);
    result.visited.forEach((_, i) => {
      const t = setTimeout(() => setVisitedShown(i+1), i * delay);
      timers.current.push(t);
    });
    const ps = result.visited.length * delay + 80;
    result.path.forEach((_, i) => {
      const t = setTimeout(() => setPathShown(i+1), ps + i * delay * 0.4);
      timers.current.push(t);
    });
    timers.current.push(setTimeout(() => setDone(true), ps + result.path.length * delay * 0.4 + 150));
    return () => timers.current.forEach(clearTimeout);
  }, [result, speed]);

  const rows = grid.length, cols = grid[0]?.length || 0;
  const cellSize = Math.min(12, Math.max(4, Math.floor(260 / Math.max(rows, cols))));
  const visitedSet = new Set(result.visited.slice(0, visitedShown).map(([r,c]) => `${r},${c}`));
  const pathSet   = new Set(result.path.slice(0, pathShown).map(([r,c]) => `${r},${c}`));

  return (
    <div className="glass rounded-2xl p-4 flex-1 min-w-[220px]">
      <div className="flex items-center gap-2 mb-3">
        <div style={{ width:7,height:7,borderRadius:'50%',background:meta.color,boxShadow:`0 0 6px ${meta.color}` }}/>
        <span style={{ color:meta.color }} className="text-xs font-bold">{meta.label}</span>
        {done && (
          <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${result.success ? 'badge-green' : 'text-red-400 bg-red-500/15 border border-red-500/20'}`}>
            {result.success ? `${result.path_length} steps` : 'NO PATH'}
          </span>
        )}
      </div>
      <div className="flex justify-center mb-3">
        <div className="rounded-lg overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
          {grid.map((row, r) => (
            <div key={r} style={{ display:'flex' }}>
              {row.map((cell, c) => {
                const k=`${r},${c}`;
                let bg='rgba(255,255,255,0.025)';
                if (cell===1) bg='#0d1829';
                else if (cell===2) bg='#10B981';
                else if (cell===3) bg='#EA580C';
                else if (pathSet.has(k)) bg=meta.color;
                else if (visitedSet.has(k)) bg=meta.visitedColor;
                return <div key={c} style={{ width:cellSize,height:cellSize,backgroundColor:bg,border:'0.5px solid rgba(255,255,255,0.03)',boxSizing:'border-box',transition:'background-color 0.06s' }}/>;
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {[['Explored', result.nodes_explored],['Time', `${result.execution_time}ms`]].map(([l,v]) => (
          <div key={l as string} className="bg-white/3 rounded-lg px-2 py-1">
            <div className="text-[9px] text-surface-500">{l}</div>
            <div style={{ color:meta.color }} className="text-[10px] font-bold font-mono">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Compare section ───────────────────────────────────────────────────────────
const CompareSection: React.FC<{ mazes: MazeSummary[] }> = ({ mazes }) => {
  const [selectedMaze, setSelectedMaze] = useState('');
  const [selectedAlgos, setSelectedAlgos] = useState<AlgorithmKey[]>(['bfs','astar','dijkstra']);
  const [speed, setSpeed] = useState(65);
  const [results, setResults] = useState<SolveResults | null>(null);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const handleCompare = async () => {
    if (!selectedMaze || selectedAlgos.length < 2) { setError('Pick a maze and at least 2 algorithms'); return; }
    setError(''); setRunning(true); setResults(null);
    try {
      const mazeRes = await mazesApi.get(selectedMaze);
      const g = mazeRes.data.grid_data;
      let start: [number,number]=[0,0]; const ends: [number,number][]=[];
      g.forEach((row: number[],r: number) => row.forEach((cell: number,c: number) => {
        if(cell===2) start=[r,c]; if(cell===3) ends.push([r,c]);
      }));
      const solveRes = await solveApi.solve({ grid:g, start, goals:ends, algorithms:selectedAlgos });
      setGrid(g); setResults(solveRes.data);
    } catch(e: any) { setError(e.response?.data?.error || 'Compare failed'); }
    finally { setRunning(false); }
  };

  const toggleAlgo = (a: AlgorithmKey) =>
    setSelectedAlgos(p => p.includes(a) ? p.filter(x=>x!==a) : [...p,a]);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="dot-orange"/>
        <h3 className="text-sm font-bold text-surface-100">Algorithm Comparison</h3>
        <span className="badge-gray text-[9px] ml-1">Side by Side</span>
      </div>

      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div className="flex-1 min-w-40">
          <label className="label">Maze</label>
          <select value={selectedMaze} onChange={e=>setSelectedMaze(e.target.value)} className="input">
            <option value="">Choose maze...</option>
            {mazes.map(m=><option key={m.id} value={m.id}>{m.name} ({m.rows}×{m.cols})</option>)}
          </select>
        </div>
        <div>
          <label className="label">Algorithms</label>
          <div className="flex gap-1 flex-wrap">
            {ALL_ALGOS.map(algo=>{
              const meta=ALGO_META[algo]; const sel=selectedAlgos.includes(algo);
              return (
                <button key={algo} onClick={()=>toggleAlgo(algo)}
                  style={sel?{color:meta.color,borderColor:`${meta.color}50`,background:`${meta.color}15`}:{}}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all ${sel?'':'border-white/8 text-surface-500 hover:text-surface-300 hover:bg-white/5'}`}>
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="label whitespace-nowrap">Speed {speed}</label>
          <input type="range" min={10} max={100} value={speed} onChange={e=>setSpeed(+e.target.value)} className="w-20 accent-primary-500"/>
        </div>
        <button onClick={handleCompare} disabled={running}
          className="btn-md btn-primary whitespace-nowrap">
          {running ? '⏳ Running...' : '▶ Compare'}
        </button>
      </div>

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      {results && grid && (
        <div className="flex flex-wrap gap-3">
          {selectedAlgos.map(algo=>{
            const r=results[algo];
            if(!r) return null;
            return <MiniGrid key={algo} grid={grid} result={r as AlgorithmResult} algo={algo} speed={speed}/>;
          })}
        </div>
      )}
    </div>
  );
};

// ── Dashboard page ────────────────────────────────────────────────────────────
export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [mazes, setMazes] = useState<MazeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsApi.getDashboard(), mazesApi.getMine(1)])
      .then(([d,m]) => { setData(d.data); setMazes(m.data.items.slice(0,9)); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg"/></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <SectionHeader
        title={`Hey, ${user?.username} 👋`}
        subtitle="Your pathfinding activity at a glance"
        action={<Link to="/editor"><button className="btn-md btn-primary">+ New Maze</button></Link>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Mazes"       value={data?.summary.total_mazes ?? 0}       icon="🧩" color="#EA580C"/>
        <StatCard label="Experiments" value={data?.summary.total_experiments ?? 0}  icon="🧪" color="#10B981"/>
        <StatCard label="Algo Runs"   value={data?.summary.total_runs ?? 0}         icon="⚡" color="#63b3ed"/>
        <StatCard label="Success Rate" value={`${data?.summary.success_rate ?? 0}%`} icon="✅" color="#a855f7"/>
      </div>

      {/* Compare section */}
      {mazes.length > 0 && <CompareSection mazes={mazes}/>}

      {/* Averages + usage */}
      {data?.averages && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-5">
            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-4">Performance Averages</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label:'Avg Time', value:`${data.averages.execution_time}ms`, color:'#EA580C' },
                { label:'Avg Explored', value:data.averages.nodes_explored.toFixed(0), color:'#10B981' },
                { label:'Avg Path', value:data.averages.path_length.toFixed(0), color:'#63b3ed' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center p-3 rounded-xl" style={{ background:`${color}08`, border:`1px solid ${color}20` }}>
                  <div className="text-xl font-black font-mono" style={{ color }}>{value}</div>
                  <div className="text-[9px] text-surface-500 mt-1 font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {data.algorithm_usage.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-4">Algorithm Usage</p>
              <div className="space-y-2.5">
                {data.algorithm_usage.map(({ algorithm, count }) => {
                  const meta = ALGO_META[algorithm as keyof typeof ALGO_META];
                  const max = data.algorithm_usage[0]?.count || 1;
                  return (
                    <div key={algorithm} className="flex items-center gap-2.5">
                      <span className="text-xs font-semibold text-surface-300 w-20 shrink-0">{meta?.label || algorithm}</span>
                      <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width:`${(count/max)*100}%`, background: meta?.color || '#EA580C', transition:'width 0.8s ease' }}/>
                      </div>
                      <span className="text-xs font-mono text-surface-500 w-5 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent mazes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">Recent Mazes</p>
          <Link to="/mazes/mine" className="text-xs text-primary-400 hover:text-primary-300 font-semibold transition-colors">View all →</Link>
        </div>
        {mazes.length === 0 ? (
          <EmptyState icon="🧩" title="No mazes yet" description="Create your first maze in the editor"/>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {mazes.map(maze => (
              <Link key={maze.id} to={`/editor/${maze.id}`}>
                <div className="glass rounded-xl p-4 hover:bg-white/6 transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-surface-100 group-hover:text-white transition-colors truncate">{maze.name}</h3>
                    {maze.is_public && <span className="badge-green text-[9px] ml-2 shrink-0">PUB</span>}
                  </div>
                  <div className="text-xs text-surface-500 font-mono">{maze.rows}×{maze.cols}</div>
                  <div className="text-[10px] text-surface-600 mt-0.5">{new Date(maze.updated_at).toLocaleDateString()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
