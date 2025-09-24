import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { getProgProblems, createProgProblem, updateProgProblem, deleteProgProblem, shareProgProblem } from '../services/progProblemApi';
import { FaEdit, FaTrash, FaPlus, FaShareAlt, FaCode, FaUserPlus, FaTasks, FaListAlt } from 'react-icons/fa';
import AuthLayout from "../Layout/AuthLayout";

const ProgProblem = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    date_debut: '',
    date_fin: '',
  });
  const [shareData, setShareData] = useState({
    email: '',
    code: '',
    problemTitle: '',
  });
  const navigate = useNavigate();

  const [codeModal, setCodeModal] = useState({
    visible: false,
    code: "",
    expiry: "",
  });
  const [countdown, setCountdown] = useState("");
  const [selectedProblemForUsers, setSelectedProblemForUsers] = useState(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [assignedUsersList, setAssignedUsersList] = useState([]);
  const [shareModal, setShareModal] = useState({
    visible: false,
    email: "",
    code: "",
    problemTitle: "",
  });

  useEffect(() => {
    fetchProblems();
  }, []);

  useEffect(() => {
    if (!codeModal.visible) return;
    const expiryTs = new Date(codeModal.expiry).getTime();
    const interval = setInterval(() => {
      const diff = expiryTs - Date.now();
      if (diff <= 0) {
        clearInterval(interval);
        setCountdown("Expired");
      } else {
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setCountdown(`${d}d ${h}h ${m}m ${s}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [codeModal]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const response = await getProgProblems();
      setProblems(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (problem = null) => {
    if (problem) {
      setCurrentProblem(problem);
      setFormData({
        title: problem.title || '',
        description: problem.description || '',
        difficulty: problem.difficulty || 'medium',
        date_debut: problem.date_debut ? problem.date_debut.substring(0, 16) : '',
        date_fin: problem.date_fin ? problem.date_fin.substring(0, 16) : '',
      });
    } else {
      setCurrentProblem(null);
      setFormData({
        title: '',
        description: '',
        difficulty: 'medium',
        date_debut: '',
        date_fin: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentProblem(null);
  };

  const handleOpenShareModal = (problem) => {
    setShareData({
      email: '',
      code: problem.code || '',
      problemTitle: problem.title || '',
    });
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleShareChange = (e) => {
    const { name, value } = e.target;
    setShareData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentProblem) {
        await updateProgProblem(currentProblem.id, formData);
      } else {
        await createProgProblem(formData);
      }
      fetchProblems();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this programming problem?")) {
      return;
    }
    
    try {
      await deleteProgProblem(id);
      fetchProblems();
    } catch (err) {
      setError(
        `The problem ${id} cannot be deleted because it has assigned tasks, user assignments, or results.`
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    try {
      await shareProgProblem(shareData);
      alert(`Problem shared with ${shareData.email} successfully!`);
      handleCloseShareModal();
    } catch (err) {
      alert(`Failed to share problem: ${err.message}`);
    }
  };

  const handleEdit = (problem) => {
    handleOpenModal(problem);
  };

  const goToTasks = (problemId) => {
    navigate(`/admin/progproblems/tasks`);
  };

  const goToTaskManagement = () => {
    navigate('/admin/tasks');
  };

  const goToUserAssignment = () => {
    navigate('/admin/progproblems/assign');
  };

  return (
    <AuthLayout>
      <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Programming Problem Management
            </h1>
            <div className="flex space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToTaskManagement}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow flex items-center"
              >
                <FaListAlt className="mr-2" /> Manage Tasks
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToTasks}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow flex items-center"
              >
                <FaTasks className="mr-2" /> Assign Tasks
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToUserAssignment}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow flex items-center"
              >
                <FaUserPlus className="mr-2" /> Assign to Users
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOpenModal()}
                className="bg-[#006674] hover:bg-[#00525d] text-white py-2 px-4 rounded-lg flex items-center gap-2 shadow-md"
              >
                <FaPlus className="text-sm" />
                Create Problem
              </motion.button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 bg-red-100 border-l-4 border-red-500 text-red-700"
            >
              {error}
            </motion.div>
          )}

          {/* Code Modal */}
          <AnimatePresence>
            {codeModal.visible && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                onClick={() => setCodeModal({ ...codeModal, visible: false })}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">Access Code</h2>
                  <div className="bg-gray-100 p-4 rounded-lg mb-4">
                    <div className="text-center">
                      <span className="text-2xl font-mono font-bold tracking-wider text-[#006674]">
                        {codeModal.code}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    This code can be used to access the problem until:
                  </p>
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-4">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-yellow-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>
                        <strong>{countdown}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setCodeModal({ ...codeModal, visible: false })}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Share Modal */}
          <AnimatePresence>
            {showShareModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                onClick={handleCloseShareModal}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">
                    Share Problem Access
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Share access to <strong>{shareData.problemTitle}</strong> with another user:
                  </p>
                  <form onSubmit={handleShare}>
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Recipient Email:</label>
                      <input
                        type="email"
                        value={shareData.email}
                        onChange={(e) =>
                          setShareData({ ...shareData, email: e.target.value })
                        }
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#006674] focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Access Code:</label>
                      <div className="flex">
                        <input
                          type="text"
                          value={shareData.code}
                          readOnly
                          className="w-full p-2 bg-gray-100 border border-gray-300 rounded-l focus:outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(shareData.code);
                            alert("Code copied to clipboard!");
                          }}
                          className="bg-gray-200 px-3 rounded-r border-y border-r border-gray-300"
                          title="Copy to clipboard"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCloseShareModal}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-[#006674] hover:bg-[#00525d] text-white py-2 px-4 rounded"
                      >
                        Send Invitation
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Problem Form Modal */}
          <AnimatePresence>
            {showModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                onClick={() => setShowModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">
                    {currentProblem ? "Edit Problem" : "Create New Problem"}
                  </h2>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Title:</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#006674] focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Description:</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded h-32 focus:outline-none focus:ring-2 focus:ring-[#006674] focus:border-transparent"
                        required
                      ></textarea>
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Difficulty:</label>
                      <select
                        name="difficulty"
                        value={formData.difficulty}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#006674] focus:border-transparent"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-gray-700 mb-2">Start Date:</label>
                        <input
                          type="datetime-local"
                          name="date_debut"
                          value={formData.date_debut}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#006674] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">End Date:</label>
                        <input
                          type="datetime-local"
                          name="date_fin"
                          value={formData.date_fin}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#006674] focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-[#006674] hover:bg-[#00525d] text-white py-2 px-4 rounded"
                      >
                        {currentProblem ? "Update" : "Create"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Problem List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-[#006674] border-t-transparent rounded-full"
              ></motion.div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {problems.map((problem) => (
                      <tr key={problem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{problem.title}</div>
                          <div className="text-sm text-gray-500">{problem.description.substring(0, 50)}...</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            problem.difficulty === 'easy' 
                              ? 'bg-green-100 text-green-800' 
                              : problem.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(problem.date_debut).toLocaleDateString()} - {new Date(problem.date_fin).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {problem.nb_tasks || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-center space-x-3">
                            <button
                              onClick={() => goToTasks()}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Assign Tasks"
                            >
                              <FaTasks />
                            </button>
                            <button
                              onClick={() => handleEdit(problem)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Problem"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(problem.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Problem"
                            >
                              <FaTrash />
                            </button>
                            <button
                              onClick={() => handleOpenShareModal(problem)}
                              className="text-green-600 hover:text-green-900"
                              title="Share Problem"
                            >
                              <FaShareAlt />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default ProgProblem;