import { useState, useEffect } from "react";
import api from "../services/api";
import { motion } from "framer-motion";
import AuthLayout from "../Layout/AuthLayout";

const AffUser = ({ quizId }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [users,   setUsers]     = useState([]);
  //const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(quizId);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [unassignedUsers, setUnassignedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [selectedRecommendations, setSelectedRecommendations] = useState([]);

  useEffect(() => {
    setSelectedQuiz(quizId);
  }, [quizId]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, quizzesRes] = await Promise.all([
        api.get("/api/users/users"),
        api.get("/api/quizzes")
      ]);
      setUsers(usersRes.data);
      setQuizzes(quizzesRes.data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  // Fetch all users when component mounts
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await api.get("/api/users/users");
        setAllUsers(response.data);
      } catch (error) {
        console.error("Error fetching all users:", error);
      }
    };
    fetchAllUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch affected users
      const affectedResponse = await api.get("/actions/get-all-affected-users");
      const affectedUsers = affectedResponse.data.affectations;

      // Filter assigned and unassigned users for selected quiz
      const assigned = affectedUsers
        .filter((aff) => aff.quiz.id === selectedQuiz)
        .map((aff) => aff.user);

      const unassigned = allUsers.filter(
        (user) =>
          !assigned.some((assignedUser) => assignedUser.id === user.id)
      );

      setAssignedUsers(assigned);
      setUnassignedUsers(unassigned);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users when quiz is selected
  useEffect(() => {
    if (!selectedQuiz) return;
    fetchUsers();
  }, [selectedQuiz, allUsers]);

  const handleAssignUser = async (user) => {
    try {
      await api.post("/actions/assign-quiz", {
        userId: user.id,
        quizId: selectedQuiz,
      });

      // Update local state
      setAssignedUsers([...assignedUsers, user]);
      setUnassignedUsers(unassignedUsers.filter((u) => u.id !== user.id));
    } catch (error) {
      console.error("Error assigning quiz:", error);
    }
  };

  const handleUnassignUser = async (user) => {
    try {
      await api.post("/actions/unassign-quiz", {
        userId: user.id,
        quizId: selectedQuiz,
      });

      // Update local state
      setUnassignedUsers([...unassignedUsers, user]);
      setAssignedUsers(assignedUsers.filter((u) => u.id !== user.id));
    } catch (error) {
      console.error("Error unassigning quiz:", error);
    }
  };

  const handleAssignAll = async () => {
    try {
      // Filter users based on current filters
      const usersToAssign = filteredUnassignedUsers;

      // Assign all in parallel
      await Promise.all(
        usersToAssign.map((user) =>
          api.post("/actions/assign-quiz", {
            userId: user.id,
            quizId: selectedQuiz,
          })
        )
      );

      // Update local state
      setAssignedUsers([...assignedUsers, ...usersToAssign]);
      setUnassignedUsers(
        unassignedUsers.filter(
          (u) => !usersToAssign.some((user) => user.id === u.id)
        )
      );
    } catch (error) {
      console.error("Error assigning all:", error);
    }
  };

  const handleUnassignAll = async () => {
    try {
      // Unassign all in parallel
      await Promise.all(
        assignedUsers.map((user) =>
          api.post("/actions/unassign-quiz", {
            userId: user.id,
            quizId: selectedQuiz,
          })
        )
      );

      // Update local state
      setUnassignedUsers([...unassignedUsers, ...assignedUsers]);
      setAssignedUsers([]);
    } catch (error) {
      console.error("Error unassigning all:", error);
    }
  };

  const handleAIAssignment = async () => {
    if (!selectedQuiz) {
      setError("Please select a quiz first");
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/actions/ai-preview-quiz/${selectedQuiz}`);
      setAiRecommendations(response.data.recommendations || []);
      setSelectedRecommendations(response.data.recommendations?.map(r => r.userId) || []);
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
      const response = await api.post(`/actions/ai-assign-quiz/${selectedQuiz}`, {
        selectedUsers: selectedRecommendations
      });
      
      if (response.data.success) {
        // Refresh the user lists
        fetchUsers();
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <h3 className="text-xl font-bold mb-4">AI Assignment Recommendations</h3>
          
          {aiRecommendations.length === 0 ? (
            <p className="text-gray-600">No suitable users found for this quiz.</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Select the users you want to assign to this quiz:
              </p>
              
              {aiRecommendations.map((recommendation) => (
                <div 
                  key={recommendation.userId} 
                  className={`border rounded-lg p-4 ${
                    selectedRecommendations.includes(recommendation.userId) 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedRecommendations.includes(recommendation.userId)}
                        onChange={() => handleRecommendationToggle(recommendation.userId)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <h4 className="font-semibold">{recommendation.userName}</h4>
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
                      <strong className="text-sm">Relevant Skills:</strong>
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
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
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

  // Filter unassigned users based on search term and filters, and exclude admins
  const filteredUnassignedUsers = unassignedUsers
    .filter((user) => user.role !== 'ROLE_ADMIN')
    .filter((user) => {
      const matchesSearch =
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole =
        selectedRole === "all" ||
        (user.role && user.role.toLowerCase() === selectedRole.toLowerCase());

      const matchesStatus =
        selectedStatus === "all" ||
        (user.status &&
          user.status.toLowerCase() === selectedStatus.toLowerCase());

      return matchesSearch && matchesRole && matchesStatus;
    });

  // Also filter assignedUsers if you want to hide admins from the right column
  const filteredAssignedUsers = assignedUsers.filter((user) => user.role !== 'ROLE_ADMIN');

  return (
    <AuthLayout>
      <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] px-4 md:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Quiz User Assignment
        </h1>

        {/* Quiz Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">
            Select a Quiz
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {quizzes.map((quiz) => (
              <motion.button
                key={quiz.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className={`p-3 rounded-lg border ${
                  selectedQuiz === quiz.id
                    ? "bg-blue-100 border-blue-500"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedQuiz(quiz.id)}
              >
                <div className="text-left">
                  <h3 className="font-medium text-gray-800">{quiz.nom}</h3>
                  <p className="text-sm text-gray-600">
                    {quiz.nb_question} questions
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {selectedQuiz && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unassigned Users */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-700">
                  Available Users
                </h2>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAIAssignment}
                    disabled={loading}
                    className="px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-md text-sm font-medium hover:from-purple-600 hover:to-blue-600 disabled:opacity-50"
                    title="Use AI to automatically assign suitable users based on their CV profiles"
                  >
                    {loading ? "🤖 AI Assigning..." : "🤖 AI Assign"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      filteredUnassignedUsers.length === 0
                        ? "bg-gray-300 cursor-not-allowed text-gray-600"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                    onClick={handleAssignAll}
                    disabled={filteredUnassignedUsers.length === 0}
                  >
                    Assign All
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedQuiz(null)}
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300"
                  >
                    Close
                  </motion.button>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                      <option value="teacher">Teacher</option>
                      <option value="student">Student</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredUnassignedUsers.length > 0 ? (
                  filteredUnassignedUsers.map((user) => (
                    <motion.div
                      key={user.id}
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer"
                      onClick={() => handleAssignUser(user)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-gray-800">
                            {user.username}
                          </h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex space-x-2 mt-1">
                            {user.role && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                {user.role}
                              </span>
                            )}
                            {user.status && (
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  user.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : user.status === "inactive"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {user.status}
                              </span>
                            )}
                          </div>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.2 }}
                          className="text-green-500"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    {unassignedUsers.length === 0
                      ? "No available users"
                      : "No users match filters"}
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Users */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-700">
                  Assigned Users ({filteredAssignedUsers.length})
                </h2>
                {filteredAssignedUsers.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium"
                    onClick={handleUnassignAll}
                  >
                    Unassign All
                  </motion.button>
                )}
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAssignedUsers.length > 0 ? (
                  filteredAssignedUsers.map((user) => (
                    <motion.div
                      key={user.id}
                      whileHover={{ x: -5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer"
                      onClick={() => handleUnassignUser(user)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-gray-800">
                            {user.username}
                          </h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex space-x-2 mt-1">
                            {user.role && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                {user.role}
                              </span>
                            )}
                            {user.status && (
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  user.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : user.status === "inactive"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {user.status}
                              </span>
                            )}
                          </div>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.2 }}
                          className="text-red-500"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No assigned users
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!selectedQuiz && !loading && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-700">
              Select a quiz to manage users
            </h3>
            <p className="mt-1 text-gray-500">
              Choose a quiz from the list above to view and manage assigned
              users
            </p>
          </div>
        )}
        <AIRecommendationDialog />
      </div>
    </AuthLayout>
  );
};

export default AffUser;
