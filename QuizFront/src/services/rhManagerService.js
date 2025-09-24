import api from './api';

export const rhManagerService = {
  // Get users without a team
  getUsersWithoutTeam: async () => {
    try {
      const response = await api.get('/api/users/no-team');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching users without team:', error);
      return [];
    }
  },
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await api.get('/api/users/users');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  // Get all teams
  getAllTeams: async () => {
    try {
      const response = await api.get('/api/teams');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  },

  // Create new team
  createTeam: async (teamData) => {
    try {
      const response = await api.post('/api/teams', teamData);
      return response.data;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  },

  // Update team
  updateTeam: async (teamId, teamData) => {
    try {
      const response = await api.put(`/api/teams/${teamId}`, teamData);
      return response.data;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  },

  // Delete team
  deleteTeam: async (teamId) => {
    try {
      const response = await api.delete(`/api/teams/${teamId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  },

  // Assign user to team
  assignUserToTeam: async (userId, teamId) => {
    try {
      const response = await api.post('/api/teams/assign-user', {
        userId,
        teamId
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning user to team:', error);
      throw error;
    }
  },

  // Remove user from team
  removeUserFromTeam: async (userId, teamId) => {
    try {
      const response = await api.post('/api/teams/remove-user', {
        userId,
        teamId
      });
      return response.data;
    } catch (error) {
      console.error('Error removing user from team:', error);
      throw error;
    }
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    try {
      const response = await api.put(`/api/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  // Get team members
  getTeamMembers: async (teamId) => {
    try {
      const response = await api.get(`/api/teams/${teamId}/members`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  },

  // Get user's team
  getUserTeam: async (userId) => {
    try {
      const response = await api.get(`/api/users/${userId}/team`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user team:', error);
      throw error;
    }
  }
};