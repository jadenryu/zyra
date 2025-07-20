import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email: email, password }),
  register: (userData: any) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
};

// Projects API
export const projectsAPI = {
  getAll: (params?: any) => api.get('/projects', { params }),
  getById: (id: number) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: number, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
};

// Datasets API
export const datasetsAPI = {
  getAll: (params?: any) => api.get('/datasets', { params }),
  getById: (id: number) => api.get(`/datasets/${id}`),
  upload: (file: File, datasetInfo: any) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataset_info', JSON.stringify(datasetInfo));
    return api.post('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id: number, data: any) => api.put(`/datasets/${id}`, data),
  delete: (id: number) => api.delete(`/datasets/${id}`),
  getStatus: (id: number) => api.get(`/datasets/${id}/status`),
};

// Analytics API
export const analyticsAPI = {
  runEDA: (datasetId: number) => api.post(`/analytics/${datasetId}/eda`),
  cleanDataset: (datasetId: number, config: any) =>
    api.post(`/analytics/${datasetId}/clean`, config),
  getStatistics: (datasetId: number) =>
    api.get(`/analytics/${datasetId}/statistics`),
  runFeatureEngineering: (datasetId: number, config: any) =>
    api.post(`/analytics/${datasetId}/feature-engineering`, config),
};

// ML API
export const mlAPI = {
  trainModel: (datasetId: number, config: any) =>
    api.post(`/ml/${datasetId}/train`, config),
  getAllModels: (params?: any) => api.get('/ml/models', { params }),
  getModel: (id: number) => api.get(`/ml/models/${id}`),
  predict: (modelId: number, data: any) =>
    api.post(`/ml/models/${modelId}/predict`, data),
  deleteModel: (id: number) => api.delete(`/ml/models/${id}`),
}; 