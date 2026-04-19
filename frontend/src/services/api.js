import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.response.status === 422) {
        // Validation Error
        alert(`Validation Error: Please check your inputs. Ensure numbers are valid integers/decimals. Details: ${JSON.stringify(error.response.data.detail || error.response.data)}`);
      } else {
        alert(`Server Error: ${error.response.data.detail || error.message}`);
      }
    } else {
      alert(`Network Error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

export const login = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await api.post('/auth/token', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data;
};
export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const me = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
export const getDashboard = async () => {
  const response = await api.get('/dashboard/');
  return response.data;
};

export const getLoopers = async () => {
  const response = await api.get('/loopers/');
  return response.data;
};

export const getLooper = async (id) => {
  const response = await api.get(`/loopers/${id}`);
  return response.data;
};

export const getLooperHistory = async (id) => {
  const response = await api.get(`/loopers/${id}/history`);
  return response.data;
};

export const createLooper = async (formData) => {
  const response = await api.post('/loopers/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateLooper = async (id, formData) => {
  const response = await api.put(`/loopers/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteLooper = async (id) => {
  const response = await api.delete(`/loopers/${id}`);
  return response.data;
};

export const updateLooperStatus = async (id, isActive) => {
  const response = await api.put(`/loopers/${id}/status?is_active=${isActive}`);
  return response.data;
};

export const getPackages = async () => {
  const response = await api.get('/packages/');
  return response.data;
};

export const createPackage = async (data) => {
  const response = await api.post('/packages/', data);
  return response.data;
};

export const updatePackage = async (id, data) => {
  const response = await api.put(`/packages/${id}`, data);
  return response.data;
};

export const deletePackage = async (id) => {
  const response = await api.delete(`/packages/${id}`);
  return response.data;
};

export const createPurchase = async (looperId, packageName, price) => {
  const response = await api.post(`/loopers/${looperId}/purchases`, { package_name: packageName, price: parseFloat(price) });
  return response.data;
};

export const updatePurchase = async (looperId, purchaseId, unitPrice) => {
  const response = await api.put(`/loopers/${looperId}/purchases/${purchaseId}?unit_price=${unitPrice}`);
  return response.data;
};

export const deletePurchase = async (looperId, purchaseId) => {
  const response = await api.delete(`/loopers/${looperId}/purchases/${purchaseId}`);
  return response.data;
};

export const createPayment = async (formData) => {
  const response = await api.post('/payments/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const createProduct = async (looperId, formData) => {
  const response = await api.post(`/loopers/${looperId}/products`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteProduct = async (looperId, productId) => {
  const response = await api.delete(`/loopers/${looperId}/products/${productId}`);
  return response.data;
};

// User Management
export const getUsers = async () => {
  const response = await api.get('/users/');
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/users/', userData);
  return response.data;
};

export const updateUser = async (userId, userData) => {
  const response = await api.put(`/users/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};

export const downloadLooperReport = async (id) => {
  const response = await api.get(`/loopers/${id}/report`, {
    responseType: 'blob'
  });
  return response.data;
};

// Activity Logs
export const getActivityLogs = async (params = {}) => {
  const response = await api.get('/activity/', { params });
  return response.data;
};

export default api;
