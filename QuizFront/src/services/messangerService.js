import api from './api';

export const messangerService = {
  getUserTeams: (userId) => api.get(`/api/user/${userId}/teams`),
  getTeamMessages: (teamId) => api.get(`/api/team/${teamId}/messages`),
  sendMessage: ({ userId, teamId, content }) =>
    api.post('/api/message', { userId, teamId, content }),
};
