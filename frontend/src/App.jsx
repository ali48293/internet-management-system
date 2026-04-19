import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { Globe, Users, LayoutDashboard, LogOut } from 'lucide-react';
import { login } from './services/api';

// Pages
import Dashboard from './pages/Dashboard';
import Loopers from './pages/Loopers';
import LooperDetail from './pages/LooperDetail';

import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import ActivityLogs from './pages/ActivityLogs';
import { me, logout as apiLogout } from './services/api';
import { ShieldCheck, History } from 'lucide-react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

const Navigation = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const companyName = import.meta.env.VITE_COMPANY_NAME || 'Loopers';
  
  if (location.pathname === '/login') return null;
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="app-title">
          <Globe color="var(--primary)" size={28} />
          <span>{companyName}</span>
        </div>
        <nav className="d-flex gap-2">
          {user?.role !== 'looper' && (
            <Link to="/" className={`btn btn-icon-only ${location.pathname === '/' ? 'btn-primary' : 'btn-outline'}`} title="Dashboard">
              <LayoutDashboard size={20} />
            </Link>
          )}
          <Link to="/loopers" className={`btn btn-icon-only ${location.pathname.startsWith('/loopers') ? 'btn-primary' : 'btn-outline'}`} title="Loopers">
            <Users size={20} />
          </Link>
          {user?.role === 'superuser' && (
            <>
              <Link to="/users" className={`btn btn-icon-only ${location.pathname === '/users' ? 'btn-primary' : 'btn-outline'}`} title="Users">
                <ShieldCheck size={20} />
              </Link>
              <Link to="/activity" className={`btn btn-icon-only ${location.pathname === '/activity' ? 'btn-primary' : 'btn-outline'}`} title="Activity Logs">
                <History size={20} />
              </Link>
            </>
          )}
          <button onClick={logout} className="btn btn-icon-only btn-outline text-sub" title="Logout">
            <LogOut size={20} />
          </button>
        </nav>
      </div>
    </header>
  );
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const data = await me();
      setUser(data);
    } catch (e) {
      console.error("Auth error:", e);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const data = await login(username, password);
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.error("Logout error:", e);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ token, user, login: handleLogin, logout: handleLogout }}>
      <Router>
        <Navigation />
        <main className="main-content">
          <div className="container">
            <Routes>
              <Route path="/login" element={token ? <Navigate to={user?.role === 'looper' ? `/loopers/${user.looper_id}` : "/"} /> : <Login />} />
              <Route path="/" element={<ProtectedRoute>{user?.role === 'looper' ? <Navigate to={`/loopers/${user.looper_id}`} /> : <Dashboard />}</ProtectedRoute>} />
              <Route path="/loopers" element={<ProtectedRoute>{user?.role === 'looper' ? <Navigate to={`/loopers/${user.looper_id}`} /> : <Loopers />}</ProtectedRoute>} />
              <Route path="/loopers/:id" element={<ProtectedRoute><LooperDetail /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute>{user?.role === 'superuser' ? <UserManagement /> : <Navigate to="/" />}</ProtectedRoute>} />
              <Route path="/activity" element={<ProtectedRoute>{user?.role === 'superuser' ? <ActivityLogs /> : <Navigate to="/" />}</ProtectedRoute>} />
            </Routes>
          </div>
        </main>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
