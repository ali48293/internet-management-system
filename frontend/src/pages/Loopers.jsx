import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, UserPlus, Image as ImageIcon, CheckCircle, Download } from 'lucide-react';
import { getLoopers, createLooper, createPurchase, createPayment, downloadLooperReport } from '../services/api';
import { useAuth } from '../App';

const Loopers = () => {
  const [loopers, setLoopers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isManagerOrSalesman = user?.role === 'superuser' || user?.role === 'manager' || user?.role === 'salesman';
  
  // Form state
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [cnicFront, setCnicFront] = useState(null);
  const [cnicBack, setCnicBack] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const statusFilter = query.get('status');
  const balanceFilter = query.get('has_balance');

  const companyName = import.meta.env.VITE_COMPANY_NAME || 'Loopers';

  const fetchData = async () => {
    try {
      const data = await getLoopers();
      setLoopers(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddLooper = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // 1. Create the Looper
      const formData = new FormData();
      formData.append('name', name);
      formData.append('mobile', mobile);
      formData.append('is_active', "true");
      if (cnicFront) formData.append('cnic_front', cnicFront);
      if (cnicBack) formData.append('cnic_back', cnicBack);
      if (profilePic) formData.append('profile_pic', profilePic);
      
      const newLooper = await createLooper(formData);

      // Success
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch(e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  const handleDownloadReport = async (e, looper) => {
    e.stopPropagation();
    try {
      const blob = await downloadLooperReport(looper.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      const now = new Date();
      const timestamp = now.toISOString().split('T')[0] + '_' + now.getHours() + '-' + now.getMinutes() + '-' + now.getSeconds();
      link.setAttribute('download', `${looper.name.replace(/\s+/g, '_')}_${timestamp}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const resetForm = () => {
    setName('');
    setMobile('');
    setCnicFront(null);
    setCnicBack(null);
    setProfilePic(null);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString();
  };

  // Filtering Logic
  const filteredLoopers = loopers.filter(l => {
    if (statusFilter === 'active' && !l.is_active) return false;
    if (statusFilter === 'inactive' && l.is_active) return false;
    if (balanceFilter === 'true' && l.balance <= 0) return false;
    if (searchQuery && !l.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{companyName} Clients</h1>
          {(statusFilter || balanceFilter) && (
            <p className="text-sub">
              Showing: {statusFilter || ''} {balanceFilter ? 'with balance' : ''} 
              <button className="btn btn-link" onClick={() => navigate('/loopers')} style={{ padding: '0 0.5rem', textDecoration: 'underline' }}>Clear</button>
            </p>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={20} /> Add Client
        </button>
      </div>

      <div className="search-bar mb-4">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search clients by name..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="list-container">
        {loading ? (
          <div>Loading...</div>
        ) : filteredLoopers.length === 0 ? (
          <div className="card text-center" style={{ padding: '3rem 1rem' }}>
            <p className="text-sub">No Clients found.</p>
          </div>
        ) : (
          filteredLoopers.map((looper, index) => (
            <div key={looper.id} className="list-item" onClick={() => navigate(`/loopers/${looper.id}`)}>
              <div className="text-sub font-bold" style={{ width: '30px' }}>#{index + 1}</div>
              <div className="list-item-content">
                <div className="avatar">
                  {looper.profile_pic_url ? (
                    <img src={looper.profile_pic_url} alt={looper.name} />
                  ) : (
                    looper.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="list-item-title text-truncate">{looper.name}</div>
                  <div className="d-flex flex-wrap align-center gap-1">
                    <span className="text-sub font-bold">{looper.mobile}</span>
                    <span className={`status-badge ${looper.is_active ? 'status-active' : 'status-inactive'}`}>
                      {looper.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="balance-display" style={{ gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 }}>
                  {looper.package_names && looper.package_names.length > 0 && (
                    <div className="d-flex flex-wrap align-center" style={{ gap: '0.25rem' }}>
                      {looper.package_names.slice(0, 3).map((pkg, idx) => (
                        <span key={idx} style={{ 
                          fontSize: '0.7rem', 
                          padding: '0.15rem 0.4rem', 
                          background: 'rgba(59, 130, 246, 0.1)', 
                          color: 'var(--secondary)', 
                          borderRadius: 'var(--radius-full)',
                          whiteSpace: 'nowrap'
                        }}>
                          {pkg}
                        </span>
                      ))}
                      {looper.package_names.length > 3 && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+{looper.package_names.length - 3}</span>
                      )}
                    </div>
                  )}

                  {looper.balance <= 0 ? (
                    <span className="status-badge status-active" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>Payment Cleared</span>
                  ) : (
                    <span className="status-badge status-inactive" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>Clearance pending</span>
                  )}
                </div>

                {looper.balance > 0 && (
                  <div className="balance-amount negative">
                    {formatCurrency(looper.balance)}
                  </div>
                )}
                
                {isManagerOrSalesman && (
                  <button 
                    className="btn btn-icon-only btn-outline" 
                    onClick={(e) => handleDownloadReport(e, looper)}
                    title="Add Current Month Report"
                    style={{ marginLeft: '0.5rem', border: 'none', background: 'rgba(59, 130, 246, 0.05)' }}
                  >
                    <Download size={18} color="var(--primary)" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>Add New Client</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddLooper} className="unified-form">
              <section className="form-section">
                <div className="section-title"><UserPlus size={18} /> Basic Information</div>
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. John Doe" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input type="number" className="form-control" value={mobile} onChange={e => setMobile(e.target.value)} required placeholder="03xxxxxxxxx" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Profile Picture (Optional)</label>
                  <div className="file-upload-wrapper">
                    <div className="file-upload-btn" style={{ padding: '0.75rem' }}>
                      <ImageIcon size={20} />
                      <span>{profilePic ? profilePic.name : 'Choose Photo'}</span>
                    </div>
                    <input type="file" accept="image/*" onChange={e => setProfilePic(e.target.files[0])} />
                  </div>
                </div>

                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">ID Card (Front)</label>
                    <div className="file-upload-wrapper">
                      <div className="file-upload-btn" style={{ padding: '0.75rem' }}>
                        <Plus size={20} />
                        <span>{cnicFront ? cnicFront.name : 'Choose Front'}</span>
                      </div>
                      <input type="file" accept="image/*" onChange={e => setCnicFront(e.target.files[0])} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">ID Card (Back)</label>
                    <div className="file-upload-wrapper">
                      <div className="file-upload-btn" style={{ padding: '0.75rem' }}>
                        <Plus size={20} />
                        <span>{cnicBack ? cnicBack.name : 'Choose Back'}</span>
                      </div>
                      <input type="file" accept="image/*" onChange={e => setCnicBack(e.target.files[0])} />
                    </div>
                  </div>
                </div>
              </section>

              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting} style={{ marginTop: '1.5rem' }}>
                {submitting ? 'Creating Profile...' : 'Complete Client Registration'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loopers;
