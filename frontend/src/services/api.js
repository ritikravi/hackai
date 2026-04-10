import axios from 'axios';

// Use env variable if set, otherwise fall back to port 5001
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const api = axios.create({ baseURL: BASE_URL });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const signup = (data) => api.post('/auth/signup', data);
export const login = (data) => api.post('/auth/login', data);

// Student
export const getDashboard = () => api.get('/student/dashboard');
export const uploadResume = (formData) =>
  api.post('/student/upload-resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getJobs = () => api.get('/student/jobs');
export const getTasks = () => api.get('/student/tasks');
export const completeTask = (taskId) => api.patch(`/student/tasks/${taskId}/complete`);
export const applyToJob = (jobId) => api.post(`/student/apply/${jobId}`);

// Admin
export const getStudents = () => api.get('/admin/students');
export const getAnalytics = () => api.get('/admin/analytics');
export const getRiskStudents = () => api.get('/admin/risk');
export const getAdminAlerts = () => api.get('/admin/alerts');
export const createJob = (data) => api.post('/admin/jobs', data);
export const updateAppStatus = (id, status) => api.patch(`/admin/applications/${id}/status`, { status });

// AI
export const chatWithAI = (message, history) => api.post('/ai/chat', { message, history });
export const startMockInterview = (topic) => api.post('/ai/mock-interview', { action: 'start', topic });
export const nextQuestion = (history) => api.post('/ai/mock-interview', { action: 'next', history });
export const evaluateAnswer = (question, answer) =>
  api.post('/ai/mock-interview', { action: 'evaluate', question, answer });

export default api;

// Intelligence APIs
export const getPrediction = () => api.get('/student/prediction');
export const getDigitalTwin = () => api.get('/student/digital-twin');
export const getSkillGap = (jobId) => api.get(`/student/skill-gap/${jobId}`);
export const getInterviewAnalytics = () => api.get('/student/interview-analytics');
export const saveInterviewResult = (data) => api.post('/student/interview-result', data);
export const getTrendingSkills = () => api.get('/jobs/trending');
export const getMarketJobs = () => api.get('/jobs/market');
export const getInterventions = () => api.get('/admin/interventions');
export const getRiskDetection = () => api.get('/admin/risk-detection');
export const runAgent = () => api.post('/admin/run-agent');
