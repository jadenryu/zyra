import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Projects API
export const projectsAPI = {
  async getAll(params?: { limit?: number }) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch projects');
      return { data: [] }; // Return empty array for now
    } catch (error) {
      return { data: [] };
    }
  },
};

// Datasets API
export const datasetsAPI = {
  async getAll(params?: { limit?: number }) {
    try {
      const response = await fetch(`${API_BASE_URL}/datasets`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch datasets');
      return { data: [] }; // Return empty array for now
    } catch (error) {
      return { data: [] };
    }
  },
};

// ML API
export const mlAPI = {
  async getAllModels(params?: { limit?: number }) {
    try {
      const response = await fetch(`${API_BASE_URL}/ml/models`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch models');
      return { data: [] }; // Return empty array for now
    } catch (error) {
      return { data: [] };
    }
  },
}; 