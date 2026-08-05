import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { mazesApi } from '../api/mazes';
import { Maze } from '../types';
import { Spinner } from '../components/ui';
import { useAuthStore } from '../store/authStore';

export const SharedMazePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [maze, setMaze] = useState<Maze | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [duplicating, setDuplicating] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    mazesApi.getShared(token)
      .then(res => setMaze(res.data))
      .catch(() => setError('This link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleDuplicate = async () => {
    if (!maze) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    setDuplicating(true);
    try { const res = await mazesApi.duplicate(maze.id); navigate(`/editor/${res.data.id}`); }
    catch { alert('Failed to copy maze'); }
    finally { setDuplicating(false); }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen" style={{ background: '#1E1E1E' }}>
      <Spinner size="lg" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4"
      style={{ background: 'linear-gradient(135deg, #1E1E1E 0%, #242424 50%, #1a120d 100%)' }}>
      <div className="text-5xl mb-4 opacity-50">🔗</div>
      <h1 className="text-xl font-bold text-surface-100 mb-2">Link not found</h1>
      <p className="text-surface-400 text-sm mb-6">{error}</p>
      <Link to="/mazes"><button className="btn-md btn-ghost">Browse public mazes</button></Link>
    </div>
  );

  if (!maze) return null;

  const cellSize = Math.min(14, Math.max(4, Math.floor(380 / Math.max(maze.rows, maze.cols))));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #1E1E1E 0%, #242424 50%, #1a120d 100%)' }}>
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />

      <div className="relative w-full max-w-2xl mb-6">
        <Link to="/" className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-300 transition-colors">
          <span>←</span> PathFinder
        </Link>
      </div>

      <div className="relative w-full max-w-2xl glass-strong rounded-2xl overflow-hidden">
        {/* Header gradient */}
        <div className="px-6 py-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.2) 0%, rgba(255,209,102,0.1) 100%)' }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.1), transparent)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs font-semibold mb-2 text-primary-400">
              <span>🔗</span> Shared Maze
            </div>
            <h1 className="text-2xl font-black text-surface-50">{maze.name}</h1>
            {maze.description && <p className="text-surface-300 text-sm mt-1">{maze.description}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-surface-400 font-mono">
              <span>{maze.rows}×{maze.cols}</span>
              {maze.difficulty && <span>· {maze.difficulty}</span>}
              {maze.owner && <span>· by <span className="text-surface-300">{maze.owner.username}</span></span>}
              <span>· 👁 {maze.view_count} views</span>
            </div>
          </div>
        </div>

        {/* Grid preview */}
        <div className="flex justify-center p-8" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="inline-block rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            {maze.grid_data.map((row, r) => (
              <div key={r} style={{ display: 'flex' }}>
                {row.map((cell, c) => {
                  let bg = 'rgba(255,255,255,0.025)';
                  if (cell === 1) bg = '#121212';
                  if (cell === 2) bg = '#FFD166';
                  if (cell === 3) bg = '#FF6B35';
                  return <div key={c} style={{ width: cellSize, height: cellSize, backgroundColor: bg, border: '0.5px solid rgba(255,255,255,0.04)', boxSizing: 'border-box' }} />;
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex flex-wrap gap-3 border-t border-white/6">
          <button onClick={handleDuplicate} disabled={duplicating} className="flex-1 btn-lg btn-primary">
            {duplicating ? 'Copying...' : (isAuthenticated ? '⊕ Copy to My Mazes' : '⊕ Sign in to Copy')}
          </button>
          <Link to={`/editor/${maze.id}`} className="flex-1">
            <button className="w-full btn-lg btn-ghost">Open in Editor</button>
          </Link>
          <Link to="/mazes">
            <button className="btn-lg btn-outline">Browse More</button>
          </Link>
        </div>
      </div>
    </div>
  );
};
