import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const FEATURES = [
  { icon: '🧩', title: 'Interactive Editor',       desc: 'Click and drag to build mazes. Place weighted terrain, walls, and multiple goal nodes.',              color: '#EA580C' },
  { icon: '⚡', title: '6 Pathfinding Algorithms', desc: 'BFS, DFS, A*, Dijkstra, Greedy BFS, Bidirectional BFS — all animated step by step in real time.',    color: '#10B981' },
  { icon: '🔬', title: 'Experiment Mode',           desc: 'Run multiple algorithms on the same maze simultaneously and watch them race.',                        color: '#63b3ed' },
  { icon: '📊', title: 'Analytics Dashboard',       desc: 'Track performance trends, success rates, and explored node counts across all your runs.',              color: '#a855f7' },
  { icon: '🎲', title: 'Maze Generator',            desc: 'Generate perfect mazes or random walls. Paint terrain automatically with configurable probabilities.', color: '#f59e0b' },
  { icon: '🌍', title: 'Share & Collaborate',       desc: 'Publish mazes, generate share links, and duplicate community creations.',                             color: '#ec4899' },
];

const ALGOS = [
  { name: 'BFS',        tag: 'Shortest path',    color: '#63b3ed' },
  { name: 'A*',         tag: 'Optimal + fast',   color: '#10B981' },
  { name: 'Dijkstra',   tag: 'Weighted optimal', color: '#EA580C' },
  { name: 'DFS',        tag: 'Any valid path',   color: '#a855f7' },
  { name: 'Greedy BFS', tag: 'Heuristic only',   color: '#f59e0b' },
  { name: 'Bidir. BFS', tag: 'Meets in middle',  color: '#ec4899' },
];

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0d1829 0%, #182440 35%, #0f2318 65%, #1a1830 100%)' }}>
      <div className="fixed inset-0 bg-grid opacity-40 pointer-events-none"/>
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(234,88,12,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }}/>
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }}/>

      <div className="relative">
        <div className="max-w-5xl mx-auto px-4 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary-500/30 bg-primary-500/8 text-primary-400 text-xs font-semibold mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"/>
            Pathfinding Experimentation Platform
          </div>
          <h1 className="text-5xl sm:text-7xl font-black leading-[1.02] mb-6 tracking-tight">
            <span className="text-surface-50">Visualize.</span>{' '}
            <span className="text-gradient">Compare.</span>
            <br/>
            <span className="text-surface-50">Experiment.</span>
          </h1>
          <p className="text-surface-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Build interactive mazes, watch algorithms compete in real time, and analyse performance with beautiful charts and stats.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-14">
            <Link to="/editor"   className="btn-lg btn-primary px-7">Open Editor →</Link>
            {!isAuthenticated
              ? <Link to="/register" className="btn-lg btn-ghost px-7">Create Free Account</Link>
              : <Link to="/dashboard" className="btn-lg btn-ghost px-7">Go to Dashboard</Link>
            }
            <Link to="/mazes" className="btn-lg btn-outline px-7">Browse Mazes</Link>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {ALGOS.map(({ name, tag, color }) => (
              <div key={name} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold"
                style={{ borderColor: `${color}30`, background: `${color}10`, color }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }}/>
                <span>{name}</span>
                <span style={{ color: `${color}70` }}>·</span>
                <span style={{ color: `${color}80`, fontWeight: 400 }}>{tag}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pb-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-surface-100 mb-2">Everything you need</h2>
            <p className="text-surface-500 text-sm">Built for students, researchers, and engineers</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon, title, desc, color }) => (
              <div key={title} className="glass-card group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
                  style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                  {icon}
                </div>
                <div className="font-bold text-surface-100 text-sm mb-1.5 group-hover:text-white transition-colors">{title}</div>
                <div className="text-surface-500 text-xs leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/6 py-20">
          <div className="max-w-xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-black text-surface-50 mb-3">Ready to start?</h2>
            <p className="text-surface-400 text-sm mb-8">Free to use. No credit card needed.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              {!isAuthenticated ? (
                <>
                  <Link to="/register" className="btn-lg btn-primary px-8">Create Account</Link>
                  <Link to="/editor"   className="btn-lg btn-ghost px-8">Try Without Account</Link>
                </>
              ) : (
                <Link to="/editor" className="btn-lg btn-primary px-8">Open Editor</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
