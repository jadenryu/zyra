import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Projects API
export const projectsAPI = {
  getAll: async (params?: { limit?: number; skip?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    
    const response = await fetch(`${API_BASE_URL}/api/v1/projects?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return { data: await handleResponse(response) };
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
      headers: getAuthHeaders(),
    });
    return { data: await handleResponse(response) };
  },

  create: async (data: { name: string; description?: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return { data: await handleResponse(response) };
  },

  update: async (id: string, data: { name?: string; description?: string }) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return { data: await handleResponse(response) };
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return { data: await handleResponse(response) };
  },
};

// Datasets API
export const datasetsAPI = {
  getAll: async (params?: { limit?: number; skip?: number; project_id?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.project_id) searchParams.append('project_id', params.project_id);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/datasets?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return { data: await handleResponse(response) };
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/datasets/${id}`, {
      headers: getAuthHeaders(),
    });
    return { data: await handleResponse(response) };
  },

  upload: async (formData: FormData) => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/v1/datasets/upload`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });
    return { data: await handleResponse(response) };
  },

  analyze: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/datasets/${id}/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return { data: await handleResponse(response) };
  },

  clean: async (id: string, config?: any) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/datasets/${id}/clean`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config || {}),
    });
    return { data: await handleResponse(response) };
  },

  export: async (id: string, format: 'csv' | 'json' | 'excel') => {
    const response = await fetch(`${API_BASE_URL}/api/v1/datasets/${id}/export?format=${format}`, {
      headers: getAuthHeaders(),
    });
    return response; // Return raw response for file download
  },
};

// ML Models API
export const mlAPI = {
  getAllModels: async (params?: { limit?: number; skip?: number; project_id?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.project_id) searchParams.append('project_id', params.project_id);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/ml/models?${searchParams}`, {
      headers: getAuthHeaders(),
    });
    return { data: await handleResponse(response) };
  },

  getModel: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/ml/models/${id}`, {
      headers: getAuthHeaders(),
    });
    return { data: await handleResponse(response) };
  },

  trainModel: async (data: {
    dataset_id: string;
    model_type: 'classification' | 'regression' | 'clustering';
    target_column?: string;
    config?: any;
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/ml/train`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return { data: await handleResponse(response) };
  },

  predict: async (modelId: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/ml/models/${modelId}/predict`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return { data: await handleResponse(response) };
  },

  getFeatureImportance: async (modelId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/ml/models/${modelId}/feature-importance`, {
      headers: getAuthHeaders(),
    });
    return { data: await handleResponse(response) };
  },

  explainPrediction: async (modelId: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/ml/models/${modelId}/explain`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return { data: await handleResponse(response) };
  },
};

// Analytics API
export const analyticsAPI = {
  getDatasetStats: async (datasetId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/datasets/${datasetId}/stats`, {
      headers: getAuthHeaders(),
    });
    return { data: await handleResponse(response) };
  },

  getCorrelationMatrix: async (datasetId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/datasets/${datasetId}/correlation`, {
      headers: getAuthHeaders(),
    });
    return { data: await handleResponse(response) };
  },

  runStatisticalTest: async (data: {
    dataset_id: string;
    test_type: 'ttest' | 'chisquare' | 'anova';
    columns: string[];
    config?: any;
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/statistical-tests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return { data: await handleResponse(response) };
  },

  generateReport: async (datasetId: string, config?: any) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/datasets/${datasetId}/report`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config || {}),
    });
    return { data: await handleResponse(response) };
  },

  getTimeSeriesDecomposition: async (datasetId: string, timeColumn: string, valueColumn: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/datasets/${datasetId}/timeseries-decomposition`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ time_column: timeColumn, value_column: valueColumn }),
    });
    return { data: await handleResponse(response) };
  },
};

// Data Processing API
export const dataProcessingAPI = {
  detectOutliers: async (datasetId: string, method: 'iqr' | 'zscore' | 'isolation_forest') => {
    const response = await fetch(`${API_BASE_URL}/api/v1/data/datasets/${datasetId}/outliers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ method }),
    });
    return { data: await handleResponse(response) };
  },

  suggestFeatureEngineering: async (datasetId: string, targetColumn?: string) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/data/datasets/${datasetId}/feature-suggestions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ target_column: targetColumn }),
    });
    return { data: await handleResponse(response) };
  },

  applyTransformations: async (datasetId: string, transformations: any[]) => {
    const response = await fetch(`${API_BASE_URL}/api/v1/data/datasets/${datasetId}/transform`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ transformations }),
    });
    return { data: await handleResponse(response) };
  },

  exportPipeline: async (datasetId: string, format: 'python' | 'notebook' | 'sql') => {
    const response = await fetch(`${API_BASE_URL}/api/v1/data/datasets/${datasetId}/export-pipeline?format=${format}`, {
      headers: getAuthHeaders(),
    });
    return response; // Return raw response for file download
  },
}; 