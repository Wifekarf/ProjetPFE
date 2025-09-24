import api from './api';

export const userService = {
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

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await api.post('/api/users/create', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Ban user (update status to inactive)
  banUser: async (userId) => {
    try {
      const response = await api.put(`/api/users/modif/${userId}`, {
        status: 'inactive'
      });
      return response.data;
    } catch (error) {
      console.error('Error banning user:', error);
      throw error;
    }
  },

  // Unban user (update status to active)
  unbanUser: async (userId) => {
    try {
      const response = await api.put(`/api/users/modif/${userId}`, {
        status: 'active'
      });
      return response.data;
    } catch (error) {
      console.error('Error unbanning user:', error);
      throw error;
    }
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    try {
      const response = await api.put(`/api/users/modif/${userId}`, { role });
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  // Update user rank
  updateUserRank: async (userId, rank) => {
    try {
      const response = await api.put(`/api/users/modif/${userId}`, { rank });
      return response.data;
    } catch (error) {
      console.error('Error updating user rank:', error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }
}; 