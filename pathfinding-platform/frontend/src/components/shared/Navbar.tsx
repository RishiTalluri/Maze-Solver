import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLinks = isAuthenticated
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
        { to: '/editor', label: 'Editor', icon: '✏' },
        { to: '/mazes', label: 'Browse', icon: '◫' },
        { to: '/mazes/mine', label: 'My Mazes', icon: '◈' },
        { to: '/experiments', label: 'Experiments', icon: '⚗' },
        { to: '/analytics', label: 'Analytics', icon: '◎' },
      ]
    : [{ to: '/mazes', label: 'Browse', icon: '◫' }];

  const isActive = (to: string) => to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <nav className="sticky top-0 z-40 bg-surface-900/80 backdrop-blur-xl border-b border-white/6">
      {/* Thin orange top border */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"/>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-12 gap-3">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 mr-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #b93f16)' }}>
              <span className="text-white text-[10px] font-black relative z-10">PF</span>
            </div>
            <span className="text-sm font-black tracking-tight hidden sm:block">
              <span className="text-gradient-orange">Path</span>
              <span className="text-surface-200">Finder</span>
            </span>
          </Link>

          {/* Divider */}
          <div className="divider h-5 hidden md:block"/>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-0.5 flex-1">
            {navLinks.map(({ to, label, icon }) => (
              <Link key={to} to={to}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all
                  ${isActive(to)
                    ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                    : 'text-surface-400 hover:text-surface-100 hover:bg-white/5'
                  }`}>
                <span className="text-[10px] opacity-70">{icon}</span>
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Quick action */}
            {isAuthenticated && (
              <Link to="/editor"
                className="hidden sm:flex btn-sm btn-primary">
                + New Maze
              </Link>
            )}

            {isAuthenticated ? (
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl glass text-xs font-semibold text-surface-200 hover:text-white transition-all">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                    style={{ background: 'linear-gradient(135deg, #FF6B35, #b93f16)' }}>
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden sm:block max-w-[80px] truncate">{user?.username}</span>
                  <svg className="w-3 h-3 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 glass-strong rounded-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/6">
                      <div className="text-xs font-bold text-surface-100">{user?.username}</div>
                      <div className="text-[10px] text-surface-400 truncate">{user?.email}</div>
                      {user?.role === 'admin' && <span className="badge-orange text-[9px] mt-1">ADMIN</span>}
                    </div>
                    {[
                      { to: '/profile',     icon: '👤', label: 'Profile' },
                      { to: '/mazes/mine',  icon: '🧩', label: 'My Mazes' },
                      { to: '/experiments', icon: '🧪', label: 'Experiments' },
                      ...(user?.role === 'admin' ? [{ to: '/admin', icon: '⚙️', label: 'Admin Panel' }] : []),
                    ].map(({ to, icon, label }) => (
                      <Link key={to} to={to}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-300 hover:bg-white/6 hover:text-white transition-colors">
                        <span className="text-sm">{icon}</span>{label}
                      </Link>
                    ))}
                    <div className="border-t border-white/6"/>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                      🚪 Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link to="/login" className="btn-sm btn-ghost">Sign in</Link>
                <Link to="/register" className="btn-sm btn-primary">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  useEffect(() => { if (!isAuthenticated) navigate('/login', { replace: true }); }, [isAuthenticated, navigate]);
  if (!isAuthenticated) return null;
  return <>{children}</>;
};
