import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, UserX, DollarSign, Wallet, Activity } from 'lucide-react';
import { getDashboard } from '../services/api';
import { useAuth } from '../App';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const isSalesman = user?.role === 'salesman';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const dashboardData = await getDashboard();
      setData(dashboardData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="mb-4">Dashboard Overview</h1>
      
      <div className="grid grid-cols-2 md-grid-cols-2 lg-grid-cols-3 dashboard-grid">
        <Link to="/loopers" className="card dashboard-card">
          <div className="card-title text-truncate">
            <Users size={20} className="flex-shrink-0" /> Clients
          </div>
          <div className="card-value">{data?.total_loopers || 0}</div>
        </Link>
        
        <Link to="/loopers?status=active" className="card dashboard-card">
          <div className="card-title text-truncate">
            <UserCheck size={20} className="flex-shrink-0" /> Active
          </div>
          <div className="card-value positive">{data?.active_loopers || 0}</div>
        </Link>
        
        <Link to="/loopers?status=inactive" className="card dashboard-card">
          <div className="card-title text-truncate">
            <UserX size={20} className="flex-shrink-0" /> Inactive
          </div>
          <div className="card-value negative">{data?.inactive_loopers || 0}</div>
        </Link>

        {/* New Active Users Tile - Restricted to Super Admin only */}
        {user?.role === 'superuser' && (
          <Link to="/users?status=active" className="card dashboard-card">
            <div className="card-title text-truncate">
              <Activity size={20} className="flex-shrink-0" /> Active Users
            </div>
            <div className="card-value positive">{data?.active_users_count || 0}</div>
            <p className="text-sub mt-2">Currently using the app</p>
          </Link>
        )}

        {!isSalesman && (
          <>
            <Link to="/loopers" className="card dashboard-card">
              <div className="card-title text-truncate">
                <DollarSign size={20} className="flex-shrink-0" /> Revenue
              </div>
              <div className="card-value neutral">{formatCurrency(data?.total_revenue || 0)}</div>
            </Link>

            <Link to="/loopers?has_balance=true" className="card dashboard-card" style={{ gridColumn: 'span 2' }}>
              <div className="card-title text-truncate">
                <Wallet size={20} className="flex-shrink-0" /> Pending Collection
              </div>
              <div className={`card-value ${data?.total_remaining_balance > 0 ? 'negative' : 'positive'}`}>
                {formatCurrency(data?.total_remaining_balance || 0)}
              </div>
              {data?.total_remaining_balance > 0 && (
                <p className="text-sub mt-2" style={{ color: 'var(--danger)' }}>This amount is yet to be collected from Clients.</p>
              )}
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
