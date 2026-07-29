import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MazeGrid } from '../components/editor/MazeGrid';
import { ControlsPanel } from '../components/editor/ControlsPanel';
import { Legend, ResultsPanel } from '../components/editor/StatsPanel';
import { useEditorStore } from '../store/editorStore';
import { useAuthStore } from '../store/authStore';
import { useSolver } from '../hooks/useSolver';
import { mazesApi } from '../api/mazes';
import { Modal, Input, Spinner } from '../components/ui';

export const EditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { grid, rows, cols, terrainGrid, showTerrain, results, isAnimating, clearAnimTimeouts } = useEditorStore();
  const { solve } = useSolver();
  const [loadingMaze, setLoadingMaze] = useState(false);
  const [saveModal, setSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [savePublic, setSavePublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [currentMazeId, setCurrentMazeId] = useState<string|undefined>(id);

  useEffect(() => {
    if (!id) return;
    setLoadingMaze(true);
    mazesApi.get(id).then(res => {
      const maze = res.data;
      useEditorStore.setState({ grid:maze.grid_data, terrainGrid:maze.terrain_data||useEditorStore.getState().terrainGrid, rows:maze.rows, cols:maze.cols, start:null, ends:[], animStates:{}, results:{} });
      let s: [number,number]|null=null; const e: [number,number][]=[];
      maze.grid_data.forEach((row: number[],r: number) => row.forEach((cell: number,c: number) => { if(cell===2)s=[r,c]; if(cell===3)e.push([r,c]); }));
      useEditorStore.setState({ start:s, ends:e });
      setSaveName(maze.name); setCurrentMazeId(maze.id);
    }).catch(()=>setError('Failed to load maze')).finally(()=>setLoadingMaze(false));
  }, [id]);

  const handleSolve = async () => { setError(null); try { await solve(currentMazeId); } catch(e: any) { setError(e.message); } };

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      if (currentMazeId) {
        await mazesApi.update(currentMazeId, { name:saveName, grid_data:grid, terrain_data:showTerrain?terrainGrid:null, rows, cols, is_public:savePublic });
      } else {
        const res = await mazesApi.create({ name:saveName, grid_data:grid, terrain_data:showTerrain?terrainGrid:null, rows, cols, is_public:savePublic });
        setCurrentMazeId(res.data.id); navigate(`/editor/${res.data.id}`,{replace:true});
      }
      setSaveModal(false);
    } catch(e: any) { setError(e.response?.data?.error||'Save failed'); }
    finally { setSaving(false); }
  };

  if (loadingMaze) return <div className="flex items-center justify-center min-h-screen" style={{ background:'#0d1829' }}><Spinner size="lg"/></div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background:'linear-gradient(160deg,#0d1829 0%,#182440 50%,#0f2318 100%)' }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-white/6 shrink-0" style={{ background:'rgba(13,24,41,0.95)' }}>
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background:'linear-gradient(135deg,#EA580C,#9a3412)' }}>
            <span className="text-white text-[9px] font-black">PF</span>
          </div>
        </Link>
        <div className="divider h-4"/>
        <span className="text-xs font-semibold text-surface-300">{currentMazeId ? saveName||'Maze Editor' : 'New Maze'}</span>
        {currentMazeId && <span className="badge-green text-[9px]">SAVED</span>}
        {error && <span className="text-[10px] text-red-400 font-medium ml-2">✗ {error}</span>}
        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated && (
            <button onClick={()=>setSaveModal(true)} className="btn-sm btn-ghost">💾 Save</button>
          )}
          <Link to="/dashboard" className="btn-sm btn-ghost text-surface-500">← Dashboard</Link>
        </div>
      </div>

      <ControlsPanel onSolve={handleSolve} onStop={clearAnimTimeouts}
        onSave={isAuthenticated?()=>setSaveModal(true):undefined}
        isSolving={isAnimating} hasResults={Object.keys(results).length>0} error={null}/>

      {/* Grid canvas */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-6">
        <MazeGrid disabled={isAnimating}/>
      </div>

      <Legend/>
      <ResultsPanel results={results}/>

      <Modal open={saveModal} onClose={()=>setSaveModal(false)} title="💾 Save Maze">
        <div className="space-y-4">
          <Input label="Maze name" value={saveName} onChange={e=>setSaveName(e.target.value)} placeholder="My awesome maze"/>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/8 cursor-pointer glass"
            onClick={()=>setSavePublic(!savePublic)}>
            <div className={`w-10 h-5 rounded-full relative transition-all ${savePublic?'bg-accent-500':'bg-surface-700'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${savePublic?'left-5':'left-0.5'}`}/>
            </div>
            <div>
              <div className="text-xs font-bold text-surface-200">Make public</div>
              <div className="text-[10px] text-surface-500">Anyone can view and copy this maze</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="flex-1 btn-md btn-primary">
              {saving?'Saving...':(currentMazeId?'Update':'Save Maze')}
            </button>
            <button onClick={()=>setSaveModal(false)} className="btn-md btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
