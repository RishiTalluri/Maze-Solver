import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mazesApi } from '../api/mazes';
import { MazeSummary } from '../types';
import { Spinner, EmptyState, SectionHeader } from '../components/ui';
import { useAuthStore } from '../store/authStore';

const DIFFICULTIES = ['','easy','medium','hard','expert'];
const DIFF_COLORS: Record<string,string> = { easy:'#FFD166', medium:'#f59e0b', hard:'#f97316', expert:'#ef4444' };

export const MazeBrowserPage: React.FC = () => {
  const [mazes, setMazes] = useState<MazeSummary[]>([]);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const fetchMazes = useCallback(() => {
    setLoading(true);
    mazesApi.listPublic({page, q:search||undefined, difficulty:difficulty||undefined})
      .then(res=>{ setMazes(res.data.items); setTotalPages(res.data.pages); setTotal(res.data.total); })
      .finally(()=>setLoading(false));
  }, [page, search, difficulty]);

  useEffect(()=>{ fetchMazes(); }, [fetchMazes]);

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    try { const res = await mazesApi.duplicate(id); navigate(`/editor/${res.data.id}`); } catch {}
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SectionHeader title="Browse Mazes" subtitle={`${total} public maze${total!==1?'s':''} from the community`}
        action={isAuthenticated ? <Link to="/editor"><button className="btn-md btn-primary">+ Create</button></Link> : undefined}/>

      <div className="glass rounded-2xl p-4 mb-6 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">🔍</span>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
            placeholder="Search mazes by name..."
            className="input pl-9 w-full"/>
        </div>
        <select value={difficulty} onChange={e=>{setDifficulty(e.target.value);setPage(1);}} className="input w-auto">
          {DIFFICULTIES.map(d=><option key={d} value={d}>{d?d.charAt(0).toUpperCase()+d.slice(1):'All difficulties'}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner/></div>
      ) : mazes.length===0 ? (
        <EmptyState icon="🔍" title="No mazes found" description="Try different search terms"/>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mazes.map(maze=>(
            <div key={maze.id} className="glass-card group">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-surface-100 group-hover:text-white transition-colors text-sm truncate">{maze.name}</h3>
                {maze.difficulty && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-2 shrink-0"
                    style={{ color:DIFF_COLORS[maze.difficulty]||'#888', background:`${DIFF_COLORS[maze.difficulty]||'#888'}18`, border:`1px solid ${DIFF_COLORS[maze.difficulty]||'#888'}30` }}>
                    {maze.difficulty}
                  </span>
                )}
              </div>
              <div className="text-xs text-surface-500 font-mono mb-0.5">{maze.rows}×{maze.cols}</div>
              <div className="text-xs text-surface-600 mb-4">by <span className="text-surface-400">{maze.owner?.username||'anonymous'}</span></div>
              <div className="flex gap-2">
                <Link to={`/editor/${maze.id}`} className="flex-1">
                  <button className="w-full btn-sm btn-outline">Open in Editor</button>
                </Link>
                <button onClick={e=>handleDuplicate(maze.id,e)} className="btn-sm btn-ghost">Copy</button>
              </div>
              <div className="flex justify-between mt-3 text-[9px] text-surface-600 font-mono">
                <span>👁 {maze.view_count}</span>
                <span>{new Date(maze.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages>1 && (
        <div className="flex justify-center items-center gap-3 mt-8">
          <button className="btn-sm btn-ghost" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
          <span className="text-sm text-surface-500 font-mono">Page {page} of {totalPages}</span>
          <button className="btn-sm btn-ghost" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next →</button>
        </div>
      )}
    </div>
  );
};
