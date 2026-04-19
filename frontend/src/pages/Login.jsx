import React, { useState } from 'react';
import { useAuth } from '../App';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const success = await login(username, password);
    if (!success) {
      setError('Invalid username or password');
    }
    setLoading(false);
  };

  const companyName = import.meta.env.VITE_COMPANY_NAME || 'Loopers';

  return (
    <div style={{ maxWidth: '400px', margin: '10vh auto' }}>
      <div className="card">
        <div className="text-center mb-4">
          <h1 className="app-title" style={{ justifyContent: 'center' }}>{companyName}</h1>
          <p className="text-sub mt-2">Login to manage your business</p>
        </div>
        
        {error && (
          <div style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-control" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '...' : <><LogIn size={20} /> Login</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
