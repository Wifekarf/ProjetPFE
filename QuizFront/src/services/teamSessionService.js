import api from './api';

export const teamSessionService = {
  // Récupère le classement (scoreboard) d'une session d'équipe
  getSessionScoreboard: (id) => api.get(`/api/team-session/${id}/scoreboard`),
  // List all sessions for a team
  getTeamSessions: (teamId) => api.get(`/api/team-sessions?team_id=${teamId}`),
  // Get one session
  getTeamSession: (id) => api.get(`/api/team-sessions/${id}`),
  // Create session
  createTeamSession: (data) => api.post('/api/team-sessions', data),
  // Update session
  updateTeamSession: (id, data) => api.put(`/api/team-sessions/${id}`, data),
  // Cancel session (could be a delete or a PATCH depending on backend)
  cancelTeamSession: (id) => api.delete(`/api/team-sessions/${id}`),
};
