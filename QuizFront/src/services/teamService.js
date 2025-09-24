import api from './api';

export const teamService = {
  // RH Manager endpoints
  createTeam: (teamData) => {
    return api.post('/api/rhm/teams/create', teamData);
  },

  updateTeamMembers: (teamId, memberData) => {
    return api.put(`/api/rhm/teams/${teamId}/members`, memberData);
  },

  updateTeamManager: (teamId, managerId) => {
    return api.put(`/api/rhm/teams/${teamId}/manager`, { managerId });
  },

  // Team Manager endpoints
  getMyTeam: () => {
    return api.get('/api/team-manager/my-team'); // ✅ SANS userId
  },

  getAllTeams: () => {
    return api.get('/api/rhm/teams/fetch');
  },

  grantTeamManagerRole: (teamId, userId) => {
    return api.put(`/api/rhm/teams/${teamId}/manager/${userId}`);
  },

  revokeTeamManagerRole: (teamId, userId) => {
    return api.put(`/api/rhm/teams/${teamId}/revoke-manager/${userId}`);
  },

  addTeamMembers: (teamId, memberIds) => {
    return api.put(`/api/rhm/teams/${teamId}/members`, { memberIds });
  },

  removeMember: (teamId, userId) => {
    return api.delete(`/api/rhm/teams/${teamId}/remove-member/${userId}`);
  },
};
