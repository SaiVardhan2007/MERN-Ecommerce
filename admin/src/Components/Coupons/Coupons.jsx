import React, { useState, useEffect } from 'react';
import './Coupons.css';
import { backend_url } from '../../App';

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minCartValue: '',
    isActive: true,
    expiryDate: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backend_url}/api/coupons/admin`);
      const data = await response.json();
      
      if (data.success) {
        setCoupons(data.coupons);
      } else {
        setError('Failed to fetch coupons');
      }
    } catch (error) {
      setError('Error fetching coupons');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      minCartValue: '',
      isActive: true,
      expiryDate: ''
    });
    setEditingCoupon(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingCoupon 
        ? `${backend_url}/api/coupons/admin/${editingCoupon._id}`
        : `${backend_url}/api/coupons/admin`;
      
      const method = editingCoupon ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(editingCoupon ? 'Coupon updated successfully!' : 'Coupon created successfully!');
        resetForm();
        fetchCoupons();
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (error) {
      alert('Error saving coupon');
      console.error('Error:', error);
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minCartValue: coupon.minCartValue.toString(),
      isActive: coupon.isActive,
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) {
      return;
    }

    try {
      const response = await fetch(`${backend_url}/api/coupons/admin/${couponId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Coupon deleted successfully!');
        fetchCoupons();
      } else {
        alert(data.message || 'Failed to delete coupon');
      }
    } catch (error) {
      alert('Error deleting coupon');
      console.error('Error:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No expiry';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (coupon) => {
    if (!coupon.isActive) return 'red';
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) return 'orange';
    return 'green';
  };

  if (loading) {
    return <div className="coupons-loading">Loading coupons...</div>;
  }

  return (
    <div className="coupons">
      <div className="coupons-header">
        <h1>Coupon Management</h1>
        <button 
          className="add-coupon-btn" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add New Coupon'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="coupon-form-container">
          <h2>{editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}</h2>
          <form onSubmit={handleSubmit} className="coupon-form">
            <div className="form-group">
              <label>Coupon Code:</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                placeholder="Enter coupon code"
              />
            </div>

            <div className="form-group">
              <label>Discount Type:</label>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleInputChange}
                required
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            <div className="form-group">
              <label>Discount Value:</label>
              <input
                type="number"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleInputChange}
                required
                min="0"
                step={formData.discountType === 'percentage' ? '0.01' : '1'}
                placeholder={formData.discountType === 'percentage' ? 'e.g., 10' : 'e.g., 50'}
              />
            </div>

            <div className="form-group">
              <label>Minimum Cart Value:</label>
              <input
                type="number"
                name="minCartValue"
                value={formData.minCartValue}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                placeholder="e.g., 100"
              />
            </div>

            <div className="form-group">
              <label>Expiry Date:</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                Active
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </button>
              {editingCoupon && (
                <button type="button" onClick={resetForm} className="cancel-btn">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="coupons-list">
        <h2>Existing Coupons</h2>
        {coupons.length === 0 ? (
          <p>No coupons found. Create your first coupon!</p>
        ) : (
          <div className="coupons-table">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Type</th>
                  <th>Min Cart Value</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon._id}>
                    <td>{coupon.code}</td>
                    <td>
                      {coupon.discountValue}
                      {coupon.discountType === 'percentage' ? '%' : ' ₹'}
                    </td>
                    <td>{coupon.discountType}</td>
                    <td>₹{coupon.minCartValue}</td>
                    <td>{formatDate(coupon.expiryDate)}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(coupon) }}
                      >
                        {!coupon.isActive ? 'Inactive' : 
                         (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) ? 'Expired' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleEdit(coupon)}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(coupon._id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Coupons; 