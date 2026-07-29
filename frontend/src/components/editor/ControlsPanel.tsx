import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { ALGO_META } from '../../hooks/useSolver';
import { AlgorithmKey, DrawMode } from '../../types';
import { Modal, Input } from '../ui';
import { generateMaze } from '../../utils/mazeGenerator';

const DRAW_MODES: { key: DrawMode; icon: string; label: string; color: string }[] = [
  { key: 'start',   icon: '▶', label: 'Start',   color: '#10B981' },
  { key: 'end',     icon: '◆', label: 'End',     color: '#EA580C' },
  { key: 'wall',    icon: '■', label: 'Wall',    color: '#94a3b8' },
  { key: 'erase',   icon: '○', label: 'Erase',   color: '#64748b' },
  { key: 'terrain', icon: '◈', label: 'Terrain', color: '#f59e0b' },
];

const ALL_ALGOS = Object.keys(ALGO_META) as AlgorithmKey[];

interface Props {
  onSolve: () => void;
  onStop: () => void;
  onSave?: () => void;
  isSolving: boolean;
  hasResults: boolean;
  error?: string | null;
}

export const ControlsPanel: React.FC<Props> = ({ onSolve, onStop, onSave, isSolving, hasResults, error }) => {
  const {
    rows, cols, setSize,
    drawMode, setDrawMode,
    selectedAlgos, setSelectedAlgos,
    speed, setSpeed,
    showTerrain, setShowTerrain,
    selectedTerrain, setSelectedTerrain,
    terrainDefs, updateTerrainCost, addCustomTerrain, removeCustomTerrain, updateTerrainColor,
    resetGrid, clearPaths, start, ends,
  } = useEditorStore();

  const [showTerrainEditor, setShowTerrainEditor] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [genAlgo, setGenAlgo] = useState<'recursive_backtracker'|'random_walls'>('recursive_backtracker');
  const [genTerrain, setGenTerrain] = useState(false);
  const [wallDensity, setWallDensity] = useState(30);
  const [terrainProbs, setTerrainProbs] = useState<Record<string,number>>(() => {
    const p: Record<string,number> = {};
    terrainDefs.forEach(t => { p[t.key] = 15; });
    return p;
  });
  const [newTerrain, setNewTerrain] = useState({ label: '', icon: '🟫', cost: '2', color: '#7c5235' });
  const [newTerrainError, setNewTerrainError] = useState('');

  const canSolve = !!start && ends.length > 0 && selectedAlgos.length > 0 && !isSolving;

  const toggleAlgo = (algo: AlgorithmKey) =>
    setSelectedAlgos(selectedAlgos.includes(algo) ? selectedAlgos.filter(a=>a!==algo) : [...selectedAlgos, algo]);

  const handleGenerate = () => {
    const { grid, terrainGrid, start: s, ends: e } = generateMaze({
      rows, cols, terrainEnabled: genTerrain, terrainDefs,
      terrainProbabilities: terrainProbs, wallDensity, algorithm: genAlgo,
    });
    clearPaths();
    useEditorStore.setState({ grid, terrainGrid, start: s, ends: e, animStates: {}, results: {} });
    if (genTerrain) setShowTerrain(true);
    setShowGenerator(false);
  };

  const handleAddCustomTerrain = () => {
    setNewTerrainError('');
    if (!newTerrain.label.trim()) { setNewTerrainError('Name required'); return; }
    const key = newTerrain.label.toLowerCase().replace(/\s+/g,'_');
    if (terrainDefs.find(t => t.key === key)) { setNewTerrainError('Already exists'); return; }
    const cost = parseInt(newTerrain.cost);
    if (isNaN(cost) || cost < 1) { setNewTerrainError('Cost must be ≥ 1'); return; }
    addCustomTerrain({ key, label: newTerrain.label.trim(), icon: newTerrain.icon, cost, color: newTerrain.color, isCustom: true });
    setNewTerrain({ label:'', icon:'🟫', cost:'2', color:'#7c5235' });
  };

  return (
    <>
      {/* ── Main toolbar ─────────────────────────────────────────────────────── */}
      <div className="bg-surface-900/90 backdrop-blur border-b border-white/6 px-3 py-1.5">
        <div className="flex items-center gap-2 flex-wrap">

          {/* Grid size */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-surface-500 uppercase tracking-widest hidden sm:block">Grid</span>
            <input type="number" min={5} max={60} value={rows}
              onChange={e => setSize(Math.min(60,Math.max(5,+e.target.value)), cols)}
              className="w-10 text-center text-xs input !py-1 !px-1.5 !rounded-lg"/>
            <span className="text-surface-600 text-xs">×</span>
            <input type="number" min={5} max={80} value={cols}
              onChange={e => setSize(rows, Math.min(80,Math.max(5,+e.target.value)))}
              className="w-10 text-center text-xs input !py-1 !px-1.5 !rounded-lg"/>
          </div>

          <div className="divider h-5"/>

          {/* Draw modes */}
          <div className="flex items-center gap-1">
            {DRAW_MODES.map(m => (
              <button key={m.key} onClick={() => setDrawMode(m.key)}
                style={drawMode === m.key ? { color: m.color, borderColor: m.color, background: `${m.color}18` } : {}}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg border transition-all
                  ${drawMode === m.key ? '' : 'border-transparent text-surface-500 hover:text-surface-300 hover:bg-white/5'}`}>
                <span>{m.icon}</span>
                <span className="hidden sm:block">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Terrain strip - only when terrain draw mode */}
          {drawMode === 'terrain' && (
            <>
              <div className="divider h-5"/>
              <div className="flex items-center gap-1 flex-wrap">
                {terrainDefs.map(t => (
                  <button key={t.key} onClick={() => setSelectedTerrain(t.key)}
                    title={`${t.label} — cost ${t.cost}`}
                    className={`flex items-center gap-1 px-1.5 py-1 text-[10px] font-semibold rounded-lg border transition-all
                      ${selectedTerrain===t.key ? 'border-amber-500/60 bg-amber-500/15 text-amber-300' : 'border-white/8 text-surface-500 hover:border-white/15 hover:text-surface-300'}`}>
                    <span>{t.icon}</span>
                    <span className="hidden lg:block">{t.label}</span>
                    <span className="text-[8px] opacity-50">×{t.cost}</span>
                  </button>
                ))}
                <button onClick={() => setShowTerrainEditor(true)}
                  className="px-1.5 py-1 text-[10px] font-bold rounded-lg border border-white/8 text-surface-500 hover:text-primary-400 hover:border-primary-500/30 transition-all">
                  ✎
                </button>
                <button onClick={() => setShowTerrain(!showTerrain)}
                  className={`px-1.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${showTerrain ? 'border-accent-500/40 bg-accent-500/10 text-accent-400' : 'border-white/8 text-surface-500'}`}>
                  {showTerrain ? '👁 ON' : '👁 OFF'}
                </button>
              </div>
            </>
          )}

          <div className="divider h-5"/>

          {/* Algorithms */}
          <div className="flex items-center gap-1 flex-wrap">
            {ALL_ALGOS.map(algo => {
              const meta = ALGO_META[algo];
              const sel = selectedAlgos.includes(algo);
              return (
                <button key={algo} onClick={() => toggleAlgo(algo)}
                  style={sel ? { color: meta.color, borderColor: `${meta.color}60`, background: `${meta.color}15` } : {}}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all
                    ${sel ? '' : 'border-white/8 text-surface-500 hover:text-surface-300 hover:bg-white/5'}`}>
                  {meta.label}
                </button>
              );
            })}
          </div>

          <div className="divider h-5"/>

          {/* Speed */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-surface-500 uppercase tracking-widest hidden sm:block">Spd</span>
            <input type="range" min={1} max={100} value={speed} onChange={e => setSpeed(+e.target.value)}
              className="w-16 accent-primary-500 cursor-pointer h-1"/>
            <span className="text-[10px] font-mono text-surface-500 w-5">{speed}</span>
          </div>

          <div className="divider h-5"/>

          {/* Actions - right side */}
          <div className="flex items-center gap-1.5 ml-auto">
            {error && <span className="text-[10px] text-red-400 font-medium hidden sm:block">✗ {error}</span>}

            <button onClick={() => setShowGenerator(true)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg border border-accent-500/30 text-accent-400 bg-accent-500/8 hover:bg-accent-500/15 transition-all">
              ⚡ Generate
            </button>

            {isSolving ? (
              <button onClick={onStop} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg border border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all">
                ⏹ Stop
              </button>
            ) : (
              <button onClick={onSolve} disabled={!canSolve}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed btn-primary">
                ▶ Solve
              </button>
            )}

            {hasResults && !isSolving && (
              <button onClick={clearPaths} className="px-2 py-1 text-[10px] font-bold rounded-lg border border-white/8 text-surface-500 hover:text-surface-300 hover:bg-white/5 transition-all">
                ↺
              </button>
            )}

            {onSave && (
              <button onClick={onSave} className="px-2 py-1 text-[10px] font-bold rounded-lg border border-white/8 text-surface-500 hover:text-surface-300 hover:bg-white/5 transition-all">
                💾
              </button>
            )}

            <button onClick={resetGrid} className="px-2 py-1 text-[10px] font-bold rounded-lg border border-white/8 text-surface-500 hover:text-red-400 hover:border-red-500/30 transition-all">
              ⊠
            </button>
          </div>
        </div>

        {/* Status hint */}
        {(!start || ends.length === 0) && (
          <div className="text-[9px] text-surface-600 font-mono pt-1">
            {!start ? '← Select Start mode and click a cell to place start node' : '← Select End mode and click a cell to place goal node'}
          </div>
        )}
      </div>

      {/* ── Generate Maze Modal ──────────────────────────────────────────────── */}
      <Modal open={showGenerator} onClose={() => setShowGenerator(false)} title="⚡ Generate Maze" maxWidth="max-w-lg">
        <div className="space-y-4">
          {/* Algorithm */}
          <div>
            <label className="label">Generation Method</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'recursive_backtracker', label: 'Perfect Maze', desc: 'Always solvable, complex paths', icon: '🌀' },
                { key: 'random_walls', label: 'Random Walls', desc: 'Configurable density', icon: '🎲' },
              ] as const).map(opt => (
                <button key={opt.key} onClick={() => setGenAlgo(opt.key)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    genAlgo === opt.key ? 'border-primary-500/50 bg-primary-500/10 text-primary-300' : 'border-white/8 text-surface-400 hover:border-white/15'
                  }`}>
                  <div className="text-lg mb-1">{opt.icon}</div>
                  <div className="text-xs font-bold text-surface-200">{opt.label}</div>
                  <div className="text-[10px] text-surface-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Wall density for random */}
          {genAlgo === 'random_walls' && (
            <div>
              <label className="label">Wall Density: {wallDensity}%</label>
              <input type="range" min={10} max={60} value={wallDensity} onChange={e => setWallDensity(+e.target.value)}
                className="w-full accent-primary-500 cursor-pointer"/>
              <div className="flex justify-between text-[9px] text-surface-600 mt-1">
                <span>10% — Sparse</span><span>60% — Dense</span>
              </div>
            </div>
          )}

          {/* Terrain toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/8 cursor-pointer"
            onClick={() => setGenTerrain(!genTerrain)}>
            <div className={`w-10 h-5 rounded-full relative transition-all ${genTerrain ? 'bg-accent-500' : 'bg-surface-700'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${genTerrain ? 'left-5' : 'left-0.5'}`}/>
            </div>
            <div>
              <div className="text-xs font-bold text-surface-200">Add terrain</div>
              <div className="text-[10px] text-surface-500">Paint random terrain on walkable cells</div>
            </div>
          </div>

          {/* Terrain probabilities */}
          {genTerrain && (
            <div className="space-y-2 pl-2 border-l-2 border-accent-500/30">
              <p className="text-[10px] text-surface-400 font-semibold">Terrain Probabilities (higher = more common)</p>
              {terrainDefs.map(t => (
                <div key={t.key} className="flex items-center gap-2">
                  <span className="text-sm w-5 text-center">{t.icon}</span>
                  <span className="text-xs text-surface-300 w-16 font-medium">{t.label}</span>
                  <input type="range" min={0} max={60} value={terrainProbs[t.key] || 0}
                    onChange={e => setTerrainProbs(p => ({ ...p, [t.key]: +e.target.value }))}
                    className="flex-1 accent-amber-500 cursor-pointer"/>
                  <span className="text-[10px] font-mono text-surface-500 w-8 text-right">{terrainProbs[t.key] || 0}%</span>
                </div>
              ))}
              <p className="text-[9px] text-surface-600">Cells not assigned any terrain stay empty (cost 1)</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={handleGenerate} className="flex-1 btn-md btn-accent">⚡ Generate</button>
            <button onClick={() => setShowGenerator(false)} className="btn-md btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* ── Terrain Editor Modal ─────────────────────────────────────────────── */}
      <Modal open={showTerrainEditor} onClose={() => setShowTerrainEditor(false)} title="◈ Terrain Editor" maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">Edit Costs & Colors</p>
            {terrainDefs.map(t => (
              <div key={t.key} className="flex items-center gap-2 p-2.5 rounded-xl border border-white/6 bg-white/3">
                <span className="text-base w-6 text-center">{t.icon}</span>
                <span className="text-xs font-semibold text-surface-200 flex-1">{t.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-surface-500">Cost</span>
                  <input type="number" min={1} max={100} value={t.cost}
                    onChange={e => updateTerrainCost(t.key, +e.target.value)}
                    className="w-14 text-center text-xs input !py-1 !px-1.5 !rounded-lg"/>
                </div>
                <input type="color" value={t.color}
                  onChange={e => updateTerrainColor(t.key, e.target.value)}
                  title="Grid color" className="w-7 h-7 rounded-lg cursor-pointer border border-white/10 bg-transparent"/>
                {t.isCustom && (
                  <button onClick={() => removeCustomTerrain(t.key)} className="text-[10px] text-red-400 hover:text-red-300 transition-colors px-1">✕</button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-white/8 pt-4">
            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-3">Add Custom Terrain</p>
            <div className="grid grid-cols-2 gap-2">
              <Input label="Name" value={newTerrain.label} onChange={e => setNewTerrain(p=>({...p,label:e.target.value}))} placeholder="e.g. Lava"/>
              <div className="flex flex-col gap-1.5">
                <label className="label">Icon (emoji)</label>
                <input value={newTerrain.icon} onChange={e => setNewTerrain(p=>({...p,icon:e.target.value}))} className="input text-center text-lg" placeholder="🔥" maxLength={2}/>
              </div>
              <Input label="Movement Cost" type="number" min={1} max={100} value={newTerrain.cost}
                onChange={e => setNewTerrain(p=>({...p,cost:e.target.value}))} placeholder="e.g. 20"/>
              <div className="flex flex-col gap-1.5">
                <label className="label">Grid Color</label>
                <input type="color" value={newTerrain.color} onChange={e => setNewTerrain(p=>({...p,color:e.target.value}))}
                  className="w-full h-9 rounded-xl border border-white/10 cursor-pointer bg-transparent"/>
              </div>
            </div>
            {newTerrainError && <p className="text-xs text-red-400 mt-1">{newTerrainError}</p>}
            <button onClick={handleAddCustomTerrain} className="btn-sm btn-accent mt-3">+ Add Terrain</button>
          </div>

          <div className="glass rounded-xl p-3 text-xs text-surface-400">
            💡 <strong className="text-surface-300">Cost</strong> = movement weight per cell. A*, Dijkstra use these. BFS/DFS ignore terrain.
          </div>
        </div>
      </Modal>
    </>
  );
};
