import React, { useEffect, useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { getPackages, createPackage, updatePackage, deletePackage } from '../services/api';

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const companyName = import.meta.env.VITE_COMPANY_NAME || 'AD Internet';

  const fetchPackages = async () => {
    try {
      const data = await getPackages();
      setPackages(data);
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleOpenAdd = () => {
    setEditingPackage(null);
    setName('');
    setPrice('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (pkg) => {
    setEditingPackage(pkg);
    setName(pkg.name);
    setPrice(pkg.price.toString());
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const pkgData = { name, price: parseFloat(price), data_amount_mb: 0 };
      if (editingPackage) {
        await updatePackage(editingPackage.id, pkgData);
      } else {
        await createPackage(pkgData);
      }
      setShowAddModal(false);
      fetchPackages();
    } catch(e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        await deletePackage(id);
        fetchPackages();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div>
      <div className="d-flex justify-between align-center mb-4">
        <h1>{companyName} Packages</h1>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={20} /> Create Package
        </button>
      </div>

      <div className="grid grid-cols-3">
        {loading ? <div>Loading...</div> : packages.length === 0 ? <div className="card text-center" style={{gridColumn: '1 / -1'}}><p className="text-sub">No packages. Create one.</p></div> : 
          packages.map(pkg => (
            <div key={pkg.id} className="card d-flex flex-column" style={{gap: '1rem', alignItems: 'center', textAlign: 'center', position: 'relative'}}>
              <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }} onClick={() => handleOpenEdit(pkg)}>
                  <Plus size={16} /> {/* Using Plus as Edit icon for simplicity if Lucide Edit not imported, but let's assume Lucide icons are available or use text */}
                </button>
                <button className="btn btn-outline text-danger" style={{ padding: '0.4rem', border: 'none' }} onClick={() => handleDelete(pkg.id)}>
                  &times;
                </button>
              </div>
              <div style={{background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '50%', color: 'var(--primary)'}}>
                <Package size={32} />
              </div>
              <h2 style={{fontSize: '1.5rem'}}>{pkg.name}</h2>
              <div className="text-sub" style={{fontSize: '1.25rem'}}>{formatCurrency(pkg.price)}</div>
            </div>
          ))
        }
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
               <h2>{editingPackage ? 'Update Package' : 'Create Package'}</h2>
               <button className="modal-close" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
               <div className="form-group">
                 <label className="form-label">Package Name (e.g. 100MB)</label>
                 <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
               </div>
               <div className="form-group">
                 <label className="form-label">Price (PKR)</label>
                 <input type="number" className="form-control" value={price} onChange={e => setPrice(e.target.value)} required min="1" step="any" />
               </div>
               <button className="btn btn-primary btn-block" disabled={submitting}>
                 {submitting ? '...' : (editingPackage ? 'Update' : 'Create')}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;
