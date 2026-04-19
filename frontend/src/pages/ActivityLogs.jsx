import React, { useState, useEffect } from 'react';
import { getActivityLogs, getUsers } from '../services/api';
import { History, Search, Filter, ArrowLeft, Loader2, Calendar, User as UserIcon, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    user_id: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchLogs();
    fetchUsers();
  }, []);

  // Effect to fetch logs when user_id filter changes
  useEffect(() => {
    fetchLogs();
  }, [filters.user_id]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const cleanFilters = {};
      if (filters.user_id) cleanFilters.user_id = filters.user_id;
      
      const data = await getActivityLogs(cleanFilters);
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleUserChange = (e) => {
    setFilters({ user_id: e.target.value });
  };

  return (
    <div className="container py-4">
      <div className="page-header d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-icon-only btn-outline" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="h2 mb-0">Activity Feed</h1>
            <p className="text-sub mb-0">Real-time application events and system actions</p>
          </div>
        </div>
        
        <div className="d-flex align-items-center gap-2 bg-white p-2 rounded-lg border shadow-sm" style={{ minWidth: '280px' }}>
          <div className="bg-light p-2 rounded text-muted">
            <Filter size={18} />
          </div>
          <select 
            name="user_id" 
            className="form-control border-0 bg-transparent py-0 shadow-none" 
            style={{ fontSize: '0.95rem', height: '38px', cursor: 'pointer' }}
            value={filters.user_id}
            onChange={handleUserChange}
          >
            <option value="">All Users Activity</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.username}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {loading ? (
          <div className="p-5 text-center">
            <Loader2 className="animate-spin text-primary mx-auto" size={32} />
            <p className="mt-2 text-muted">Synchronizing feed...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-5 text-center text-muted">
            <History size={48} className="mx-auto mb-3 opacity-20" />
            <p>No activity logs found for the current selection.</p>
          </div>
        ) : (
          <div className="list-group">
            {logs.map((log, index) => (
              <div key={log.id} className="list-item d-flex align-items-start gap-3 p-4 border-bottom hover-bg-light transition-all cursor-default">
                <div className={`icon-wrapper ${log.action.toLowerCase().includes('delete') ? 'bg-danger-light text-danger' : 'bg-primary-light text-primary'} rounded-circle p-3 d-flex align-items-center justify-content-center`} style={{ width: '48px', height: '48px', flexShrink: 0 }}>
                  <Activity size={20} />
                </div>
                <div className="flex-1">
                  <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold text-main">{log.username}</span>
                      <span className="text-muted">•</span>
                      <span className={`badge ${log.action.toLowerCase().includes('delete') ? 'badge-danger' : 'badge-primary'} badge-pill`}>
                        {log.action}
                      </span>
                    </div>
                    <div className="text-muted small d-flex align-items-center gap-1">
                      <Calendar size={12} />
                      <span>{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(log.created_at))}</span>
                    </div>
                  </div>
                  <div className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>
                    {log.details || 'No additional details available for this action.'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
