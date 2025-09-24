import { useState, useEffect } from "react";
import api from "../services/api";
import AuthLayout from "../Layout/AuthLayout";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import "./affquestion.css";

export default function Affectation() {
  const [quizzes, setQuizzes] = useState([]);
  const [users, setUsers] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [assignedQuestionIds, setAssignedQuestionIds] = useState([]);
  const [loading, setLoading] = useState({
    initial: true,
    questions: false,
    assignments: false,
  });
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    languages: [], // Changé de "language: 'all'" à un tableau
    difficulty: "all",
    search: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [quizzesRes, usersRes, questionsRes] = await Promise.all([
        api.get("/api/quizzes"),
        api.get("/api/users/users"),
        api.get("/api/questions")
      ]);
      setQuizzes(quizzesRes.data);
      setUsers(usersRes.data);
      setAllQuestions(questionsRes.data);
      setLoading((prev) => ({ ...prev, initial: false }));
    } catch (error) {
      setError(error.message);
      setLoading((prev) => ({ ...prev, initial: false }));
    }
  };

  // Fetch assigned questions for selected quiz
  const fetchAssignedQuestions = async (quizId) => {
    try {
      const response = await api.get(`/actions/quiz-questions/${quizId}`);

      // Only update state if the data has actually changed
      setAssignedQuestionIds((prev) => {
        const newIds = response.data.question_ids || [];
        return JSON.stringify(prev) === JSON.stringify(newIds) ? prev : newIds;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading((prev) => ({ ...prev, assignments: false }));
    }
  };

  // Handle quiz selection
  const handleQuizSelect = (quiz) => {
    setSelectedQuiz(quiz);
    fetchAssignedQuestions(quiz.id);
  };

  // Optimistically update UI and then sync with server
  const assignQuestion = async (questionId) => {
    try {
      await api.post("/actions/assign-questions-to-quiz", {
        quizId: selectedQuiz.id,
        questionIds: [questionId],
      });

      // Only update UI after successful API response
      fetchAssignedQuestions(selectedQuiz.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading((prev) => ({ ...prev, assignments: false }));
    }
  };

  const unassignQuestion = async (questionId) => {
    try {
      await api.post(`/actions/unissign-question-from-quiz/${selectedQuiz.id}/${questionId}`);

      // Only update UI after successful API response
      fetchAssignedQuestions(selectedQuiz.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading((prev) => ({ ...prev, assignments: false }));
    }
  };

  // Get filtered unassigned questions
  const getUnassignedQuestions = () => {
    return allQuestions.filter((question) => {
      // Filter by assignment
      if (assignedQuestionIds.includes(question.id)) return false;

      // Apply language filters (if any languages are selected)
      if (
        filters.languages.length > 0 &&
        question.language &&
        !filters.languages.includes(question.language.id.toString())
      ) {
        return false;
      }

      // Filter by difficulty
      if (
        filters.difficulty !== "all" &&
        question.difficulty !== filters.difficulty
      ) {
        return false;
      }

      // Filter by search term
      if (
        filters.search &&
        !question.question.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  };

  // Get assigned question objects
  const getAssignedQuestions = () => {
    return allQuestions.filter((question) =>
      assignedQuestionIds.includes(question.id)
    );
  };

  // Bulk operations with optimistic updates
  const bulkAssign = async () => {
    const unassignedIds = getUnassignedQuestions().map((q) => q.id);
    setLoading((prev) => ({ ...prev, assignments: true }));
    if (unassignedIds.length === 0) return;

    try {
      await api.post("/actions/assign-questions-to-quiz", {
        quizId: selectedQuiz.id,
        questionIds: unassignedIds,
      });

      fetchAssignedQuestions(selectedQuiz.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading((prev) => ({ ...prev, assignments: false }));
    }
  };

  const bulkUnassign = async () => {
    setLoading((prev) => ({ ...prev, assignments: true }));
    if (assignedQuestionIds.length === 0) return;

    try {
      await Promise.all(
        assignedQuestionIds.map((id) =>
          api.post(`/actions/unissign-question-from-quiz/${selectedQuiz.id}/${id}`)
        )
      );

      fetchAssignedQuestions(selectedQuiz.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading((prev) => ({ ...prev, assignments: false }));
    }
  };

  // Get unique languages for filter
  const getUniqueLanguages = () => {
    const languages = new Map();
    allQuestions.forEach((q) => {
      if (q.language && !languages.has(q.language.id)) {
        languages.set(q.language.id, q.language);
      }
    });
    return Array.from(languages.values());
  };

  const handleAffectation = async (userId, quizId) => {
    try {
      await api.post("/api/quiz-affectations", {
        userId,
        quizId
      });
      fetchData();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <AuthLayout>
      <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Attribution des questions
          </h1>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
            >
              {error}
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
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-lg font-medium text-gray-700">
                    Loading data...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quiz Selection */}
          <div className="mb-8">
            <label className="block text-gray-700 font-medium mb-2">
              Select Quiz:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quizzes.map((quiz) => (
                <motion.div
                  key={quiz.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQuizSelect(quiz)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedQuiz?.id === quiz.id
                      ? "bg-blue-100 border-2 border-blue-500"
                      : "bg-white hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <h3 className="font-semibold text-gray-800">{quiz.nom}</h3>
                  <p className="text-sm text-gray-600">{quiz.type}</p>
                </motion.div>
              ))}
            </div>
          </div>
          

          {selectedQuiz && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Assigning to:{" "}
                  <span className="text-blue-600">{selectedQuiz.nom}</span>
                </h2>
                <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedQuiz(null)}
                  className="px-4 py-2 rounded text-sm bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded text-sm flex items-center"
                >
                  Close
                </motion.button>
                
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={bulkAssign}
                    disabled={getUnassignedQuestions().length === 0}
                    className={`px-4 py-2 rounded text-sm flex items-center ${
                      getUnassignedQuestions().length === 0
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
                    disabled={assignedQuestionIds.length === 0}
                    className={`px-4 py-2 rounded text-sm flex items-center ${
                      assignedQuestionIds.length === 0
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
             
              {/* Filters for Unassigned Questions */}
              <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h3 className="font-medium text-gray-700 mb-3">
                  Filter Unassigned Questions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Languages
                    </label>
                    <Select
                      isMulti
                      options={getUniqueLanguages().map((lang) => ({
                        value: lang.id.toString(),
                        label: (
                          <div className="flex items-center">
                            {lang.icon && (
                              <img
                                src={lang.icon}
                                alt={lang.nom}
                                className="w-4 h-4 mr-2 rounded-full"
                                style={{ backgroundColor: lang.color }}
                              />
                            )}
                            {lang.nom}
                          </div>
                        ),
                        id: lang.id,
                        icon: lang.icon,
                        color: lang.color,
                      }))}
                      value={filters.languages
                        .map((langId) => {
                          const lang = getUniqueLanguages().find(
                            (l) => l.id.toString() === langId
                          );
                          return lang
                            ? {
                                value: lang.id.toString(),
                                label: (
                                  <div className="flex items-center">
                                    {lang.icon && (
                                      <img
                                        src={lang.icon}
                                        alt={lang.nom}
                                        className="w-4 h-4 mr-2 rounded-full"
                                        style={{ backgroundColor: lang.color }}
                                      />
                                    )}
                                    {lang.nom}
                                  </div>
                                ),
                              }
                            : null;
                        })
                        .filter(Boolean)}
                      onChange={(selectedOptions) => {
                        setFilters((prev) => ({
                          ...prev,
                          languages: selectedOptions.map(
                            (option) => option.value
                          ),
                        }));
                      }}
                      className="basic-multi-select"
                      classNamePrefix="select"
                      placeholder="Select languages..."
                      closeMenuOnSelect={false}
                      isClearable={true}
                      components={{
                        Option: ({ innerProps, label, data, isSelected }) => (
                          <div
                            {...innerProps}
                            className={`flex items-center px-3 py-2 hover:bg-blue-50 cursor-pointer ${
                              isSelected ? "bg-blue-100" : ""
                            }`}
                          >
                            {data.icon && (
                              <img
                                src={data.icon}
                                alt=""
                                className="w-4 h-4 mr-2 rounded-full"
                                style={{ backgroundColor: data.color }}
                              />
                            )}
                            {data.label.props.children[1]}
                          </div>
                        ),
                        MultiValueLabel: ({ data }) => (
                          <div className="flex items-center">
                            {data.icon && (
                              <img
                                src={data.icon}
                                alt=""
                                className="w-3 h-3 mr-1 rounded-full"
                                style={{ backgroundColor: data.color }}
                              />
                            )}
                            {data.label.props.children[1]}
                          </div>
                        ),
                      }}
                      styles={{
                        control: (base) => ({
                          ...base,
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.375rem",
                          padding: "0.125rem",
                          minHeight: "38px",
                          boxShadow: "none",
                          "&:hover": {
                            borderColor: "#3b82f6",
                          },
                          "&:focus-within": {
                            borderColor: "#3b82f6",
                            boxShadow: "0 0 0 1px rgba(59, 130, 246, 0.2)",
                          },
                        }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: "#EFF6FF",
                          borderRadius: "9999px",
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: "#1E40AF",
                          padding: "0 0.5rem",
                          fontSize: "0.75rem",
                        }),
                        multiValueRemove: (base) => ({
                          ...base,
                          color: "#1E40AF",
                          ":hover": {
                            backgroundColor: "#DBEAFE",
                            color: "#1E3A8A",
                          },
                        }),
                        option: (base) => ({
                          ...base,
                          fontSize: "0.875rem",
                          padding: "0.5rem 0.75rem",
                        }),
                      }}
                    />
                  </div>

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
                      <option value="facile">Facile</option>
                      <option value="moyen">Moyen</option>
                      <option value="difficile">Difficile</option>
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
                      placeholder="Search questions..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {loading.assignments ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Unassigned Questions (Left Table) */}
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h3 className="font-semibold text-gray-800">
                        Unassigned Questions ({getUnassignedQuestions().length})
                      </h3>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                      {getUnassignedQuestions().length > 0 ? (
                        <AnimatePresence>
                          {getUnassignedQuestions().map((question) => (
                            <motion.div
                              key={question.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.2 }}
                              onClick={() => assignQuestion(question.id)}
                              className="p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors group"
                            >
                              <div className="flex justify-between items-start">
                                <p className="font-medium text-gray-800 group-hover:text-blue-600">
                                  {question.question}
                                </p>
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  {question.points} pts
                                </span>
                              </div>
                              <div className="flex items-center mt-2">
                                {question.language?.icon && (
                                  <img
                                    src={question.language.icon}
                                    alt=""
                                    className="w-4 h-4 mr-1"
                                    style={{
                                      backgroundColor: question.language.color,
                                    }}
                                  />
                                )}
                                <span className="text-xs text-gray-500 mr-2">
                                  {question.language?.nom || "No language"}
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    question.difficulty === "facile"
                                      ? "bg-green-100 text-green-800"
                                      : question.difficulty === "moyen"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {question.difficulty}
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
                          {allQuestions.length === 0
                            ? "No questions available"
                            : "All questions are assigned or filtered out"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assigned Questions (Right Table) */}
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h3 className="font-semibold text-gray-800">
                        Assigned Questions ({assignedQuestionIds.length})
                      </h3>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                      {getAssignedQuestions().length > 0 ? (
                        <AnimatePresence>
                          {getAssignedQuestions().map((question) => (
                            <motion.div
                              key={question.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.2 }}
                              onClick={() => unassignQuestion(question.id)}
                              className="p-4 border-b border-gray-100 hover:bg-red-50 cursor-pointer transition-colors group"
                            >
                              <div className="flex justify-between items-start">
                                <p className="font-medium text-gray-800 group-hover:text-red-600">
                                  {question.question}
                                </p>
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  {question.points} pts
                                </span>
                              </div>
                              <div className="flex items-center mt-2">
                                {question.language?.icon && (
                                  <img
                                    src={question.language.icon}
                                    alt=""
                                    className="w-4 h-4 mr-1"
                                    style={{
                                      backgroundColor: question.language.color,
                                    }}
                                  />
                                )}
                                <span className="text-xs text-gray-500 mr-2">
                                  {question.language?.nom || "No language"}
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    question.difficulty === "facile"
                                      ? "bg-green-100 text-green-800"
                                      : question.difficulty === "moyen"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {question.difficulty}
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
                          No questions assigned yet
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
