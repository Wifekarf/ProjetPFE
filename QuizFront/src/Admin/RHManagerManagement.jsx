import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUserPlus, FaUserMinus, FaUserShield, FaSearch } from 'react-icons/fa';
import AuthLayout from '../Layout/AuthLayout';
import { rhManagerService } from '../services/rhManagerService';
import CreateRHManagerModal from './CreateRHManagerModal';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { FaUsers } from 'react-icons/fa';

export default function RHManagerManagement() {
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(6);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
  });
  const navigate = useNavigate();
  useEffect(() => {
    fetchData();
  }, []);
    useEffect(() => {
    setCurrentPage(1);
    }, [searchTerm]);
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    const fetchData = async () => {
    setLoading(true);
    try {
        const usersData = await rhManagerService.getAllUsers();
        setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
        console.error('Error fetching data:', error);
        setUsers([]);
    } finally {
        setLoading(false);
    }
    };
  const handleCreateRHManager = async (e) => {
    e.preventDefault();
    try {
      await rhManagerService.createRHManager(formData);
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      console.error('Error creating RH Manager:', error);
    }
  };

const handleGrantRole = async (userId) => {
  try {
    await rhManagerService.grantRHRole(userId);
    fetchData(); 
  } catch (error) {
    console.error('Error granting RH role:', error);
  }
};
const handleRevokeRole = async (userId) => {
  try {
    await rhManagerService.revokeRHRole(userId);
    fetchData(); 
  } catch (error) {
    console.error('Error revoking RH role:', error);
  }
};
const handlePageChange = (pageNumber) => {
  setCurrentPage(pageNumber);
};

  return (
    <AuthLayout>
      <div className="container mx-auto mt-16 px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">RH Managers</h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FaUserPlus />
              Create RH Manager
            </motion.button>
                          <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/rh/teams')}
                className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-600"
              >
                <FaUsers />
                View Teams
              </motion.button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Responsive Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grant/Revoke Role
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
                    className="transition-all duration-20"
                    >
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                        {user.username}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                        {user.email}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.role === 'ROLE_RH_MANAGER' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'}`}
                    >
                        {user.role === 'ROLE_RH_MANAGER' ? 'RH Manager' : 'User'}
                    </span>
                    </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex justify-center items-center">
                        {user.role === 'ROLE_RH_MANAGER' ? (
                            <motion.button
                            whileHover={{ 
                                scale: 1.5,
                                backgroundColor: "rgba(239, 68, 68, 0.1)",
                            }}
                            className="text-red-500 hover:text-red-700 p-2 rounded-full cursor-pointer transition-colors duration-20"
                            title="Revoke RH Manager Role"
                            onClick={() => handleRevokeRole(user.id)}
                            >
                            <FaUserMinus />
                            </motion.button>
                        ) : (
                            <motion.button
                            whileHover={{ 
                                scale: 1.5,
                                backgroundColor: "rgba(34, 197, 94, 0.1)",
                            }}
                            className="text-green-500 hover:text-green-700 p-2 rounded-full cursor-pointer transition-colors duration-20"
                            title="Grant RH Manager Role"
                            onClick={() => handleGrantRole(user.id)}
                            >
                            <FaUserShield />
                            </motion.button>
                        )}
                        </td>
                    </motion.tr>
                ))}
                </tbody>

            </table>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-700">
                Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of{' '}
                {filteredUsers.length} users
            </div>
            <div className="flex gap-2">
                <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md flex items-center cursor-pointer transition-all duration-20 ${
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
                    className={`px-3 py-1 rounded-md cursor-pointer transition-all duration-20 ${
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
                    className={`px-3 py-1 rounded-md flex items-center cursor-pointer transition-all duration-20 ${
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
      </div>

      {/* Create RH Manager Modal */}
      {showCreateModal && (
        <CreateRHManagerModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateRHManager}
          formData={formData}
          setFormData={setFormData}
        />
      )}
    </AuthLayout>
  );
}