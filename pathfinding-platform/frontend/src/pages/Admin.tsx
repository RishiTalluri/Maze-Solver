import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { Spinner, StatCard, SectionHeader } from '../components/ui';
import { User } from '../types';

interface SystemStats { users: number; mazes: number; public_mazes: number; algorithm_runs: number; experiments: number; }

export const AdminPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/dashboard'); return; }
    Promise.all([
      client.get<SystemStats>('/admin/stats'),
      client.get<{ items: User[]; total: number }>('/admin/users'),
    ]).then(([s, u]) => { setStats(s.data); setUsers(u.data.items); })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Delete user "${username}" and all their data permanently?`)) return;
    setDeletingId(userId);
    try {
      await client.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (stats) setStats({ ...stats, users: stats.users - 1 });
    } catch (e: any) { alert(e.response?.data?.error || 'Delete failed'); }
    finally { setDeletingId(null); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <SectionHeader title="Admin Panel" subtitle="System management and oversight" />

      {/* Warning */}
      <div className="rounded-2xl p-4 border border-amber-500/25 flex items-start gap-3"
        style={{ background: 'rgba(245,158,11,0.06)' }}>
        <span className="text-xl shrink-0">⚠️</span>
        <p className="text-sm text-amber-300/80">
          <strong className="text-amber-300">Admin area.</strong> Actions here are permanent and affect all users across the platform.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Users"       value={stats.users}           icon="👥" color="#FF6B35" />
          <StatCard label="Mazes"       value={stats.mazes}           icon="🧩" color="#FFD166" />
          <StatCard label="Public"      value={stats.public_mazes}    icon="🌍" color="#63b3ed" />
          <StatCard label="Algo Runs"   value={stats.algorithm_runs}  icon="⚡" color="#06b6d4" />
          <StatCard label="Experiments" value={stats.experiments}     icon="🧪" color="#f59e0b" />
        </div>
      )}

      {/* Users table */}
      <div className="glass rounded-2xl p-5 overflow-x-auto">
        <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-4">
          All Users ({users.length})
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {['User', 'Email', 'Role', 'Joined', 'Last Login', ''].map(h => (
                <th key={h} className="text-left py-2.5 px-3 text-[10px] font-bold text-surface-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #FF6B35, #b93f16)' }}>
                      {u.username[0].toUpperCase()}
                    </div>
                    <span className="font-semibold text-surface-100 text-sm">{u.username}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-surface-400 text-xs font-mono">{u.email}</td>
                <td className="py-3 px-3">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'badge-orange' : 'badge-gray'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-3 text-surface-500 text-xs font-mono">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-3 text-surface-500 text-xs font-mono">
                  {u.last_login ? new Date(u.last_login).toLocaleDateString() : '—'}
                </td>
                <td className="py-3 px-3">
                  {u.id !== user?.id && u.role !== 'admin' && (
                    <button className="btn-sm btn-danger" disabled={deletingId === u.id}
                      onClick={() => handleDeleteUser(u.id, u.username)}>
                      {deletingId === u.id ? '...' : '🗑️ Delete'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* How to make admin */}
      <div className="glass rounded-2xl p-4 border border-white/6">
        <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-2">How to grant admin access</p>
        <p className="text-xs text-surface-400 mb-2">Run this in your terminal from the backend folder:</p>
        <div className="bg-surface-950 rounded-xl p-3 font-mono text-xs text-accent-400 border border-white/6">
          sqlite3 pathfinding.db "UPDATE users SET role='admin' WHERE email='user@example.com';"
        </div>
      </div>
    </div>
  );
};
