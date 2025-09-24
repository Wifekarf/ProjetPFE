import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaUserPlus, FaUserMinus, FaBan, FaUnlock, FaSearch, FaEdit, FaTrash, FaBrain } from 'react-icons/fa';
import AuthLayout from '../Layout/AuthLayout';
import { userService } from '../services/userService';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import UserAnalysisModal from './UserAnalysisModal';

export default function ManageUsers() {
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(8);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedRank, setSelectedRank] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'ROLE_USER',
    rank: 'JUNIOR'
  });
  const [editFormData, setEditFormData] = useState({
    email: '',
    username: '',
    role: 'ROLE_USER',
    rank: 'JUNIOR'
  });
  const [actionMenuUserId, setActionMenuUserId] = useState(null);
  const actionMenuRef = useRef();
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [userToAnalyze, setUserToAnalyze] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole, selectedRank, selectedStatus]);

  // Close action menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setActionMenuUserId(null);
      }
    }
    if (actionMenuUserId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionMenuUserId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersData = await userService.getAllUsers();
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter out admins from the users list
  const filteredUsers = users
    .filter(user => user.role !== 'ROLE_ADMIN')
    .filter(user => {
      const matchesSearch = 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      const matchesRank = selectedRank === 'all' || user.rank === selectedRank;
      const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
      return matchesSearch && matchesRole && matchesRank && matchesStatus;
    });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await userService.createUser(formData);
      setShowCreateModal(false);
      setFormData({ email: '', username: '', password: '', role: 'ROLE_USER', rank: 'JUNIOR' });
      fetchData();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await userService.deleteUser(userId);
        fetchData();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleBanUser = async (userId) => {
    try {
      await userService.banUser(userId);
      fetchData();
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await userService.unbanUser(userId);
      fetchData();
    } catch (error) {
      console.error('Error unbanning user:', error);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      email: user.email,
      username: user.username,
      role: user.role,
      rank: user.rank || 'JUNIOR'
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await userService.updateUserRole(selectedUser.id, editFormData.role);
      await userService.updateUserRank(selectedUser.id, editFormData.rank);
      setShowEditModal(false);
      setSelectedUser(null);
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleAnalyzeUser = (user) => {
    setUserToAnalyze(user);
    setShowAnalysisModal(true);
    setActionMenuUserId(null);
  };

  const handleCloseAnalysisModal = () => {
    setShowAnalysisModal(false);
    setUserToAnalyze(null);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'bg-red-100 text-red-800';
      case 'ROLE_TEAM_MANAGER':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case 'SENIOR':
        return 'bg-green-100 text-green-800';
      case 'JUNIOR':
        return 'bg-blue-100 text-blue-800';
      case 'ALTERNATE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <AuthLayout>
        <div className="container mx-auto mt-16 px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="container mx-auto mt-16 px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
            >
              <FaUserPlus />
              Add User
            </motion.button>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <select
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="ROLE_ADMIN">Admin</option>
                <option value="ROLE_TEAM_MANAGER">Team Manager</option>
                <option value="ROLE_USER">User</option>
              </select>
              
              <select
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedRank}
                onChange={(e) => setSelectedRank(e.target.value)}
              >
                <option value="all">All Ranks</option>
                <option value="SENIOR">Senior</option>
                <option value="JUNIOR">Junior</option>
                <option value="ALTERNATE">Alternate</option>
              </select>
              
              <select
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentUsers.map((user) => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ 
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                      transition: { duration: 0.05 }
                    }}
                    className="transition-all duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-800">
                              {user.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role?.replace('ROLE_', '')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRankBadgeColor(user.rank)}`}>
                        {user.rank || 'JUNIOR'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.date_creation ? new Date(user.date_creation).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                      <div className="flex justify-center">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setActionMenuUserId(user.id)}
                          className="text-blue-500 hover:text-blue-700 p-1 border border-blue-200 rounded-full bg-blue-50 shadow-sm"
                          title="Actions"
                        >
                          &#x22EE;
                        </motion.button>
                        {actionMenuUserId === user.id && (
                          <div ref={actionMenuRef} className="absolute z-50 top-10 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[160px] flex flex-col gap-2">
                            <button
                              onClick={() => handleAnalyzeUser(user)}
                              className="w-full text-left px-3 py-2 hover:bg-purple-100 rounded"
                            >
                              <FaBrain className="inline mr-2" /> AI Analysis
                            </button>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button
                              onClick={() => { handleEditUser(user); setActionMenuUserId(null); }}
                              className="w-full text-left px-3 py-2 hover:bg-blue-100 rounded"
                            >
                              <FaEdit className="inline mr-2" /> Edit
                            </button>
                            {user.status === 'inactive' ? (
                              <button
                                onClick={() => { handleUnbanUser(user.id); setActionMenuUserId(null); }}
                                className="w-full text-left px-3 py-2 hover:bg-green-100 rounded"
                              >
                                <FaUnlock className="inline mr-2" /> Unban
                              </button>
                            ) : (
                              <button
                                onClick={() => { handleBanUser(user.id); setActionMenuUserId(null); }}
                                className="w-full text-left px-3 py-2 hover:bg-yellow-100 rounded"
                              >
                                <FaBan className="inline mr-2" /> Ban
                              </button>
                            )}
                            <button
                              onClick={() => { handleDeleteUser(user.id); setActionMenuUserId(null); }}
                              className="w-full text-left px-3 py-2 hover:bg-red-100 rounded"
                            >
                              <FaTrash className="inline mr-2" /> Delete
                            </button>
                            <div className="border-t border-gray-200 my-1"></div>
                            <div className="px-3 py-1 text-xs text-gray-500">Change Rank</div>
                            {['JUNIOR', 'SENIOR', 'ALTERNATE'].map((rank) => (
                              <button
                                key={rank}
                                onClick={async () => { await userService.updateUserRank(user.id, rank); fetchData(); setActionMenuUserId(null); }}
                                className={`w-full text-left px-3 py-2 rounded ${user.rank === rank ? 'bg-blue-100 font-bold' : 'hover:bg-gray-100'}`}
                              >
                                {rank.charAt(0) + rank.slice(1).toLowerCase()}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-700">
              Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of{' '}
              {filteredUsers.length} users
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md flex items-center cursor-pointer transition-all duration-200 ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md active:scale-95'
                }`}
              >
                <FaChevronLeft className="h-4 w-4" />
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => handlePageChange(index + 1)}
                  className={`px-3 py-1 rounded-md cursor-pointer transition-all duration-200 ${
                    currentPage === index + 1
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md active:scale-95'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md flex items-center cursor-pointer transition-all duration-200 ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md active:scale-95'
                }`}
              >
                <FaChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold mb-4">Create New User</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="ROLE_USER">User</option>
                    <option value="ROLE_TEAM_MANAGER">Team Manager</option>
                    <option value="ROLE_ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rank
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                  >
                    <option value="JUNIOR">Junior</option>
                    <option value="SENIOR">Senior</option>
                    <option value="ALTERNATE">Alternate</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                  >
                    Create User
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold mb-4">Edit User</h2>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  >
                    <option value="ROLE_USER">User</option>
                    <option value="ROLE_TEAM_MANAGER">Team Manager</option>
                    <option value="ROLE_ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rank
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editFormData.rank}
                    onChange={(e) => setEditFormData({ ...editFormData, rank: e.target.value })}
                  >
                    <option value="JUNIOR">Junior</option>
                    <option value="SENIOR">Senior</option>
                    <option value="ALTERNATE">Alternate</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                  >
                    Update User
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* User Analysis Modal */}
        <UserAnalysisModal
          user={userToAnalyze}
          isOpen={showAnalysisModal}
          onClose={handleCloseAnalysisModal}
        />
      </div>
    </AuthLayout>
  );
} 