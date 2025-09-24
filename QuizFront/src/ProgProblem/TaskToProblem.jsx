import { useState, useEffect } from 'react';
import AuthLayout from "../Layout/AuthLayout";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import { FaArrowLeft, FaExclamationTriangle } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import api from "../services/api";
import { getProblemTasks, assignTasksToProgProblem, unassignTaskFromProgProblem } from "../services/progProblemApi";

export default function TaskToProblem() {
  const [progProblems, setProgProblems] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [assignedTaskIds, setAssignedTaskIds] = useState([]);
  const [loading, setLoading] = useState({
    initial: true,
    tasks: false,
    assignments: false,
  });
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    languages: [],
    difficulty: "all",
    search: "",
  });
  const navigate = useNavigate();

  // Fetch all programming problems and tasks
  const fetchInitialData = async () => {
    try {
      setLoading((prev) => ({ ...prev, initial: true }));
      const [problemsRes, tasksRes] = await Promise.all([
        api.get("/api/prog-problems/"),
        api.get("/api/tasks/")
      ]);
      setProgProblems(problemsRes.data);
      setAllTasks(tasksRes.data);
      setLoading((prev) => ({ ...prev, initial: false }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load initial data");
      setLoading((prev) => ({ ...prev, initial: false }));
    }
  };

  // Fetch assigned tasks for selected problem
  const fetchAssignedTasks = async (problemId) => {
    try {
      setLoading((prev) => ({ ...prev, assignments: true }));
      const response = await getProblemTasks(problemId);

      // Only update state if the data has actually changed
      setAssignedTaskIds((prev) => {
        const newIds = response.data.task_ids || [];
        return JSON.stringify(prev) === JSON.stringify(newIds)
          ? prev
          : newIds;
      });
    } catch (err) {
      console.error("Error fetching assigned tasks:", err);
      setError(err.response?.data?.message || "Failed to load task assignments");
    } finally {
      setLoading((prev) => ({ ...prev, assignments: false }));
    }
  };

  // Handle problem selection
  const handleProblemSelect = (problem) => {
    setSelectedProblem(problem);
    fetchAssignedTasks(problem.id);
  };

  // Optimistically update UI and then sync with server
  const assignTask = async (taskId) => {
    try {
      setLoading((prev) => ({ ...prev, assignments: true }));
      
      await assignTasksToProgProblem({
        progProblemId: selectedProblem.id,
        taskIds: [taskId],
      });

      // Update UI after successful API response
      fetchAssignedTasks(selectedProblem.id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign task to problem");
    } finally {
      setLoading((prev) => ({ ...prev, assignments: false }));
    }
  };

  const unassignTask = async (taskId) => {
    try {
      setLoading((prev) => ({ ...prev, assignments: true }));
      
      await unassignTaskFromProgProblem(selectedProblem.id, taskId);

      // Update UI after successful API response
      fetchAssignedTasks(selectedProblem.id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unassign task from problem");
    } finally {
      setLoading((prev) => ({ ...prev, assignments: false }));
    }
  };

  // Get filtered unassigned tasks
  const getUnassignedTasks = () => {
    return allTasks.filter((task) => {
      // Filter by assignment
      if (assignedTaskIds.includes(task.id)) return false;

      // Apply language filters (if any languages are selected)
      if (
        filters.languages.length > 0 &&
        task.language_id &&
        !filters.languages.includes(task.language_id.toString())
      ) {
        return false;
      }

      // Filter by difficulty
      if (
        filters.difficulty !== "all" &&
        task.difficulty !== filters.difficulty
      ) {
        return false;
      }

      // Filter by search term
      if (
        filters.search &&
        !task.task_title.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  };

  // Get assigned task objects
  const getAssignedTasks = () => {
    return allTasks.filter((task) =>
      assignedTaskIds.includes(task.id)
    );
  };

  // Bulk operations with optimistic updates
  const bulkAssign = async () => {
    const unassignedIds = getUnassignedTasks().map((t) => t.id);
    setLoading((prev) => ({ ...prev, assignments: true }));
    if (unassignedIds.length === 0) return;

    try {
      await assignTasksToProgProblem({
        progProblemId: selectedProblem.id,
        taskIds: unassignedIds,
      });

      fetchAssignedTasks(selectedProblem.id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to bulk assign tasks");
    } finally {
      setLoading((prev) => ({ ...prev, assignments: false }));
    }
  };

  const bulkUnassign = async () => {
    setLoading((prev) => ({ ...prev, assignments: true }));
    if (assignedTaskIds.length === 0) return;

    try {
      await Promise.all(
        assignedTaskIds.map((id) =>
          unassignTaskFromProgProblem(selectedProblem.id, id)
        )
      );

      fetchAssignedTasks(selectedProblem.id);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to bulk unassign tasks");
    } finally {
      setLoading((prev) => ({ ...prev, assignments: false }));
    }
  };

  // Get unique languages for filter
  const getUniqueLanguages = () => {
    const languages = new Map();
    allTasks.forEach((t) => {
      if (t.language && !languages.has(t.language.id)) {
        languages.set(t.language.id, t.language);
      }
    });
    return Array.from(languages.values());
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const goBack = () => {
    navigate('/admin/progproblems');
  };

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
      <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={goBack}
            className="flex items-center text-[#006674] hover:text-[#00525d] mb-4"
          >
            <FaArrowLeft className="mr-2" /> Back to Programming Problems
          </button>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Task Assignment to Programming Problems
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
                &times;
              </button>
            </motion.div>
          )}

          {/* Loading overlay for initial load */}
          <AnimatePresence>
            {loading.initial && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-white bg-opacity-80 z-50 flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#006674] mx-auto"></div>
                  <p className="mt-4 text-lg font-medium text-gray-700">
                    Loading data...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Programming Problem Selection */}
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
                  onClick={() => handleProblemSelect(problem)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedProblem?.id === problem.id
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
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Assigning to:{" "}
                  <span className="text-blue-600">{selectedProblem.title}</span>
                </h2>
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedProblem(null)}
                    className="px-4 py-2 rounded text-sm bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded text-sm flex items-center"
                  >
                    Close
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={bulkAssign}
                    disabled={getUnassignedTasks().length === 0}
                    className={`px-4 py-2 rounded text-sm flex items-center ${
                      getUnassignedTasks().length === 0
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Assign All
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={bulkUnassign}
                    disabled={assignedTaskIds.length === 0}
                    className={`px-4 py-2 rounded text-sm flex items-center ${
                      assignedTaskIds.length === 0
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 12H4"
                      />
                    </svg>
                    Unassign All
                  </motion.button>
                </div>
              </div>
             
              {/* Filters for Unassigned Tasks */}
              <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h3 className="font-medium text-gray-700 mb-3">
                  Filter Unassigned Tasks
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={filters.difficulty}
                      onChange={(e) =>
                        setFilters({ ...filters, difficulty: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="all">All Difficulties</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search
                    </label>
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) =>
                        setFilters({ ...filters, search: e.target.value })
                      }
                      placeholder="Search tasks..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {loading.assignments ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#006674]"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Unassigned Tasks (Left Table) */}
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h3 className="font-semibold text-gray-800">
                        Unassigned Tasks ({getUnassignedTasks().length})
                      </h3>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                      {getUnassignedTasks().length > 0 ? (
                        <AnimatePresence>
                          {getUnassignedTasks().map((task) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.2 }}
                              onClick={() => assignTask(task.id)}
                              className="p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors group"
                            >
                              <div className="flex justify-between items-start">
                                <p className="font-medium text-gray-800 group-hover:text-blue-600">
                                  {task.task_title}
                                </p>
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  {task.points} pts
                                </span>
                              </div>
                              <div className="flex items-center mt-2">
                                <span className="text-xs text-gray-500 mr-2">
                                  {formatDifficulty(task.difficulty)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Time: {task.time} min
                                </span>
                              </div>
                              <div className="mt-2 flex justify-end">
                                <motion.span
                                  whileHover={{ scale: 1.1 }}
                                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded flex items-center"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                                    />
                                  </svg>
                                  Assign
                                </motion.span>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          {allTasks.length === 0
                            ? "No tasks available"
                            : "All tasks are assigned or filtered out"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assigned Tasks (Right Table) */}
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h3 className="font-semibold text-gray-800">
                        Assigned Tasks ({assignedTaskIds.length})
                      </h3>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                      {getAssignedTasks().length > 0 ? (
                        <AnimatePresence>
                          {getAssignedTasks().map((task) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.2 }}
                              onClick={() => unassignTask(task.id)}
                              className="p-4 border-b border-gray-100 hover:bg-red-50 cursor-pointer transition-colors group"
                            >
                              <div className="flex justify-between items-start">
                                <p className="font-medium text-gray-800 group-hover:text-red-600">
                                  {task.task_title}
                                </p>
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  {task.points} pts
                                </span>
                              </div>
                              <div className="flex items-center mt-2">
                                <span className="text-xs text-gray-500 mr-2">
                                  {formatDifficulty(task.difficulty)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Time: {task.time} min
                                </span>
                              </div>
                              <div className="mt-2 flex justify-end">
                                <motion.span
                                  whileHover={{ scale: 1.1 }}
                                  className="text-xs bg-red-500 text-white px-2 py-1 rounded flex items-center"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3 mr-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                  </svg>
                                  Unassign
                                </motion.span>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          No tasks assigned yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  );
} 