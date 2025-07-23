import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token'); // Fixed: was 'access_token'
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// In-memory storage for mock projects (until backend is fully ready)
let mockProjects: any[] = [];

// Projects API
export const projectsAPI = {
  async getAll(params?: { limit?: number; skip?: number }) {
    try {
      // For now, return mock projects since backend might not be fully implemented
      // This ensures created projects are visible in the list
      return { data: mockProjects };
      
      // When backend is ready, uncomment this code:
      /*
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.skip) queryParams.append('skip', params.skip.toString());
      
      const response = await fetch(`${API_BASE_URL}/projects?${queryParams}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      return { data };
      */
    } catch (error) {
      console.error('Error fetching projects:', error);
      return { data: mockProjects };
    }
  },
  
  async getById(id: string) {
    try {
      // Find mock project
      const project = mockProjects.find(p => p.id === id);
      if (project) {
        return { data: project };
      }
      
      // When backend is ready, uncomment this code:
      /*
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch project');
      const data = await response.json();
      return { data };
      */
      
      throw new Error('Project not found');
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error);
      throw error;
    }
  },
  
  async create(projectData: { name: string; description?: string }) {
    try {
      // Create a mock project with a unique ID
      const mockProject = {
        id: Date.now().toString(),
        name: projectData.name,
        description: projectData.description || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_id: '1', // Mock owner ID
        dataset_count: 0,
        analysis_count: 0,
        model_count: 0
      };
      
      // Add to mock storage
      mockProjects.push(mockProject);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return the mock project
      return { data: mockProject };
      
      // When backend is ready, uncomment this code:
      /*
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(projectData),
      });
      
      if (!response.ok) throw new Error('Failed to create project');
      const data = await response.json();
      return { data };
      */
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },
};

// Datasets API
export const datasetsAPI = {
  async getAll(params?: { limit?: number; skip?: number; project_id?: number }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.skip) queryParams.append('skip', params.skip.toString());
      if (params?.project_id) queryParams.append('project_id', params.project_id.toString());
      
      const response = await fetch(`${API_BASE_URL}/datasets?${queryParams}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch datasets');
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error fetching datasets:', error);
      return { data: [] };
    }
  },
  
  async getById(id: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/datasets/${id}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch dataset');
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error(`Error fetching dataset ${id}:`, error);
      throw error;
    }
  },
  
  async upload(formData: FormData) {
    try {
      const response = await fetch(`${API_BASE_URL}/datasets/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, // Fixed: was 'access_token'
          // Don't set Content-Type here, it will be set automatically with the boundary
        },
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload dataset');
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error uploading dataset:', error);
      throw error;
    }
  },
};

// ML API
export const mlAPI = {
  async getAllModels(params?: { limit?: number; project_id?: number }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.project_id) queryParams.append('project_id', params.project_id.toString());
      
      const response = await fetch(`${API_BASE_URL}/ml/models?${queryParams}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error fetching models:', error);
      return { data: [] };
    }
  },
  
  async getModelById(id: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/ml/models/${id}`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to fetch model');
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error(`Error fetching model ${id}:`, error);
      throw error;
    }
  },
  
  async trainModel(datasetId: string, modelConfig: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/ml/${datasetId}/train`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(modelConfig),
      });
      
      if (!response.ok) throw new Error('Failed to train model');
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  },
  
  async predict(modelId: string, data: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/ml/models/${modelId}/predict`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to make prediction');
      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error('Error making prediction:', error);
      throw error;
    }
  },
};

// Data Processing API
export const dataProcessingAPI = {
  async detectOutliers(datasetId: string, method: string = 'iqr') {
    try {
      const response = await fetch(`${API_BASE_URL}/data/datasets/${datasetId}/detect-outliers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ method }),
      });
      
      if (!response.ok) throw new Error('Failed to detect outliers');
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error detecting outliers:', error);
      throw error;
    }
  },
  
  async getFeatureSuggestions(datasetId: string, targetColumn?: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/data/datasets/${datasetId}/feature-suggestions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ target_column: targetColumn || null }),
      });
      
      if (!response.ok) throw new Error('Failed to get feature suggestions');
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error getting feature suggestions:', error);
      throw error;
    }
  },
};

// Analytics API
export const analyticsAPI = {
  async runEDA(datasetId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/${datasetId}/eda`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to run EDA');
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error running EDA:', error);
      throw error;
    }
  },
  
  async generateDashboard(datasetId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/data/datasets/${datasetId}/dashboard`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) throw new Error('Failed to generate dashboard');
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error generating dashboard:', error);
      throw error;
    }
  },
  
  async generateComprehensiveReport(datasetId: string, options: { include_plots?: boolean, target_column?: string }) {
    try {
      const response = await fetch(`${API_BASE_URL}/data/datasets/${datasetId}/comprehensive-report`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          include_plots: options.include_plots ?? true,
          target_column: options.target_column || null,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to generate comprehensive report');
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      throw error;
    }
  },
  
  async createVisualization(datasetId: string, options: { chart_type: string, x_column: string, y_column?: string, title?: string }) {
    try {
      const response = await fetch(`${API_BASE_URL}/data/datasets/${datasetId}/visualize`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(options),
      });
      
      if (!response.ok) throw new Error('Failed to create visualization');
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error creating visualization:', error);
      throw error;
    }
  },
};

// AI Insights API
export const aiAPI = {
  async getInsight(datasetId: string, question: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/ml/ai-insights`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          dataset_id: datasetId,
          question: question,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to get AI insight');
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error getting AI insight:', error);
      throw error;
    }
  },
}; 