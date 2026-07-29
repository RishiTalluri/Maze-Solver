import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PieChart, Pie, Cell } from 'recharts';
import { analyticsApi } from '../api/analytics';
import { AlgorithmStats } from '../types';
import { Spinner, SectionHeader } from '../components/ui';
import { ALGO_META } from '../hooks/useSolver';

const COLORS = ['#EA580C','#10B981','#63b3ed','#a855f7','#f59e0b','#ec4899'];
const ttStyle = { backgroundColor:'#182440', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#e2e8f0', fontSize:12 };

export const AnalyticsPage: React.FC = () => {
  const [algoStats, setAlgoStats] = useState<AlgorithmStats[]>([]);
  const [mazeStats, setMazeStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([analyticsApi.getAlgorithmStats(), analyticsApi.getMazeStats()])
      .then(([a,m])=>{ setAlgoStats(a.data.data); setMazeStats(m.data); })
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
                    <XAxis dataKey="name" tick={{fill:'#5c72a0',fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'#5c72a0',fontSize:10}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={ttStyle}/>
                    <Bar dataKey={key} radius={[4,4,0,0]}>
                      {chartData.map((e,i)=><Cell key={i} fill={ALGO_META[e.algorithm as keyof typeof ALGO_META]?.color||COLORS[i%COLORS.length]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-5">
              <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-4">Success Rate Radar</p>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={chartData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)"/>
                  <PolarAngleAxis dataKey="name" tick={{fill:'#5c72a0',fontSize:10}}/>
                  <Radar dataKey="Success %" stroke="#EA580C" fill="#EA580C" fillOpacity={0.15} strokeWidth={2}/>
                  <Tooltip contentStyle={ttStyle}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {mazeStats?.difficulty_distribution?.length>0 && (
              <div className="glass rounded-2xl p-5">
                <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-4">Maze Difficulty</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={mazeStats.difficulty_distribution} dataKey="count" nameKey="difficulty" cx="50%" cy="50%" outerRadius={70} innerRadius={30}
                      label={({difficulty,percent})=>`${difficulty} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {mazeStats.difficulty_distribution.map((_: any,i: number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip contentStyle={ttStyle}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
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
                            <div className="h-full rounded-full" style={{width:`${s.success_rate}%`,background:s.success_rate>80?'#10B981':s.success_rate>50?'#f59e0b':'#ef4444'}}/>
                          </div>
                          <span className="font-mono font-bold" style={{color:s.success_rate>80?'#10B981':s.success_rate>50?'#f59e0b':'#ef4444'}}>{s.success_rate}%</span>
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
