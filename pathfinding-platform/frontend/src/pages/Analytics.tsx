import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { analyticsApi } from '../api/analytics';
import { AlgorithmStats, GlobalStats } from '../types';
import { Spinner, SectionHeader } from '../components/ui';
import { ALGO_META } from '../hooks/useSolver';

const COLORS = ['#FF6B35','#FFD166','#63b3ed','#06b6d4','#f59e0b','#ec4899'];
const ttStyle = { backgroundColor:'#242424', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#F8F8F8', fontSize:12 };

export const AnalyticsPage: React.FC = () => {
  const [algoStats, setAlgoStats] = useState<AlgorithmStats[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([analyticsApi.getAlgorithmStats(), analyticsApi.getGlobalStats()])
      .then(([a,g])=>{ setAlgoStats(a.data.data); setGlobalStats(g.data); })
      .finally(()=>setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg"/></div>;
  const chartData = algoStats.map(s=>({
    name: ALGO_META[s.algorithm as keyof typeof ALGO_META]?.label||s.algorithm,
    'Avg Time (ms)': s.avg_execution_time, 'Avg Explored': s.avg_nodes_explored,
    'Success %': s.success_rate, algorithm: s.algorithm,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <SectionHeader title="Analytics" subtitle="Your algorithm performance trends"/>
      {algoStats.length===0 ? (
        <div className="glass rounded-2xl p-12 text-center"><div className="text-4xl mb-3 opacity-40">📊</div><p className="text-surface-300 font-semibold">No data yet</p><p className="text-surface-500 text-sm mt-1">Run some algorithms to see analytics</p></div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {[['Avg Execution Time (ms)','Avg Time (ms)'],['Avg Nodes Explored','Avg Explored']].map(([title, key])=>(
              <div key={title} className="glass rounded-2xl p-5">
                <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-4">{title}</p>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={chartData} barSize={22}>
                    <XAxis dataKey="name" tick={{fill:'#6E6E6E',fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'#6E6E6E',fontSize:10}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={ttStyle}/>
                    <Bar dataKey={key} radius={[4,4,0,0]}>
                      {chartData.map((e,i)=><Cell key={i} fill={ALGO_META[e.algorithm as keyof typeof ALGO_META]?.color||COLORS[i%COLORS.length]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">🌐 Global Stats — All Users</p>
              {globalStats && (
                <p className="text-[10px] text-surface-500">
                  {globalStats.contributing_users} of {globalStats.total_users} users have run an algorithm · {globalStats.total_runs} runs total
                </p>
              )}
            </div>
            {!globalStats || globalStats.algorithms.length === 0 ? (
              <p className="text-surface-500 text-sm py-6 text-center">No runs from any user yet.</p>
            ) : (
              <table className="w-full text-xs mt-3">
                <thead>
                  <tr className="border-b border-white/8">
                    {['Algorithm','Users','Runs','Avg Time','Avg Explored','Success'].map(h=>(
                      <th key={h} className="text-left py-2.5 px-3 text-[10px] font-bold text-surface-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {globalStats.algorithms.map(s=>{
                    const meta=ALGO_META[s.algorithm as keyof typeof ALGO_META];
                    return (
                      <tr key={s.algorithm} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="py-3 px-3"><div className="flex items-center gap-2"><div style={{width:7,height:7,borderRadius:'50%',background:meta?.color||'#888'}}/><span className="font-semibold text-surface-200">{meta?.label||s.algorithm}</span></div></td>
                        <td className="py-3 px-3 text-surface-400 font-mono">{s.distinct_users}</td>
                        <td className="py-3 px-3 text-surface-400 font-mono">{s.total_runs}</td>
                        <td className="py-3 px-3 text-surface-400 font-mono">{s.avg_execution_time}ms</td>
                        <td className="py-3 px-3 text-surface-400 font-mono">{s.avg_nodes_explored}</td>
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold" style={{color:s.success_rate>80?'#FFD166':s.success_rate>50?'#f59e0b':'#ef4444'}}>{s.success_rate}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="glass rounded-2xl p-5 overflow-x-auto">
            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-4">Full Stats Table</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/8">
                  {['Algorithm','Runs','Avg Time','Avg Explored','Avg Path','Success'].map(h=>(
                    <th key={h} className="text-left py-2.5 px-3 text-[10px] font-bold text-surface-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {algoStats.map(s=>{
                  const meta=ALGO_META[s.algorithm as keyof typeof ALGO_META];
                  return (
                    <tr key={s.algorithm} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="py-3 px-3"><div className="flex items-center gap-2"><div style={{width:7,height:7,borderRadius:'50%',background:meta?.color||'#888'}}/><span className="font-semibold text-surface-200">{meta?.label||s.algorithm}</span></div></td>
                      <td className="py-3 px-3 text-surface-400 font-mono">{s.total_runs}</td>
                      <td className="py-3 px-3 text-surface-400 font-mono">{s.avg_execution_time}ms</td>
                      <td className="py-3 px-3 text-surface-400 font-mono">{s.avg_nodes_explored}</td>
                      <td className="py-3 px-3 text-surface-400 font-mono">{s.avg_path_length}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 rounded-full h-1 max-w-[50px]" style={{background:'rgba(255,255,255,0.08)'}}>
                            <div className="h-full rounded-full" style={{width:`${s.success_rate}%`,background:s.success_rate>80?'#FFD166':s.success_rate>50?'#f59e0b':'#ef4444'}}/>
                          </div>
                          <span className="font-mono font-bold" style={{color:s.success_rate>80?'#FFD166':s.success_rate>50?'#f59e0b':'#ef4444'}}>{s.success_rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
