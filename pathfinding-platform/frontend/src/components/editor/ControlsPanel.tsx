import React, { useState, useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { ALL_ALGOS, useAlgoMeta } from '../../hooks/useSolver';
import { AlgorithmKey, DrawMode } from '../../types';
import { Modal, Input } from '../ui';
import { ColorsEditor } from '../shared/ColorsEditor';
import { generateMaze } from '../../utils/mazeGenerator';

const DRAW_MODES: { key: DrawMode; icon: string; label: string; color: string }[] = [
  { key: 'start',   icon: '▶', label: 'Start',   color: '#FFD166' },
  { key: 'end',     icon: '◆', label: 'End',     color: '#FF6B35' },
  { key: 'wall',    icon: '■', label: 'Wall',    color: '#A6A6A6' },
  { key: 'erase',   icon: '○', label: 'Erase',   color: '#64748b' },
  { key: 'terrain', icon: '◈', label: 'Terrain', color: '#f59e0b' },
];

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
    terrainDefs, updateTerrainCost, addCustomTerrain, removeCustomTerrain,
    wallColor,
    resetGrid, clearPaths, start, ends,
  } = useEditorStore();
  const liveAlgoMeta = useAlgoMeta();

  const [showTerrainEditor, setShowTerrainEditor] = useState(false);
  const [showColors, setShowColors]               = useState(false);
  const [showAlgoPicker, setShowAlgoPicker]        = useState(false);
  const [showSettings, setShowSettings]            = useState(false);
  const [showGenerator, setShowGenerator]         = useState(false);
  const [genAlgo, setGenAlgo]     = useState<'recursive_backtracker'|'random_walls'>('recursive_backtracker');
  const [genTerrain, setGenTerrain] = useState(false);
  const [wallDensity, setWallDensity] = useState(30);

  // Weights — sliders 0-60, auto-normalise to 100% for display
  const [terrainWeights, setTerrainWeights] = useState<Record<string,number>>(() => {
    const w: Record<string,number> = {};
    terrainDefs.forEach(t => { w[t.key] = 20; });
    return w;
  });

  const [newTerrain, setNewTerrain]         = useState({ label: '', icon: '🟫', cost: '2', color: '#7c5235' });
  const [newTerrainError, setNewTerrainError] = useState('');

  const canSolve = !!start && ends.length > 0 && selectedAlgos.length > 0 && !isSolving;

  const toggleAlgo = (algo: AlgorithmKey) =>
    setSelectedAlgos(selectedAlgos.includes(algo)
      ? selectedAlgos.filter(a => a !== algo)
      : [...selectedAlgos, algo]);

  // Total relative weight across terrain types only (auto-normalises to 100% *of the
  // non-wall cells*, same as before).
  const totalWeight = useMemo(() =>
    terrainDefs.reduce((s, t) => s + (terrainWeights[t.key] || 0), 0),
  [terrainDefs, terrainWeights]);

  // Wall Density already IS an absolute probability (e.g. 30% of ALL cells become a
  // wall) — it was never part of the terrain weight pool. Terrain weights only ever
  // apply to the remaining walkable cells, so a terrain's *true* share of the whole
  // grid is its relative share scaled down by however much the walls already took.
  // Scaling the displayed percentage this way is what makes Wall% + every terrain%
  // add up to exactly 100%, including walls, instead of each pool summing to 100%
  // on its own (which is what looked broken).
  const isRandomWalls = genAlgo === 'random_walls';
  const walkableShare = isRandomWalls ? Math.max(0, 100 - wallDensity) : 100;

  const normalizedPct = (key: string) => {
    if (totalWeight === 0) return 0;
    return Math.round(((terrainWeights[key] || 0) / totalWeight) * walkableShare);
  };

  // Rounded percentages can be off by a point or two — nudge the largest terrain
  // bucket so the on-screen total (wall + every terrain) is exactly 100%, never 99
  // or 101, whenever terrain is enabled.
  const roundedTerrainPcts = useMemo(() => {
    const pcts: Record<string, number> = {};
    terrainDefs.forEach(t => { pcts[t.key] = normalizedPct(t.key); });
    if (genTerrain && totalWeight > 0) {
      const wallPct = isRandomWalls ? wallDensity : 0;
      const sum = wallPct + terrainDefs.reduce((s, t) => s + pcts[t.key], 0);
      const diff = 100 - sum;
      if (diff !== 0) {
        const largest = terrainDefs.reduce((best, t) =>
          (terrainWeights[t.key] || 0) > (terrainWeights[best.key] || 0) ? t : best, terrainDefs[0]);
        if (largest) pcts[largest.key] += diff;
      }
    }
    return pcts;
  }, [terrainDefs, terrainWeights, totalWeight, genTerrain, isRandomWalls, wallDensity]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = () => {
    const { grid, terrainGrid, start: s, ends: e } = generateMaze({
      rows, cols, terrainEnabled: genTerrain, terrainDefs,
      terrainWeights, wallDensity, algorithm: genAlgo,
    });
    clearPaths();
    useEditorStore.setState({ grid, terrainGrid, start: s, ends: e, animStates: {}, results: {} });
    if (genTerrain) setShowTerrain(true);
    setShowGenerator(false);
  };

  const handleAddCustomTerrain = () => {
    setNewTerrainError('');
    if (!newTerrain.label.trim()) { setNewTerrainError('Name is required'); return; }
    const key = newTerrain.label.toLowerCase().replace(/\s+/g, '_');
    if (terrainDefs.find(t => t.key === key)) { setNewTerrainError('A terrain with that name already exists'); return; }
    const cost = parseInt(newTerrain.cost);
    if (isNaN(cost) || cost < 1) { setNewTerrainError('Cost must be at least 1'); return; }
    addCustomTerrain({ key, label: newTerrain.label.trim(), icon: newTerrain.icon, cost, color: newTerrain.color, isCustom: true });
    setTerrainWeights(w => ({ ...w, [key]: 20 }));
    setNewTerrain({ label: '', icon: '🟫', cost: '2', color: '#7c5235' });
  };

  return (
    <>
      <div className="bg-surface-900/90 backdrop-blur border-b border-white/6 px-3 py-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">

          {/* Grid size popover trigger */}
          <button onClick={() => setShowSettings(true)} title="Grid size"
            className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold rounded-lg border border-white/8 text-surface-400 hover:text-surface-200 hover:bg-white/5 transition-all">
            ⚙ <span className="hidden sm:inline">Grid</span> <span className="font-mono text-surface-500">{rows}×{cols}</span>
          </button>

          {/* Speed — always visible, live during animation */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/8" title="Solve speed — drag any time, even mid-animation">
            <span className="text-[10px] font-bold text-surface-500">⏱</span>
            <input type="range" min={1} max={100} value={speed}
              onChange={e => setSpeed(+e.target.value)}
              className="w-14 accent-primary-500 cursor-pointer"/>
            <span className="text-[10px] font-mono text-surface-500 w-6 text-right">{speed}</span>
          </div>

          <div className="divider h-5"/>

          {/* Draw modes — icon + short label so intent is clear at a glance */}
          <div className="flex items-center gap-0.5">
            {DRAW_MODES.map(m => (
              <button key={m.key} onClick={() => setDrawMode(m.key)} title={m.label}
                style={drawMode === m.key ? { color: m.color, borderColor: m.color, background: `${m.color}18` } : {}}
                className={`flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${drawMode === m.key ? '' : 'border-transparent text-surface-500 hover:text-surface-300 hover:bg-white/5'}`}>
                <span>{m.icon}</span>
                <span className="hidden sm:block">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Terrain strip — only while painting terrain */}
          {drawMode === 'terrain' && (
            <>
              <div className="divider h-5"/>
              <div className="flex items-center gap-1 flex-wrap">
                {terrainDefs.map(t => (
                  <button key={t.key} onClick={() => setSelectedTerrain(t.key)}
                    title={`${t.label} — cost ${t.cost}`}
                    className={`flex items-center gap-1 px-1.5 py-1 text-[10px] font-semibold rounded-lg border transition-all ${selectedTerrain === t.key ? 'border-amber-500/60 bg-amber-500/15 text-amber-300' : 'border-white/8 text-surface-500 hover:border-white/15 hover:text-surface-300'}`}>
                    <span>{t.icon}</span>
                    <span className="hidden lg:block">{t.label}</span>
                  </button>
                ))}
                <button onClick={() => setShowTerrainEditor(true)} title="Edit terrain costs / add custom terrain"
                  className="flex items-center gap-1 px-1.5 py-1 text-[10px] font-bold rounded-lg border border-white/8 text-surface-500 hover:text-primary-400 hover:border-primary-500/30 transition-all">
                  <span>✎</span><span className="hidden lg:block">Edit</span>
                </button>
                <button onClick={() => setShowTerrain(!showTerrain)} title={showTerrain ? 'Hide terrain overlay' : 'Show terrain overlay'}
                  className={`flex items-center gap-1 px-1.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${showTerrain ? 'border-accent-500/40 bg-accent-500/10 text-accent-400' : 'border-white/8 text-surface-500'}`}>
                  <span>👁</span><span className="hidden lg:block">{showTerrain ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </>
          )}

          <div className="divider h-5"/>

          {/* Colors — single entry point for terrain, wall, and per-algorithm path/explored colors */}
          <button onClick={() => setShowColors(true)} title="Edit terrain, wall, and algorithm colors"
            className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold rounded-lg border border-white/8 text-surface-400 hover:text-surface-200 hover:bg-white/5 transition-all">
            🎨 <span className="hidden sm:block">Colors</span>
          </button>

          {/* Algorithms — compact popover trigger instead of N inline buttons */}
          <button onClick={() => setShowAlgoPicker(true)} title="Choose which algorithms to run"
            className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold rounded-lg border border-white/8 text-surface-300 hover:bg-white/5 transition-all">
            <span className="flex -space-x-1">
              {selectedAlgos.slice(0, 4).map(a => (
                <span key={a} className="w-2.5 h-2.5 rounded-full border border-surface-900" style={{ background: liveAlgoMeta[a].pathColor }}/>
              ))}
            </span>
            🧮 {selectedAlgos.length ? `${selectedAlgos.length} algo${selectedAlgos.length > 1 ? 's' : ''}` : 'Algorithms'}
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1.5 ml-auto">
            {error && <span className="text-[10px] text-red-400 font-medium hidden sm:block">✗ {error}</span>}
            <button onClick={() => setShowGenerator(true)} title="Auto-generate a new maze layout"
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg border border-accent-500/30 text-accent-400 bg-accent-500/8 hover:bg-accent-500/15 transition-all">
              ⚡ Generate
            </button>
            {isSolving ? (
              <button onClick={onStop} title="Stop the running solve"
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg border border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all">
                ⏹ Stop
              </button>
            ) : (
              <button onClick={onSolve} disabled={!canSolve} title="Run the selected algorithms"
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed btn-primary btn-sm">
                ▶ Solve
              </button>
            )}
            <button onClick={clearPaths} disabled={!hasResults || isSolving} title="Clear solved paths (keeps the maze layout)"
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg border border-white/8 text-surface-500 hover:text-surface-300 hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-surface-500">
              ↺ <span className="hidden sm:block">Clear</span>
            </button>
            {onSave && (
              <button onClick={onSave} title="Save this maze"
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg border border-white/8 text-surface-500 hover:text-surface-300 hover:bg-white/5 transition-all">
                💾 <span className="hidden sm:block">Save</span>
              </button>
            )}
            <button onClick={resetGrid} title="Reset — clears the entire grid, start/end, and results"
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-lg border border-white/8 text-surface-500 hover:text-red-400 hover:border-red-500/30 transition-all">
              🗑️ <span className="hidden sm:block">Reset</span>
            </button>
          </div>
        </div>
        {(!start || ends.length === 0) && (
          <div className="text-[9px] text-surface-600 font-mono pt-1">
            {!start ? '← Select Start mode (▶) and click a cell' : '← Select End mode (◆) and click a cell to place a goal'}
          </div>
        )}
      </div>

      {/* ── Grid Size Popover ─────────────────────────────────────────────────── */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="⚙ Grid Size" maxWidth="max-w-xs">
        <div>
          <label className="label">Rows × Columns</label>
          <div className="flex items-center gap-2">
            <input type="number" min={5} max={60} value={rows}
              onChange={e => setSize(Math.min(60, Math.max(5, +e.target.value)), cols)}
              className="input text-center"/>
            <span className="text-surface-600 text-sm">×</span>
            <input type="number" min={5} max={80} value={cols}
              onChange={e => setSize(rows, Math.min(80, Math.max(5, +e.target.value)))}
              className="input text-center"/>
          </div>
        </div>
      </Modal>

      {/* ── Algorithm Picker Popover ─────────────────────────────────────────── */}
      <Modal open={showAlgoPicker} onClose={() => setShowAlgoPicker(false)} title="🧮 Algorithms" maxWidth="max-w-xs">
        <div className="space-y-1.5">
          {ALL_ALGOS.map(algo => {
            const meta = liveAlgoMeta[algo]; const sel = selectedAlgos.includes(algo);
            return (
              <button key={algo} onClick={() => toggleAlgo(algo)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all ${sel ? 'border-white/15 bg-white/5' : 'border-white/6 hover:border-white/12'}`}>
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: meta.pathColor }}/>
                <span className="text-xs font-semibold text-surface-200 flex-1">{meta.label}</span>
                {sel && <span className="text-xs" style={{ color: meta.pathColor }}>✓</span>}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* ── Colors Modal — terrain, wall, and per-algorithm path/explored colors ── */}
      <Modal open={showColors} onClose={() => setShowColors(false)} title="🎨 Colors" maxWidth="max-w-lg">
        <ColorsEditor/>
      </Modal>


      {/* ── Generate Maze Modal ───────────────────────────────────────────── */}
      <Modal open={showGenerator} onClose={() => setShowGenerator(false)} title="⚡ Generate Maze" maxWidth="max-w-lg">
        <div className="space-y-5">
          <div>
            <label className="label">Generation Method</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'recursive_backtracker', label: 'Perfect Maze',  desc: 'Always solvable, complex winding paths', icon: '🌀' },
                { key: 'random_walls',          label: 'Random Walls',  desc: 'Configurable wall density',              icon: '🎲' },
              ] as const).map(opt => (
                <button key={opt.key} onClick={() => setGenAlgo(opt.key)}
                  className={`p-3 rounded-xl border text-left transition-all ${genAlgo === opt.key ? 'border-primary-500/50 bg-primary-500/10 text-primary-300' : 'border-white/8 text-surface-400 hover:border-white/15'}`}>
                  <div className="text-lg mb-1">{opt.icon}</div>
                  <div className="text-xs font-bold text-surface-200">{opt.label}</div>
                  <div className="text-[10px] text-surface-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/8 cursor-pointer select-none"
            onClick={() => setGenTerrain(!genTerrain)}>
            <div className={`w-10 h-5 rounded-full relative transition-all shrink-0 ${genTerrain ? 'bg-accent-500' : 'bg-surface-700'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${genTerrain ? 'left-5' : 'left-0.5'}`}/>
            </div>
            <div>
              <div className="text-xs font-bold text-surface-200">Add terrain</div>
              <div className="text-[10px] text-surface-500">Paint random terrain on walkable cells</div>
            </div>
          </div>

          {genTerrain && (
            <div className="space-y-3 pl-3 border-l-2 border-accent-500/30">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-surface-400 font-semibold uppercase tracking-wide">Terrain Weights</p>
                <p className="text-[9px] text-surface-600">
                  {isRandomWalls ? 'Includes walls — everything adds up to 100%' : 'Auto-normalise to 100% of walkable cells'}
                </p>
              </div>
              {isRandomWalls && (
                <div className="flex items-center gap-2">
                  <span className="text-sm w-5 text-center shrink-0">■</span>
                  <span className="text-xs text-surface-300 w-16 font-medium shrink-0">Wall</span>
                  <input type="range" min={10} max={60} value={wallDensity}
                    onChange={e => setWallDensity(+e.target.value)}
                    className="flex-1 accent-primary-500 cursor-pointer"/>
                  <span className="text-[10px] font-mono w-8 text-right shrink-0 text-surface-300">
                    {wallDensity}%
                  </span>
                </div>
              )}
              {terrainDefs.map(t => {
                const pct = roundedTerrainPcts[t.key] ?? 0;
                return (
                  <div key={t.key} className="flex items-center gap-2">
                    <span className="text-sm w-5 text-center shrink-0">{t.icon}</span>
                    <span className="text-xs text-surface-300 w-16 font-medium shrink-0">{t.label}</span>
                    <input type="range" min={0} max={60} value={terrainWeights[t.key] || 0}
                      onChange={e => setTerrainWeights(w => ({ ...w, [t.key]: +e.target.value }))}
                      className="flex-1 accent-amber-500 cursor-pointer"/>
                    <span className="text-[10px] font-mono w-8 text-right shrink-0"
                      style={{ color: pct > 0 ? '#f59e0b' : '#475569' }}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
              {/* Visual bar — wall segment first, then terrain segments, always summing to 100% */}
              <div className="flex h-2 rounded-full overflow-hidden gap-px">
                {isRandomWalls && wallDensity > 0 && (
                  <div title={`Wall: ${wallDensity}%`}
                    style={{ width: `${wallDensity}%`, background: wallColor, transition: 'width 0.2s' }}
                    className="h-full"/>
                )}
                {terrainDefs.filter(t => (terrainWeights[t.key] || 0) > 0).map(t => (
                  <div key={t.key} title={`${t.label}: ${roundedTerrainPcts[t.key] ?? 0}%`}
                    style={{ width: `${roundedTerrainPcts[t.key] ?? 0}%`, background: t.color, transition: 'width 0.2s' }}
                    className="h-full"/>
                ))}
              </div>
              <p className="text-[9px] text-surface-600">
                {isRandomWalls
                  ? `Wall ${wallDensity}% + terrain ${100 - wallDensity}% of the grid = 100% total`
                  : 'Every walkable cell gets a terrain — 100% covers the whole non-wall grid'}
              </p>
            </div>
          )}
          {!genTerrain && isRandomWalls && (
            <div>
              <label className="label">Wall Density: {wallDensity}%</label>
              <input type="range" min={10} max={60} value={wallDensity}
                onChange={e => setWallDensity(+e.target.value)}
                className="w-full accent-primary-500 cursor-pointer"/>
              <div className="flex justify-between text-[9px] text-surface-600 mt-1">
                <span>10% — Sparse</span><span>60% — Dense</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleGenerate} className="flex-1 btn-md btn-accent">⚡ Generate</button>
            <button onClick={() => setShowGenerator(false)} className="btn-md btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* ── Terrain Costs Modal (colors are edited via the 🎨 Colors modal) ──── */}
      <Modal open={showTerrainEditor} onClose={() => setShowTerrainEditor(false)} title="✎ Terrain Costs" maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">Movement Cost</p>
            {terrainDefs.map(t => (
              <div key={t.key} className="flex items-center gap-2 p-2.5 rounded-xl border border-white/6 bg-white/3">
                <span className="text-base w-6 text-center shrink-0">{t.icon}</span>
                <span className="text-xs font-semibold text-surface-200 flex-1 min-w-0">{t.label}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-surface-500">Cost</span>
                  <input type="number" min={1} max={100} value={t.cost}
                    onChange={e => updateTerrainCost(t.key, +e.target.value)}
                    className="w-14 text-center text-xs input !py-1 !px-1.5 !rounded-lg"/>
                </div>
                {t.isCustom && (
                  <button onClick={() => removeCustomTerrain(t.key)} title="Delete terrain"
                    className="text-[11px] text-red-400 hover:text-red-300 transition-colors px-1 shrink-0">🗑️</button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-white/8 pt-4">
            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-3">Add Custom Terrain</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Name" value={newTerrain.label}
                onChange={e => setNewTerrain(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Lava"/>
              <div className="flex flex-col gap-1.5">
                <label className="label">Icon</label>
                <input value={newTerrain.icon}
                  onChange={e => setNewTerrain(p => ({ ...p, icon: e.target.value }))}
                  className="input text-center text-lg" placeholder="🔥" maxLength={2}/>
              </div>
              <Input label="Movement Cost" type="number" min={1} max={100}
                value={newTerrain.cost}
                onChange={e => setNewTerrain(p => ({ ...p, cost: e.target.value }))} placeholder="e.g. 20"/>
              <div className="flex flex-col gap-1.5">
                <label className="label">Grid Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={newTerrain.color}
                    onChange={e => setNewTerrain(p => ({ ...p, color: e.target.value }))}
                    className="flex-1 h-9 rounded-xl border border-white/10 cursor-pointer bg-transparent"/>
                  <div className="w-9 h-9 rounded-xl border border-white/10 shrink-0" style={{ background: newTerrain.color }}/>
                </div>
              </div>
            </div>
            {newTerrainError && <p className="text-xs text-red-400 mt-2">{newTerrainError}</p>}
            <button onClick={handleAddCustomTerrain} className="btn-sm btn-accent mt-3">+ Add Terrain</button>
          </div>

          <div className="glass rounded-xl p-3 text-xs text-surface-400 border border-white/6">
            💡 <strong className="text-surface-300">Cost</strong> = movement weight per cell. A* and Dijkstra use terrain costs. BFS and DFS ignore them. Colors live in the 🎨 Colors modal.
          </div>
        </div>
      </Modal>
    </>
  );
};
