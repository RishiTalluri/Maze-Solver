import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { ALL_ALGOS, useAlgoMeta } from '../../hooks/useSolver';

const Swatch: React.FC<{ value: string; onChange: (v: string) => void; title: string }> = ({ value, onChange, title }) => (
  <div className="flex items-center gap-1.5 shrink-0">
    <input type="color" value={value} onChange={e => onChange(e.target.value)} title={title}
      className="w-7 h-7 rounded-lg cursor-pointer border border-white/10 bg-transparent p-0.5"/>
  </div>
);

/**
 * Shared color-editing panel: terrain fill colors, wall color, and each
 * algorithm's path / explored colors. Pure state-driven off the editor
 * store, so it renders identically (and stays in sync) wherever it's
 * mounted — the Editor's Colors modal and the Experiments page both use it.
 */
export const ColorsEditor: React.FC<{ showTerrain?: boolean }> = ({ showTerrain = true }) => {
  const { terrainDefs, updateTerrainColor, algoColors, setAlgoColor, wallColor, setWallColor } = useEditorStore();
  const liveAlgoMeta = useAlgoMeta();

  return (
    <div className="space-y-5">
      {showTerrain && terrainDefs.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-2">Terrain Colors</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {terrainDefs.map(t => (
              <div key={t.key} className="flex items-center gap-2 p-2 rounded-xl border border-white/6 bg-white/3 min-w-0">
                <span className="text-sm shrink-0">{t.icon}</span>
                <span className="text-xs font-medium text-surface-300 truncate flex-1 min-w-0">{t.label}</span>
                <Swatch value={t.color} onChange={c => updateTerrainColor(t.key, c)} title={`${t.label} color`}/>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-2">Wall Color</p>
        <div className="flex items-center gap-2 p-2 rounded-xl border border-white/6 bg-white/3 max-w-[220px]">
          <span className="text-sm shrink-0">■</span>
          <span className="text-xs font-medium text-surface-300 flex-1">Wall</span>
          <Swatch value={wallColor} onChange={setWallColor} title="Wall color"/>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-2">Algorithm Path &amp; Explored Colors</p>
        <div className="space-y-1.5">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center px-2">
            <span/>
            <span className="text-[9px] text-surface-600 uppercase font-semibold w-7 text-center">Path</span>
            <span className="text-[9px] text-surface-600 uppercase font-semibold w-7 text-center">Explored</span>
          </div>
          {ALL_ALGOS.map(algo => (
            <div key={algo} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center p-2 rounded-xl border border-white/6 bg-white/3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: liveAlgoMeta[algo].pathColor }}/>
                <span className="text-xs font-semibold text-surface-200 truncate">{liveAlgoMeta[algo].label}</span>
              </div>
              <Swatch value={algoColors[algo].path} onChange={c => setAlgoColor(algo, 'path', c)} title={`${liveAlgoMeta[algo].label} path color`}/>
              <Swatch value={algoColors[algo].visited} onChange={c => setAlgoColor(algo, 'visited', c)} title={`${liveAlgoMeta[algo].label} explored color`}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
