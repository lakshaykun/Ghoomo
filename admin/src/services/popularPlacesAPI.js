import api from './api';

export async function getPopularPlaces() {
  const res = await api.get('/admin/popular-places');
  return res.data.data; // array of places
}

export async function createPopularPlace(payload) {
  const res = await api.post('/admin/popular-places', payload);
  return res.data.data;
}

export async function updatePopularPlace(id, payload) {
  const res = await api.put(`/admin/popular-places/${id}`, payload);
  return res.data.data;
}

export async function deletePopularPlace(id) {
  await api.delete(`/admin/popular-places/${id}`);
}
