import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mazesApi } from '../api/mazes';
import { MazeSummary } from '../types';
import { Spinner, EmptyState, Modal, Input, SectionHeader } from '../components/ui';

export const MyMazesPage: React.FC = () => {
  const [mazes, setMazes] = useState<MazeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [renameModal, setRenameModal] = useState<MazeSummary | null>(null);
  const [newName, setNewName] = useState('');
  const [shareModal, setShareModal] = useState<MazeSummary | null>(null);
  const [shareToken, setShareToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchMazes = useCallback(() => {
    setLoading(true);
    mazesApi.getMine(page)
      .then(res => { setMazes(res.data.items); setTotalPages(res.data.pages); })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchMazes(); }, [fetchMazes]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? Cannot be undone.`)) return;
    setProcessing(id);
    try { await mazesApi.delete(id); setMazes(prev => prev.filter(m => m.id !== id)); }
    finally { setProcessing(null); }
  };

  const handleDuplicate = async (id: string) => {
    setProcessing(id);
    try { const res = await mazesApi.duplicate(id); navigate(`/editor/${res.data.id}`); }
    finally { setProcessing(null); }
  };

  const handleRename = async () => {
    if (!renameModal || !newName.trim()) return;
    setProcessing(renameModal.id);
    try {
      await mazesApi.update(renameModal.id, { name: newName.trim() });
      setMazes(prev => prev.map(m => m.id === renameModal.id ? { ...m, name: newName.trim() } : m));
      setRenameModal(null);
    } finally { setProcessing(null); }
  };

  const handleTogglePublic = async (maze: MazeSummary) => {
    setProcessing(maze.id);
    try {
      await mazesApi.update(maze.id, { is_public: !maze.is_public });
      setMazes(prev => prev.map(m => m.id === maze.id ? { ...m, is_public: !maze.is_public } : m));
    } finally { setProcessing(null); }
  };

  const handleShare = async (maze: MazeSummary) => {
    setShareModal(maze); setShareToken(''); setCopied(false);
    try {
      const res = await mazesApi.createShareLink(maze.id, 7);
      setShareToken(`${window.location.origin}/shared/${res.data.token}`);
    } catch { setShareToken('Failed to generate link'); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareToken);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const DIFF_COLORS: Record<string, string> = { easy: '#FFD166', medium: '#f59e0b', hard: '#f97316', expert: '#ef4444' };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <SectionHeader title="My Mazes" subtitle="Manage your saved mazes"
        action={<Link to="/editor"><button className="btn-md btn-primary">+ New Maze</button></Link>}/>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : mazes.length === 0 ? (
        <EmptyState icon="🧩" title="No mazes yet" description="Create your first maze in the editor" />
      ) : (
        <div className="space-y-2">
          {mazes.map(maze => (
            <div key={maze.id} className="glass rounded-xl px-4 py-3 hover:bg-white/5 transition-all">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-surface-100">{maze.name}</span>
                    {maze.difficulty && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ color: DIFF_COLORS[maze.difficulty] || '#888', background: `${DIFF_COLORS[maze.difficulty] || '#888'}18`, border: `1px solid ${DIFF_COLORS[maze.difficulty] || '#888'}30` }}>
                        {maze.difficulty}
                      </span>
                    )}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${maze.is_public ? 'badge-green' : 'badge-gray'}`}>
                      {maze.is_public ? 'PUBLIC' : 'PRIVATE'}
                    </span>
                  </div>
                  <div className="text-[10px] text-surface-500 font-mono mt-0.5">
                    {maze.rows}×{maze.cols} · 👁 {maze.view_count} · {new Date(maze.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <Link to={`/editor/${maze.id}`}><button className="btn-sm btn-primary">Edit</button></Link>
                  <button className="btn-sm btn-ghost" onClick={() => handleDuplicate(maze.id)} disabled={processing === maze.id}>Copy</button>
                  <button className="btn-sm btn-ghost" onClick={() => handleTogglePublic(maze)} disabled={processing === maze.id}>
                    {maze.is_public ? 'Make Private' : 'Publish'}
                  </button>
                  <button className="btn-sm btn-ghost" onClick={() => { setRenameModal(maze); setNewName(maze.name); }}>Rename</button>
                  <button className="btn-sm btn-ghost" onClick={() => handleShare(maze)}>🔗 Share</button>
                  <button className="btn-sm btn-danger" onClick={() => handleDelete(maze.id, maze.name)} disabled={processing === maze.id} title="Delete maze">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <button className="btn-sm btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="text-sm text-surface-500 font-mono">{page} / {totalPages}</span>
          <button className="btn-sm btn-ghost" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      <Modal open={!!renameModal} onClose={() => setRenameModal(null)} title="Rename Maze">
        <div className="space-y-4">
          <Input label="New name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="My awesome maze" />
          <div className="flex gap-2">
            <button className="flex-1 btn-md btn-primary" onClick={handleRename} disabled={!!processing}>Save</button>
            <button className="btn-md btn-ghost" onClick={() => setRenameModal(null)}>Cancel</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!shareModal} onClose={() => { setShareModal(null); setShareToken(''); }} title="🔗 Share Maze">
        <div className="space-y-4">
          <p className="text-surface-400 text-sm">Anyone with this link can view and copy <strong className="text-surface-200">{shareModal?.name}</strong>. Expires in 7 days.</p>
          {shareToken ? (
            <div className="flex gap-2">
              <input readOnly value={shareToken} className="input flex-1 text-xs font-mono" />
              <button onClick={handleCopy} className={`btn-sm ${copied ? 'btn-accent' : 'btn-ghost'}`}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          ) : (
            <div className="flex justify-center py-4"><Spinner /></div>
          )}
          <button className="w-full btn-md btn-ghost" onClick={() => { setShareModal(null); setShareToken(''); }}>Close</button>
        </div>
      </Modal>
    </div>
  );
};
