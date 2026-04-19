import React, { useState, useEffect } from 'react';
import { getUsers, createUser, deleteUser, getLoopers } from '../services/api';
import { UserPlus, Trash2, Users, Shield, User as UserIcon, Loader2, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loopers, setLoopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'salesman',
    looper_id: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersData, loopersData] = await Promise.all([getUsers(), getLoopers()]);
      
      // Filter if needed
      const queryParams = new URLSearchParams(window.location.search);
      let filteredUsers = usersData;
      if (queryParams.get('status') === 'active') {
        const threshold = new Date(Date.now() - 5 * 60 * 1000);
        filteredUsers = usersData.filter(u => u.last_active_at && new Date(u.last_active_at) >= threshold);
      }
      
      setUsers(filteredUsers);
      setLoopers(loopersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData };
      if (data.role !== 'looper') delete data.looper_id;
      if (data.looper_id === '') delete data.looper_id;
      
      await createUser(data);
      setShowModal(false);
      setFormData({ username: '', password: '', role: 'salesman', looper_id: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error creating user');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        fetchData();
      } catch (error) {
        alert(error.response?.data?.detail || 'Error deleting user');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '80vh' }}>
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="page-header">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-icon-only btn-outline" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="h2 mb-0">User Management</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <UserPlus size={20} /> <span className="hide-mobile">Add User</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-4 mt-4">
        {users.map(user => (
          <div key={user.id} className="card p-4 animate-slide-up">
            <div className="d-flex justify-content-between align-items-start">
              <div className="d-flex align-items-center gap-3">
                <div className={`icon-wrapper bg-${user.role === 'superuser' ? 'primary' : 'secondary'} text-white`}>
                  {user.role === 'superuser' ? <Shield size={24} /> : <UserIcon size={24} />}
                </div>
                <div>
                  <h3 className="h5 mb-0">{user.username}</h3>
                  <span className={`badge ${user.role === 'superuser' ? 'badge-primary' : 'badge-outline'}`}>
                    {user.role.toUpperCase()}
                  </span>
                </div>
              </div>
              <button 
                className="btn btn-icon-only text-danger" 
                onClick={() => handleDelete(user.id)}
                title="Delete User"
              >
                <Trash2 size={20} />
              </button>
            </div>
            
            <div className="mt-3 text-muted small">
              <div className="d-flex justify-content-between mb-1">
                <span>Status:</span>
                <span className="d-flex align-items-center gap-1">
                  {user.is_active ? <CheckCircle2 size={14} className="text-success" /> : <XCircle size={14} className="text-danger" />}
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span>Activity:</span>
                <span className="d-flex align-items-center gap-1">
                  {user.last_active_at && new Date(user.last_active_at) >= new Date(Date.now() - 5 * 60 * 1000) ? (
                    <><div className="bg-success rounded-circle" style={{width: '8px', height: '8px', animation: 'pulse-green 2s infinite'}}></div> <span className="text-success fw-bold">Online</span></>
                  ) : (
                    <span className="text-muted">Offline</span>
                  )}
                </span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Joined:</span>
                <span>{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
              {user.role === 'looper' && user.looper_id && (
                <div className="d-flex justify-content-between mt-1">
                  <span>Linked Looper:</span>
                  <span className="text-primary">ID #{user.looper_id}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New User</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  required 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select 
                  className="form-control" 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="manager">Manager</option>
                  <option value="salesman">Salesman</option>
                  <option value="looper">Looper</option>
                  <option value="superuser">Superuser</option>
                </select>
              </div>

              {formData.role === 'looper' && (
                <div className="form-group">
                  <label className="form-label">Link to Looper Profile</label>
                  <select 
                    className="form-control" 
                    required
                    value={formData.looper_id}
                    onChange={e => setFormData({...formData, looper_id: e.target.value})}
                  >
                    <option value="">Select a Looper</option>
                    {loopers.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.mobile})</option>
                    ))}
                  </select>
                </div>
              )}

              <button className="btn btn-primary btn-block mt-4">Create User</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
