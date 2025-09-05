import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: (data) => api.post('/auth/logout', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (updates) => api.put('/auth/profile', updates),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
};

// Students API
export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (studentId) => api.get(`/students/${studentId}`),
  update: (studentId, updates) => api.put(`/students/${studentId}`, updates),
  getCourses: (studentId) => api.get(`/students/${studentId}/courses`),
  enroll: (studentId, courseData) => api.post(`/students/${studentId}/enroll`, courseData),
  getAttendance: (studentId, params) => api.get(`/students/${studentId}/attendance`, { params }),
  getGrades: (studentId, params) => api.get(`/students/${studentId}/grades`, { params }),
  delete: (studentId) => api.delete(`/students/${studentId}`),
};

// Faculty API
export const facultyAPI = {
  getAll: (params) => api.get('/faculty', { params }),
  getById: (facultyId) => api.get(`/faculty/${facultyId}`),
  update: (facultyId, updates) => api.put(`/faculty/${facultyId}`, updates),
  getCourses: (facultyId) => api.get(`/faculty/${facultyId}/courses`),
  createCourse: (facultyId, courseData) => api.post(`/faculty/${facultyId}/courses`, courseData),
  updateCourse: (facultyId, courseId, updates) => api.put(`/faculty/${facultyId}/courses/${courseId}`, updates),
  getStudents: (facultyId, params) => api.get(`/faculty/${facultyId}/students`, { params }),
  submitGrades: (facultyId, gradesData) => api.post(`/faculty/${facultyId}/grades`, gradesData),
  getSchedule: (facultyId) => api.get(`/faculty/${facultyId}/schedule`),
  delete: (facultyId) => api.delete(`/faculty/${facultyId}`),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (userId, statusData) => api.put(`/admin/users/${userId}/status`, statusData),
  getCourses: (params) => api.get('/admin/courses', { params }),
  createCourse: (courseData) => api.post('/admin/courses', courseData),
  updateCourse: (courseId, updates) => api.put(`/admin/courses/${courseId}`, updates),
  deleteCourse: (courseId) => api.delete(`/admin/courses/${courseId}`),
  getReports: (params) => api.get('/admin/reports', { params }),
  bulkOperations: (operationData) => api.post('/admin/bulk-operations', operationData),
};

// Staff API
export const staffAPI = {
  getAll: (params) => api.get('/staff', { params }),
  getById: (staffId) => api.get(`/staff/${staffId}`),
  update: (staffId, updates) => api.put(`/staff/${staffId}`, updates),
  getTasks: (staffId, params) => api.get(`/staff/${staffId}/tasks`, { params }),
  createTask: (staffId, taskData) => api.post(`/staff/${staffId}/tasks`, taskData),
  updateTask: (staffId, taskId, updates) => api.put(`/staff/${staffId}/tasks/${taskId}`, updates),
  getSchedule: (staffId) => api.get(`/staff/${staffId}/schedule`),
  updateSchedule: (staffId, scheduleData) => api.put(`/staff/${staffId}/schedule`, scheduleData),
  getAttendance: (staffId, params) => api.get(`/staff/${staffId}/attendance`, { params }),
  clockInOut: (staffId, actionData) => api.post(`/staff/${staffId}/clock`, actionData),
  delete: (staffId) => api.delete(`/staff/${staffId}`),
};

// Attendance API
export const attendanceAPI = {
  generateQR: (qrData) => api.post('/attendance/generate-qr', qrData),
  markAttendance: (attendanceData) => api.post('/attendance/mark-attendance', attendanceData),
  getSessions: (params) => api.get('/attendance/sessions', { params }),
  getSessionAttendance: (sessionId) => api.get(`/attendance/sessions/${sessionId}/attendance`),
  closeSession: (sessionId) => api.put(`/attendance/sessions/${sessionId}/close`),
  manualMark: (attendanceData) => api.post('/attendance/manual-mark', attendanceData),
  getStatistics: (params) => api.get('/attendance/statistics', { params }),
  deleteSession: (sessionId) => api.delete(`/attendance/sessions/${sessionId}`),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;