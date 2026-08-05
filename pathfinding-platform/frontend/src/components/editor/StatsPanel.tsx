import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useAlgoMeta } from '../../hooks/useSolver';
import { AlgorithmKey, SolveResults } from '../../types';

export const Legend: React.FC = () => {
  const { selectedAlgos } = useEditorStore();
  const ALGO_META = useAlgoMeta();
  return (
    <div className="flex flex-wrap gap-3 items-center px-3 py-2 border-t border-white/6 text-xs"
      style={{ background:'rgba(30,30,30,0.8)' }}>
      <span className="text-[9px] text-surface-600 font-mono tracking-widest uppercase">Legend</span>
      {[{ color:'#FFD166',label:'Start' },{ color:'#FF6B35',label:'End' },{ color:'#1E1E1E',label:'Wall',border:'rgba(255,255,255,0.1)' }].map(({color,label,border}) => (
        <div key={label} className="flex items-center gap-1.5">
          <div style={{ width:10,height:10,borderRadius:2,background:color,border:`1px solid ${border||color}` }}/>
          <span className="text-surface-500">{label}</span>
        </div>
      ))}
      {selectedAlgos.map(algo => {
        const meta = ALGO_META[algo];
        return (
          <React.Fragment key={algo}>
            <div className="flex items-center gap-1.5">
              <div style={{ width:10,height:10,borderRadius:2,background:meta.visitedColor,border:`1px solid ${meta.color}40` }}/>
              <span className="text-surface-500">{meta.label} explored</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width:10,height:10,borderRadius:2,background:meta.color,boxShadow:`0 0 4px ${meta.color}` }}/>
              <span className="text-surface-500">{meta.label} path</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const ResultsPanel: React.FC<{ results: SolveResults }> = ({ results }) => {
  const algos = Object.keys(results) as AlgorithmKey[];
  const ALGO_META = useAlgoMeta();
  if (algos.length === 0) return null;
  return (
    <div className="border-t border-white/6 px-3 py-3" style={{ background:'rgba(30,30,30,0.9)' }}>
      <p className="text-[9px] font-bold text-surface-600 uppercase tracking-widest mb-2.5">Results</p>
      <div className="flex flex-wrap gap-2.5">
        {algos.map(algo => {
          const r = results[algo]!;
          const meta = ALGO_META[algo];
          return (
            <div key={algo} className="glass rounded-xl p-3 min-w-[140px]"
              style={{ borderColor:`${meta.color}25` }}>
              <div className="flex items-center gap-1.5 mb-2">
                <div style={{ width:6,height:6,borderRadius:'50%',background:meta.color,boxShadow:`0 0 5px ${meta.color}` }}/>
                <span style={{ color:meta.color }} className="text-[10px] font-bold">{meta.label}</span>
                <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.success?'badge-green':'text-red-400 bg-red-500/10 border border-red-500/20'}`}>
                  {r.success ? 'FOUND' : 'NONE'}
                </span>
              </div>
              {[
                ['Path', r.success ? r.path_length : '—'],
                ['Explored', r.nodes_explored],
                ['Time', `${r.execution_time}ms`],
                ['Cost', r.success ? r.total_cost.toFixed(1) : '—'],
              ].map(([l,v]) => (
                <div key={l as string} className="flex justify-between text-[10px] py-0.5">
                  <span className="text-surface-500">{l}</span>
                  <span style={{ color:meta.color }} className="font-mono font-bold">{v}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
