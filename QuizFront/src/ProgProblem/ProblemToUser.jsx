import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserPlus, FaTrash, FaExclamationTriangle, FaSearch, FaArrowLeft } from 'react-icons/fa';
import AuthLayout from '../Layout/AuthLayout';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function ProblemToUser() {
  const [progProblems, setProgProblems] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [unassignedUsers, setUnassignedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [selectedRecommendations, setSelectedRecommendations] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/prog-problems/');
      setProgProblems(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users/users');
      setAllUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchAssignedUsers = async () => {
    if (!selectedProblem) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/api/prog-problems/${selectedProblem}/assigned-users`);
      const affectedUsers = response.data;

      const assigned = affectedUsers;
      const unassigned = allUsers.filter(
        (user) => !assigned.some((assignedUser) => assignedUser.id === user.id) && user.role !== 'ROLE_ADMIN'
      );

      setAssignedUsers(assigned);
      setUnassignedUsers(unassigned);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assigned users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedUsers();
  }, [selectedProblem, allUsers]);

  const handleAssignUser = async (user) => {
    if (user.role === 'ADMIN') {
      setError('Cannot assign ADMIN users to problems.');
      return;
    }
    try {
      await api.post('/prog-actions/assign-problem', {
        userId: user.id,
        progProblemId: selectedProblem,
      });

      setAssignedUsers([...assignedUsers, user]);
      setUnassignedUsers(unassignedUsers.filter((u) => u.id !== user.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign user to problem.');
    }
  };

  const handleUnassignUser = async (user) => {
    try {
      await api.post('/prog-actions/unassign-problem', {
        userId: user.id,
        progProblemId: selectedProblem,
      });

      if (user.role !== 'ADMIN') {
        setUnassignedUsers([...unassignedUsers, user]);
      }
      setAssignedUsers(assignedUsers.filter((u) => u.id !== user.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unassign user from problem.');
    }
  };

  const handleAssignAll = async () => {
    try {
      await Promise.all(
        filteredUnassignedUsers.map((user) =>
          api.post('/prog-actions/assign-problem', {
            userId: user.id,
            progProblemId: selectedProblem,
          })
        )
      );

      setAssignedUsers([...assignedUsers, ...filteredUnassignedUsers]);
      setUnassignedUsers([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign all users to problem.');
    }
  };

  const handleUnassignAll = async () => {
    try {
      await Promise.all(
        assignedUsers.map((user) =>
          api.post('/prog-actions/unassign-problem', {
            userId: user.id,
            progProblemId: selectedProblem,
          })
        )
      );

      const nonAdminUsers = assignedUsers.filter(user => user.role !== 'ADMIN');
      setUnassignedUsers([...unassignedUsers, ...nonAdminUsers]);
      setAssignedUsers([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unassign all users from problem.');
    }
  };

  const handleAIAssignment = async () => {
    if (!selectedProblem) {
      setError("Please select a programming problem first");
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/prog-actions/ai-preview-problem/${selectedProblem}`);
      const filteredRecommendations = response.data.recommendations?.filter(r => {
        const user = allUsers.find(u => u.id === r.userId);
        return user && user.role !== 'ADMIN';
      }) || [];
      setAiRecommendations(filteredRecommendations);
      setSelectedRecommendations(filteredRecommendations.map(r => r.userId));
      setShowAIDialog(true);
    } catch (error) {
      console.error("Error getting AI recommendations:", error);
      setError("Failed to get AI recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAIAssignments = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/prog-actions/ai-assign-problem/${selectedProblem}`, {
        selectedUsers: selectedRecommendations
      });
      
      if (response.data.success) {
        fetchAssignedUsers();
        setShowAIDialog(false);
        setAiRecommendations([]);
        setSelectedRecommendations([]);
      }
    } catch (error) {
      console.error("Error confirming AI assignments:", error);
      setError("Failed to confirm AI assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationToggle = (userId) => {
    setSelectedRecommendations(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const AIRecommendationDialog = () => {
    if (!showAIDialog) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-gray-800 mb-4">AI Assignment Recommendations</h3>
          
          {aiRecommendations.length === 0 ? (
            <p className="text-gray-600">No suitable users found for this programming problem.</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Select the users you want to assign to this programming problem:
              </p>
              
              {aiRecommendations.map((recommendation) => (
                <div 
                  key={recommendation.userId} 
                  className={`border rounded-lg p-4 ${
                    selectedRecommendations.includes(recommendation.userId) 
                      ? 'border-blue-500 bg-blue-100' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedRecommendations.includes(recommendation.userId)}
                        onChange={() => handleRecommendationToggle(recommendation.userId)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-800">{recommendation.userName}</h4>
                        <p className="text-sm text-gray-600">
                          Rank: {recommendation.userRank} | Points: {recommendation.userPoints}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        recommendation.score >= 80 ? 'text-green-600' :
                        recommendation.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {recommendation.score}%
                      </div>
                      <div className="text-xs text-gray-500">Match Score</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                    <strong>Explanation:</strong> {recommendation.explanation}
                  </div>
                  
                  {recommendation.skills && recommendation.skills.length > 0 && (
                    <div className="mt-2">
                      <strong className="text-sm text-gray-800">Relevant Skills:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {recommendation.skills.map((skill, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {recommendation.languages && recommendation.languages.length > 0 && (
                    <div className="mt-2">
                      <strong className="text-sm text-gray-800">Programming Languages:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {recommendation.languages.map((lang, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowAIDialog(false);
                setAiRecommendations([]);
                setSelectedRecommendations([]);
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
              disabled={loading}
            >
              Cancel
            </button>
            {aiRecommendations.length > 0 && (
              <button
                onClick={handleConfirmAIAssignments}
                disabled={loading || selectedRecommendations.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? "Assigning..." : `Confirm ${selectedRecommendations.length} Assignment(s)`}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const goBack = () => {
    navigate('/admin/progproblems');
  };

  const filteredUnassignedUsers = unassignedUsers.filter((user) =>
    (user.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
     user.email?.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const formatDifficulty = (difficulty) => {
    const colors = {
      'easy': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'hard': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[difficulty] || 'bg-gray-100 text-gray-800'}`}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </span>
    );
  };

  return (
    <AuthLayout>
      <>
        <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={goBack}
              className="flex items-center text-[#006674] hover:text-[#00525d] mb-4"
            >
              <FaArrowLeft className="mr-2" /> Back to Programming Problems
            </button>

            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Assign Users to Programming Problems
            </h1>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center"
              >
                <FaExclamationTriangle className="mr-2" />
                <p>{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-700 hover:text-red-900"
                >
                  ×
                </button>
              </motion.div>
            )}

            <div className="mb-8">
              <label className="block text-gray-700 font-medium mb-2">
                Select Programming Problem:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {progProblems.map((problem) => (
                  <motion.div
                    key={problem.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedProblem(problem.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedProblem === problem.id
                        ? "bg-blue-100 border-2 border-blue-500"
                        : "bg-white hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <h3 className="font-semibold text-gray-800">{problem.title}</h3>
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-gray-600 mr-2">Difficulty: {formatDifficulty(problem.difficulty)}</span>
                      <span className="text-sm text-gray-600">Points: {problem.points_total}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {selectedProblem && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {progProblems.find((p) => p.id === selectedProblem)?.title}
                  </h2>
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAIAssignment}
                      disabled={loading}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded text-sm font-medium hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
                      title="Use AI to automatically assign suitable users based on their CV profiles"
                    >
                      {loading ? "🤖 AI Assigning..." : "🤖 AI Assign"}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAssignAll}
                      disabled={filteredUnassignedUsers.length === 0}
                      className={`px-4 py-2 rounded text-sm flex items-center ${
                        filteredUnassignedUsers.length === 0
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                    >
                      Assign All Filtered
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleUnassignAll}
                      disabled={assignedUsers.length === 0}
                      className={`px-4 py-2 rounded text-sm flex items-center ${
                        assignedUsers.length === 0
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-red-500 hover:bg-red-600 text-white"
                      }`}
                    >
                      Unassign All
                    </motion.button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <FaSearch className="text-gray-400" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Note: Users with ADMIN role cannot be assigned to problems.
                  </p>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006674]"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3 text-gray-800">
                        Unassigned Users ({filteredUnassignedUsers.length})
                      </h3>
                      <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                        {filteredUnassignedUsers.length > 0 ? (
                          <ul className="divide-y divide-gray-200">
                            <AnimatePresence>
                              {filteredUnassignedUsers.map((user) => (
                                <motion.li
                                  key={user.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  whileHover={{ backgroundColor: "#f3f9ff" }}
                                  className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                                  onClick={() => handleAssignUser(user)}
                                >
                                  <div>
                                    <p className="font-medium text-gray-800">
                                      {user.username}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {user.email}
                                    </p>
                                  </div>
                                  <motion.span
                                    whileHover={{ scale: 1.1 }}
                                    className="px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-medium"
                                  >
                                    Assign
                                  </motion.span>
                                </motion.li>
                              ))}
                            </AnimatePresence>
                          </ul>
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            No unassigned users found
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-3 text-gray-800">
                        Assigned Users ({assignedUsers.length})
                      </h3>
                      <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                        {assignedUsers.length > 0 ? (
                          <ul className="divide-y divide-gray-200">
                            <AnimatePresence>
                              {assignedUsers.map((user) => (
                                <motion.li
                                  key={user.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  whileHover={{ backgroundColor: "#fff5f5" }}
                                  className="p-3 hover:bg-red-50 cursor-pointer flex justify-between items-center"
                                  onClick={() => handleUnassignUser(user)}
                                >
                                  <div>
                                    <p className="font-medium text-gray-800">
                                      {user.username}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {user.email}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      Status: {user.status || "Pending"}
                                    </p>
                                    {user.role === 'ADMIN' && (
                                      <p className="text-xs text-red-600">
                                        ADMIN
                                      </p>
                                    )}
                                  </div>
                                  <motion.span
                                    whileHover={{ scale: 1.1 }}
                                    className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium"
                                  >
                                    Unassign
                                  </motion.span>
                                </motion.li>
                              ))}
                            </AnimatePresence>
                          </ul>
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            No assigned users yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <AIRecommendationDialog />
      </>
    </AuthLayout>
  );
}