import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Navbar } from './components/shared/Navbar';
import { ProtectedRoute } from './components/shared/Navbar';

import { LandingPage }     from './pages/Landing';
import { LoginPage }       from './pages/Login';
import { RegisterPage }    from './pages/Register';
import { EditorPage }      from './pages/Editor';
import { DashboardPage }   from './pages/Dashboard';
import { MazeBrowserPage } from './pages/MazeBrowser';
import { MyMazesPage }     from './pages/MyMazes';
import { ExperimentsPage } from './pages/Experiments';
import { AnalyticsPage }   from './pages/Analytics';
import { ProfilePage }     from './pages/Profile';
import { AdminPage }       from './pages/Admin';
import { SharedMazePage }  from './pages/SharedMaze';

const NotFound: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div className="text-6xl font-black text-gradient-orange mb-4">404</div>
    <p className="text-surface-400 mb-6">Page not found</p>
    <a href="/" className="btn-md btn-ghost">← Go home</a>
  </div>
);

// Pages that get their own full-screen background (no navbar)
const HIDE_NAV = ['/editor', '/login', '/register', '/shared'];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const hideNav = HIDE_NAV.some(p => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #1E1E1E 0%, #242424 40%, #1a120d 75%, #121212 100%)' }}>
      {!hideNav && <Navbar />}
      {children}
    </div>
  );
};

export default function App() {
  const { loadUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* No-nav pages */}
          <Route path="/login"         element={<LoginPage />} />
          <Route path="/register"      element={<RegisterPage />} />
          <Route path="/shared/:token" element={<SharedMazePage />} />
          <Route path="/editor"        element={<EditorPage />} />
          <Route path="/editor/:id"    element={<EditorPage />} />

          {/* Public */}
          <Route path="/"              element={<LandingPage />} />
          <Route path="/mazes"         element={<MazeBrowserPage />} />

          {/* Protected */}
          <Route path="/dashboard"     element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/mazes/mine"    element={<ProtectedRoute><MyMazesPage /></ProtectedRoute>} />
          <Route path="/experiments"   element={<ProtectedRoute><ExperimentsPage /></ProtectedRoute>} />
          <Route path="/analytics"     element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/profile"       element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/admin"         element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />

          <Route path="*"              element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
