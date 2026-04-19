import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLooper, getLooperHistory, createPurchase, updatePurchase, deletePurchase, createPayment, updateLooperStatus, updateLooper, deleteLooper, createProduct, deleteProduct, downloadLooperReport } from '../services/api';
import { ArrowLeft, Package, DollarSign, Upload, Image as ImageIcon, Trash2, Edit2, User, ShoppingCart, Tag, ShieldAlert, Download } from 'lucide-react';
import { useAuth } from '../App';

const LooperDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [looper, setLooper] = useState(null);
  const [history, setHistory] = useState({ purchases: [], payments: [], products: [] });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const isSuperOrManager = ['superuser', 'manager'].includes(user?.role);
  const isLooper = user?.role === 'looper';
  const isSalesman = user?.role === 'salesman';

  // Modals state
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEditPurchaseModal, setShowEditPurchaseModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  
  // Profile edit state
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editProfilePic, setEditProfilePic] = useState(null);
  
  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  
  // Package form state
  const [packageName, setPackageName] = useState('');
  const [packagePrice, setPackagePrice] = useState('');

  // Product form state
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productReceipt, setProductReceipt] = useState(null);

  // Edit Purchase state
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [newPurchasePrice, setNewPurchasePrice] = useState('');

  const fetchAll = async () => {
    try {
      setLoading(true);
      const l = await getLooper(id);
      setLooper(l);
      setEditName(l.name);
      setEditMobile(l.mobile);
      const h = await getLooperHistory(id);
      setHistory(h);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [id]);

  const handleToggleStatus = async () => {
    if(!looper) return;
    try {
      await updateLooperStatus(id, !looper.is_active);
      fetchAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', editName);
      formData.append('mobile', editMobile);
      if (editProfilePic) {
        formData.append('profile_pic', editProfilePic);
      }
      
      await updateLooper(id, formData);
      setShowEditProfileModal(false);
      setEditProfilePic(null);
      fetchAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteClient = async () => {
    if (window.confirm('Are you sure you want to delete this client? All their records will be hidden.')) {
      try {
        await deleteLooper(id);
        navigate('/loopers');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('looper_id', id);
    formData.append('amount', paymentAmount);
    if (paymentReceipt) {
      formData.append('receipt', paymentReceipt);
    }
    try {
      await createPayment(formData);
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentReceipt(null);
      fetchAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPackage = async (e) => {
    e.preventDefault();
    try {
      await createPurchase(id, packageName, packagePrice);
      setShowPackageModal(false);
      setPackageName('');
      setPackagePrice('');
      fetchAll();
    } catch (e) {
      alert("Failed to add package. Check if client is active.");
      console.error(e);
    }
  };

  const handleEditPurchase = (purchase) => {
    setEditingPurchase(purchase);
    // Use unit_price instead of total price for the edit form
    setNewPurchasePrice(purchase.unit_price ? purchase.unit_price.toString() : '');
    setShowEditPurchaseModal(true);
  };

  const handleUpdatePurchase = async (e) => {
    e.preventDefault();
    try {
      // Send unitPrice to the updated API endpoint
      await updatePurchase(id, editingPurchase.id, parseFloat(newPurchasePrice));
      setShowEditPurchaseModal(false);
      fetchAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePurchase = async (purchaseId) => {
    if (window.confirm('Delete this purchase record?')) {
      try {
        await deletePurchase(id, purchaseId);
        fetchAll();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', productName);
    formData.append('description', productDescription);
    formData.append('price', productPrice);
    if (productReceipt) {
      formData.append('receipt', productReceipt);
    }
    try {
      await createProduct(id, formData);
      setShowProductModal(false);
      setProductName('');
      setProductDescription('');
      setProductPrice('');
      setProductReceipt(null);
      fetchAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Delete this product record?')) {
      try {
        await deleteProduct(id, productId);
        fetchAll();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val);
  };
  
  const handleDownloadReport = async (e) => {
    e.stopPropagation();
    try {
      const blob = await downloadLooperReport(id);
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

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  if (loading) return <div className="text-center p-4">Loading Profile...</div>;
  if (!looper) return <div className="text-center p-4">Client not found.</div>;

  return (
    <div>
      <div className="page-header">
        <div className="d-flex align-center gap-2">
          <button className="btn btn-icon-only btn-outline" onClick={() => navigate('/loopers')}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-truncate">{looper.name}</h1>
        </div>
        <div className="d-flex gap-2 page-header-actions">
          {(isSuperOrManager) && (
            <>
              <button className="btn btn-outline" onClick={handleDownloadReport} title="Download Report">
                <Download size={18} /> <span className="hide-mobile">Download</span>
              </button>
              <button className="btn btn-outline" onClick={() => {
                setEditName(looper.name);
                setEditMobile(looper.mobile);
                setShowEditProfileModal(true);
              }}>
                <Edit2 size={18} /> <span className="hide-mobile">Edit Profile</span>
              </button>
              <button className="btn btn-danger" onClick={handleDeleteClient}>
                <Trash2 size={18} /> <span className="hide-mobile">Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 mb-4">
        <div className="card">
          <div className="card-title">Profile Info</div>
          <div className="d-flex flex-wrap align-center gap-2 mb-2">
            <div className="avatar" style={{width: '80px', height: '80px', fontSize: '2rem'}}>
              {looper.profile_pic_url ? (
                <img src={looper.profile_pic_url} alt="Profile" />
              ) : (
                looper.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p><strong>Mobile:</strong> {looper.mobile}</p>
              <p><strong>Balance:</strong> <span className={`balance-amount ${looper.balance > 0 ? 'negative' : 'positive'}`}>{formatCurrency(looper.balance)}</span></p>
            </div>
          </div>
          <div className="d-flex align-center gap-2 mb-2">
            <strong>Status:</strong>
            <span className={`status-badge ${looper.is_active ? 'status-active' : 'status-inactive'}`}>
              {looper.is_active ? 'Active' : 'Inactive'}
            </span>
            {isSuperOrManager && (
              <button className="btn btn-outline" style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem'}} onClick={handleToggleStatus}>
                Change Status
              </button>
            )}
          </div>
          
          {(looper.cnic_front_url || looper.cnic_back_url) && (
            <div className="mt-2">
              <p className="font-bold mb-1">ID Cards:</p>
              <div className="d-flex gap-2">
                {looper.cnic_front_url && <a href={looper.cnic_front_url} target="_blank" rel="noreferrer"><img src={looper.cnic_front_url} alt="Front" style={{ height: '40px', borderRadius: '4px' }} /></a>}
                {looper.cnic_back_url && <a href={looper.cnic_back_url} target="_blank" rel="noreferrer"><img src={looper.cnic_back_url} alt="Back" style={{ height: '40px', borderRadius: '4px' }} /></a>}
              </div>
            </div>
          )}
        </div>
        
        {!isLooper && (
          <div className="card d-flex flex-column gap-2" style={{justifyContent: 'center'}}>
            <button className="btn btn-secondary btn-block" onClick={() => setShowPackageModal(true)} disabled={!looper.is_active}>
              <Package size={20} /> Add Package
            </button>
            <button className="btn btn-primary btn-block" onClick={() => setShowPaymentModal(true)}>
              <DollarSign size={20} /> Add Payment
            </button>
            <button className="btn btn-outline btn-block" onClick={() => setShowProductModal(true)} disabled={!looper.is_active}>
              <ShoppingCart size={20} /> Sell Product
            </button>
          </div>
        )}
        {isLooper && (
          <div className="card text-center flex-column flex-center gap-2">
            <div className="icon-wrapper bg-primary text-white mx-auto">
               <ShieldAlert size={32} />
            </div>
            <h3>Self Service</h3>
            <p className="text-sub">Please contact support for profile updates or new subscriptions.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <h2 className="mb-2">Package History</h2>
          {history.purchases.length === 0 ? <p className="text-sub">No packages assigned yet.</p> : (
             <>
               <p className="text-sub mb-2">Click to edit or delete</p>
               <div className="list-container">
                 {history.purchases.map(p => {
                   return (
                    <div key={p.id} className="list-item" onClick={isSuperOrManager ? () => handleEditPurchase(p) : undefined} style={{cursor: isSuperOrManager ? 'pointer' : 'default'}}>
                       <div>
                         <div className="font-bold">{p.package_name || `Package #${p.id}`}</div>
                         <div className="text-sub">{formatDate(p.created_at)}</div>
                       </div>
                       <div className="d-flex align-center gap-2" style={{minWidth: 'fit-content'}}>
                           <div className="text-right">
                              <div className="text-sub" style={{fontSize: '0.75rem'}}>
                                Rate: {p.unit_price ? `${formatCurrency(p.unit_price)}/${p.package_name?.toLowerCase().includes('gb') ? 'gb' : 'mb'}` : '-'}
                              </div>
                              <div className="font-bold text-primary">{formatCurrency(p.snapshot_price)}</div>
                           </div>
                           {isSuperOrManager && <div className="text-sub"><Edit2 size={12} /></div>}
                        </div>
                     </div>
                   );
                 })}
               </div>
             </>
          )}
        </div>

        <div className="card">
          <h2 className="mb-2">Payment History</h2>
          {history.payments.length === 0 ? <p className="text-sub">No payments received yet.</p> : (
             <div className="list-container">
               {history.payments.map(p => (
                 <div key={p.id} className="list-item" style={{cursor: 'default'}}>
                   <div style={{ flex: 1 }}>
                     <div className="font-bold">Payment</div>
                     <div className="text-sub">{formatDate(p.created_at)}</div>
                     {p.receipt_url && <a href={p.receipt_url} target="_blank" rel="noreferrer" className="text-sub text-primary" style={{display:'flex', alignItems:'center', gap:'0.2rem'}}><ImageIcon size={14}/> View Receipt</a>}
                   </div>
                   <div className="font-bold text-primary">-{formatCurrency(p.amount)}</div>
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 mb-4">
        <div className="card">
          <h2 className="mb-2">Product History</h2>
          {(history.products || []).length === 0 ? <p className="text-sub">No products sold yet.</p> : (
             <div className="list-container">
               {history.products.map(p => (
                 <div key={p.id} className="list-item" style={{cursor: 'default'}}>
                    <div style={{ flex: 1 }}>
                      <div className="font-bold">{p.name}</div>
                      <div className="text-sub">{p.description || 'No description'}</div>
                      <div className="text-sub">{formatDate(p.created_at)}</div>
                      {p.receipt_url && <a href={p.receipt_url} target="_blank" rel="noreferrer" className="text-sub text-primary" style={{display:'flex', alignItems:'center', gap:'0.2rem'}}><ImageIcon size={14}/> View Receipt</a>}
                    </div>
                    <div className="d-flex flex-column align-end gap-1">
                      <div className="font-bold text-danger">{formatCurrency(p.price)}</div>
                      {isSuperOrManager && (
                        <button className="btn btn-icon-only text-danger" onClick={() => handleDeleteProduct(p.id)} style={{padding: '0.2rem'}}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>

      {/* Profile Edit Modal */}
      {showEditProfileModal && (
        <div className="modal-overlay" onClick={() => setShowEditProfileModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
               <h2>Edit Client Profile</h2>
               <button className="modal-close" onClick={() => setShowEditProfileModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateProfile}>
               <div className="form-group">
                 <label className="form-label">Full Name</label>
                 <input type="text" className="form-control" value={editName} onChange={e => setEditName(e.target.value)} required />
               </div>
               <div className="form-group">
                 <label className="form-label">Mobile Number</label>
                 <input type="number" className="form-control" value={editMobile} onChange={e => setEditMobile(e.target.value)} required />
               </div>
                <div className="form-group">
                  <label className="form-label">Profile Picture (Optional)</label>
                  <div className="file-upload-wrapper">
                    <div className="file-upload-btn" style={{ padding: '0.75rem' }}>
                      <ImageIcon size={20} />
                      <span>{editProfilePic ? editProfilePic.name : 'Change Profile Photo'}</span>
                    </div>
                    <input type="file" accept="image/*" onChange={e => setEditProfilePic(e.target.files[0])} />
                  </div>
                </div>
                <button className="btn btn-primary btn-block">Update Profile</button>
            </form>
          </div>
        </div>
      )}

      {/* Item Action Modal (Update/Delete Purchase) */}
      {showEditPurchaseModal && (
        <div className="modal-overlay" onClick={() => setShowEditPurchaseModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
               <h2>Manage Purchase Record</h2>
               <button className="modal-close" onClick={() => setShowEditPurchaseModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdatePurchase}>
              <div className="form-group">
                <label className="form-label">Rate Adjustment (PKR/{editingPurchase?.package_name?.toLowerCase().includes('gb') ? 'GB' : 'MB'})</label>
                <input type="number" className="form-control" value={newPurchasePrice} onChange={e => setNewPurchasePrice(e.target.value)} required min="0" step="any" placeholder="0.00" />
                {editingPurchase && (
                  <div className="mt-2 text-sub" style={{ fontSize: '0.85rem', padding: '0.5rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 'var(--radius-sm)' }}>
                    <strong>Estimated Total:</strong> {formatCurrency(parseFloat(newPurchasePrice || 0) * (parseFloat(editingPurchase.package_name?.match(/(\d+\.?\d*)/)?.[1]) || 0))}
                  </div>
                )}
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Update Rate</button>
                <button type="button" className="btn btn-danger" onClick={() => { setShowEditPurchaseModal(false); handleDeletePurchase(editingPurchase.id); }}>
                  <Trash2 size={20} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Package Modal */}
      {showPackageModal && (
        <div className="modal-overlay" onClick={() => setShowPackageModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
               <h2>Add New Package</h2>
               <button className="modal-close" onClick={() => setShowPackageModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddPackage}>
               <div className="form-group">
                 <label className="form-label">Package Name (MB/GB)</label>
                 <input type="text" className="form-control" value={packageName} onChange={e => setPackageName(e.target.value)} required placeholder="e.g. 500MB" />
               </div>
               <div className="form-group">
                 <label className="form-label">Price (PKR)</label>
                 <input type="number" className="form-control" value={packagePrice} onChange={e => setPackagePrice(e.target.value)} required placeholder="0.00" />
               </div>
               <button className="btn btn-secondary btn-block">Add Package</button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
               <h2>Add Payment</h2>
               <button className="modal-close" onClick={() => setShowPaymentModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddPayment}>
               <div className="form-group">
                 <label className="form-label">Amount (PKR)</label>
                 <input type="number" className="form-control" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required min="1" step="any" />
               </div>
               <div className="form-group">
                 <label className="form-label">Receipt Image (optional)</label>
                 <div className="file-upload-wrapper">
                    <div className="file-upload-btn">
                      <Upload size={24} />
                      <span>{paymentReceipt ? paymentReceipt.name : 'Tap to upload receipt'}</span>
                    </div>
                    <input type="file" accept="image/*" onChange={e => setPaymentReceipt(e.target.files[0])} />
                 </div>
               </div>
               <button className="btn btn-primary btn-block">Save Payment</button>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
               <h2>Sell Product</h2>
               <button className="modal-close" onClick={() => setShowProductModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddProduct}>
               <div className="form-group">
                 <label className="form-label">Product Name</label>
                 <input type="text" className="form-control" value={productName} onChange={e => setProductName(e.target.value)} required placeholder="e.g. Router, Wire (meter)" />
               </div>
               <div className="form-group">
                 <label className="form-label">Description (Optional)</label>
                 <textarea className="form-control" value={productDescription} onChange={e => setProductDescription(e.target.value)} placeholder="Model number, color, etc." rows="2" style={{resize:'none'}} />
               </div>
               <div className="form-group">
                 <label className="form-label">Price (PKR)</label>
                 <input type="number" className="form-control" value={productPrice} onChange={e => setProductPrice(e.target.value)} required min="0" step="any" placeholder="0.00" />
               </div>
               <div className="form-group">
                 <label className="form-label">Product Receipt (Optional)</label>
                 <div className="file-upload-wrapper">
                    <div className="file-upload-btn" style={{padding: '1rem'}}>
                      <Upload size={20} />
                      <span>{productReceipt ? productReceipt.name : 'Tap to upload'}</span>
                    </div>
                    <input type="file" accept="image/*" onChange={e => setProductReceipt(e.target.files[0])} />
                 </div>
               </div>
               <button className="btn btn-secondary btn-block">Confirm Sale</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LooperDetail;
