import api from './api';

export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getDrivers: (params) => api.get('/admin/drivers', { params }),
  getRides: (params) => api.get('/admin/rides', { params }),
  getRoutes: (params) => api.get('/admin/routes', { params }),
  
  // User management
  suspendUser: (userId) => api.post(`/admin/users/${userId}/suspend`),
  activateUser: (userId) => api.post(`/admin/users/${userId}/activate`),
  
  // Driver management
  suspendDriver: (driverId) => api.post(`/admin/drivers/${driverId}/suspend`),
  activateDriver: (driverId) => api.post(`/admin/drivers/${driverId}/activate`),
  
  // Ride management
  cancelRide: (rideId) => api.post(`/admin/rides/${rideId}/cancel`),
  completeRide: (rideId) => api.post(`/admin/rides/${rideId}/complete`),
  
  // Route management
  createRoute: (data) => api.post('/admin/routes', data),
  updateRoute: (id, data) => api.put(`/admin/routes/${id}`, data),
  deleteRoute: (id) => api.delete(`/admin/routes/${id}`),
};

export default dashboardAPI;
