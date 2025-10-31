import axios from 'axios';

// ✅ Environment-based API URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

console.log('🌐 API URL:', API_URL);
console.log('🔌 Socket URL:', SOCKET_URL);

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('🔑 Token being sent:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', error.response?.data || error.message);
    
    // Redirect to login on 401
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Projects API
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, email) => api.post(`/projects/${id}/members`, { email }),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
};

// Tasks API
export const tasksAPI = {
  getByProject: (projectId) => api.get(`/tasks/project/${projectId}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// Comments API
export const commentsAPI = {
  getByTask: (taskId) => api.get(`/comments/task/${taskId}`),
  create: (data) => api.post('/comments', data),
  delete: (id) => api.delete(`/comments/${id}`),
};

export default api;
