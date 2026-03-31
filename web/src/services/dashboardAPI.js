import api from './api';

export const dashboardAPI = {
  getStats: () => api.get('/admin/dashboard'),
  getUsers: async () => {
    const response = await api.get('/admin/dashboard');
    return { data: response.data?.users || [] };
  },
  getDrivers: async () => {
    const response = await api.get('/admin/dashboard');
    return { data: response.data?.drivers || [] };
  },
  getRides: async (params = {}) => {
    const response = await api.get('/admin/dashboard');
    const rides = response.data?.rides || [];
    if (!params.status) {
      return { data: rides };
    }
    return { data: rides.filter((ride) => ride.status === params.status) };
  },
  getRoutes: async () => {
    const response = await api.get('/admin/dashboard');
    return { data: response.data?.routes || [] };
  },
  
  // User management
  suspendUser: (_userId) => Promise.reject(new Error('Suspend user is not available on this backend.')),
  activateUser: (_userId) => Promise.reject(new Error('Activate user is not available on this backend.')),
  
  // Driver management
  suspendDriver: (_driverId) => Promise.reject(new Error('Suspend driver is not available on this backend.')),
  activateDriver: (_driverId) => Promise.reject(new Error('Activate driver is not available on this backend.')),
  
  // Ride management
  cancelRide: (_rideId) => Promise.reject(new Error('Cancel ride is not available on this backend.')),
  completeRide: (_rideId) => Promise.reject(new Error('Complete ride is not available on this backend.')),
  
  // Route management
  createRoute: (_data) => Promise.reject(new Error('Create route is not available on this backend.')),
  updateRoute: (_id, _data) => Promise.reject(new Error('Update route is not available on this backend.')),
  deleteRoute: (_id) => Promise.reject(new Error('Delete route is not available on this backend.')),
};

export default dashboardAPI;
