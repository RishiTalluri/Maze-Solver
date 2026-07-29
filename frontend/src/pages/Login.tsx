import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try { await login(email, password); navigate('/dashboard'); }
    catch (err: any) { setError(err.response?.data?.error || 'Invalid email or password'); }
  };

  return (
    <div className="min-h-screen flex" style={{ background:'linear-gradient(135deg, #0d1829 0%, #182440 50%, #0f2318 100%)' }}>
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none"/>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-96 relative shrink-0"
        style={{ background:'rgba(255,255,255,0.02)', borderRight:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="p-10">
          <Link to="/" className="flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#EA580C,#9a3412)' }}>
              <span className="text-white text-xs font-black">PF</span>
            </div>
            <span className="font-black text-sm text-surface-100">PathFinder</span>
          </Link>
          <h2 className="text-2xl font-black text-surface-50 mb-3">Pathfinding<br/>made visual.</h2>
          <p className="text-surface-400 text-sm leading-relaxed">Watch algorithms explore mazes in real time. Compare BFS vs A* vs Dijkstra. Build, save, share.</p>
          <div className="mt-8 space-y-2.5">
            {['6 pathfinding algorithms','Real-time step-by-step animation','Custom weighted terrain','Experiment mode & analytics'].map(s => (
              <div key={s} className="flex items-center gap-2.5 text-xs text-surface-400">
                <div className="dot-green shrink-0"/>
                {s}
              </div>
            ))}
          </div>
        </div>
        <div className="p-10 border-t border-white/6">
          <p className="text-[10px] text-surface-600 font-mono">Pathfinding Experimentation Platform</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 relative">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-2 lg:hidden mb-6">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:'linear-gradient(135deg,#EA580C,#9a3412)' }}>
                <span className="text-white text-[10px] font-black">PF</span>
              </div>
              <span className="font-black text-sm text-surface-100">PathFinder</span>
            </Link>
            <h1 className="text-2xl font-bold text-surface-50">Welcome back</h1>
            <p className="text-surface-400 text-sm mt-1">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">{error}</div>
          )}

          <div className="glass rounded-2xl p-6 space-y-4">
            <Input label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/>
            <Input label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/>
            <button type="submit" disabled={isLoading} onClick={handleSubmit as any}
              className="w-full btn-lg btn-primary mt-1">
              {isLoading ? 'Signing in...' : 'Sign in →'}
            </button>
          </div>

          <p className="text-center text-surface-500 text-sm mt-5">
            No account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">Create one free</Link>
          </p>
          <p className="text-center text-surface-600 text-xs mt-2">
            <Link to="/editor" className="hover:text-surface-400 underline transition-colors">Try without an account →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
