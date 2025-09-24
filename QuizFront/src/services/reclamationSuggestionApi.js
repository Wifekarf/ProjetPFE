// Service API pour les réclamations/suggestions

import api from './api';

export async function getMyReclamationsSuggestions() {
  const res = await api.get('/api/reclamations-suggestions/mine');
  return res.data;
}

export async function addReclamationSuggestion(data) {
  const res = await api.post('/api/reclamations-suggestions/add', data);
  return res.data;
}

export async function cancelReclamationSuggestion(id) {
  const res = await api.patch(`/api/reclamations-suggestions/${id}/cancel`);
  return res.data;
}

export async function editReclamationSuggestion(id, data) {
  const res = await api.put(`/api/reclamations-suggestions/${id}`, data);
  return res.data;
}

// Fetch all reclamation suggestions for admin (no filtering backend-side)
export async function getAllAdminReclamationSuggestions() {
  const res = await api.get('/api/reclamations-suggestions/admin/list');
  return res.data;
}

export async function approveReclamationSuggestion(id, data) {
  const res = await api.patch(`/api/reclamations-suggestions/admin/${id}/approve`, data);
  return res.data;
}

export async function rejectReclamationSuggestion(id, data) {
  const res = await api.patch(`/api/reclamations-suggestions/admin/${id}/reject`, data);
  return res.data;
}


