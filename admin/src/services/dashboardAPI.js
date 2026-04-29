import axios from 'axios';
import { resolveApiBaseUrl } from './baseUrl';

function unwrapPayload(response) {
  return response.data?.data ?? response.data;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const dashboardAPI = {
  // Auth
  login: (data) => api.post('/auth/login', data).then(res => res.data),
  getCurrentUser: () => api.get('/auth/me').then(res => res.data),
  
  // Dashboard, Monitoring & Analytics
  getOverviewData: () => api.get('/admin/dashboard').then(unwrapPayload),
  getStats: () => api.get('/admin/dashboard').then(unwrapPayload),
  getMonitoringData: (params) => api.get('/admin/dashboard', { params }).then(unwrapPayload),
  getAnalytics: (days = 7) => api.get(`/admin/analytics?days=${days}`).then(unwrapPayload),

  // Users (Generic)
  getUsers: (params) => api.get('/admin/users', { params }).then(res => res.data),

  // Drivers
  getDrivers: (params) => api.get('/admin/drivers', { params }).then(res => res.data),
  getNearbyDrivers: (params) => api.get('/admin/drivers/live', { params }).then(res => res.data),
  getLiveDrivers: () => api.get('/admin/drivers/live').then(res => res.data),
  updateDriverStatus: (id, status) => api.patch(`/admin/drivers/${id}/status`, { status }).then(res => res.data),

  // Bus Drivers
  getBusDrivers: (params) => api.get('/admin/bus-drivers', { params }).then(res => res.data),
  getApprovedBusDrivers: () => api.get('/admin/bus-drivers?status=approved').then(unwrapPayload),
  updateBusDriverStatus: (id, status) => api.patch(`/admin/bus-drivers/${id}/status`, { status }).then(res => res.data),

  // Bus Management (Routes & Bookings)
  getRoutes: () => api.get('/bus/routes').then(res => res.data),
  createRoute: (data) => api.post('/bus/routes', data).then(unwrapPayload),
  updateRoute: (id, data) => api.put(`/bus/routes/${id}`, data).then(res => res.data),
  deleteRoute: (id) => api.delete(`/bus/routes/${id}`).then(res => res.data),
  addRouteStop: (routeId, data) => api.post(`/bus/routes/${routeId}/stops`, data).then(res => res.data),

  // Ride Monitoring
  getRides: (params) => api.get('/admin/rides', { params }).then(res => res.data),
  getPopularPlaces: () => api.get('/admin/popular-places').then(res => res.data),
  
  // Geofencing
  getCampusBoundary: () => api.get('/admin/campus-boundary').then(unwrapPayload),
  saveCampusBoundary: (data) => api.post('/admin/campus-boundary', { coordinates: data }).then(unwrapPayload),
  updateCampusBoundary: (data) => api.post('/admin/campus-boundary', { coordinates: data }).then(unwrapPayload),

  // Students
  getStudents: (params) => api.get('/admin/users', { params: { ...params, role: 'rider' } }).then(res => res.data),
};

export default dashboardAPI;
