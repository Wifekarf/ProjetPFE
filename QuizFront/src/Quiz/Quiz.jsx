// src/pages/Quiz.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api.js";
import AuthLayout from "../Layout/AuthLayout";
import { useNavigate } from "react-router-dom";

export default function Quiz() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    type: "technique",
    date_debut: "",
    date_fin: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [codeModal, setCodeModal] = useState({
    visible: false,
    code: "",
    expiry: "",
  });
  const [countdown, setCountdown] = useState("");
  const navigate = useNavigate();
  const [selectedQuizForUsers, setSelectedQuizForUsers] = useState(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [assignedUsersList, setAssignedUsersList] = useState([]);
  const [shareModal, setShareModal] = useState({
    visible: false,
    email: "",
    code: "",
    quizName: "",
  });

  const [quizImage, setQuizImage] = useState(null);

  // Fetch just the assigned users for a quiz
  const fetchAssignedUsers = async (quizId) => {
    try {
      const {
        data: { affectations },
      } = await api.get("/actions/get-all-affected-users");
      const users = affectations
        .filter((a) => a.quiz.id === quizId)
        .map((a) => a.user);
      setAssignedUsersList(users);
    } catch (e) {
      console.error("Error fetching assigned users:", e);
    }
  };

  // Fetch all quizzes
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/quizzes");
      setQuizzes(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (!codeModal.visible) return;
    const expiryTs = new Date(codeModal.expiry).getTime();
    const interval = setInterval(() => {
      const diff = expiryTs - Date.now();
      if (diff <= 0) {
        clearInterval(interval);
        setCountdown("Expiré");
      } else {
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setCountdown(`${d}j ${h}h ${m}m ${s}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [codeModal]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Format date for datetime-local input
  const formatDateForInput = (dateString) =>
    dateString ? new Date(dateString).toISOString().slice(0, 16) : "";

  // Create or Update quiz
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let quizId;
      if (editingId) {
        await api.put(`/api/quizzes/${editingId}`, formData);
        quizId = editingId;
      } else {
        const response = await api.post("/api/quizzes", formData);
        quizId = response.data.id;
      }

      // If there's an image and we have a quiz ID, upload it
      if (quizImage && quizId) {
        const imageData = new FormData();
        imageData.append("image", quizImage, quizImage.name);

        try {
          const uploadResponse = await api.post(
            `/api/quizzes/${quizId}/upload`,
            imageData
          );
          console.log("Upload response:", uploadResponse.data);
        } catch (uploadError) {
          console.error(
            "Upload error:",
            uploadError.response?.data || uploadError
          );
          setError(
            uploadError.response?.data?.message || "Failed to upload image"
          );
          return;
        }
      }

      fetchQuizzes();
      resetForm();
      setIsModalOpen(false);
    } catch (err) {
      console.error(
        "Quiz creation/update error:",
        err.response?.data || err
      );
      setError(err.response?.data?.message || err.message);
    }
  };

  // Test upload separately
  const testUpload = async (quizId) => {
    if (!quizImage) return;
    const imageFormData = new FormData();
    imageFormData.append("image", quizImage, quizImage.name);
    try {
      const response = await api.post(
        `/api/quizzes/${quizId}/upload`,
        imageFormData
      );
      console.log("Direct upload test response:", response.data);
    } catch (error) {
      console.error("Direct upload test error:", error);
    }
  };

  // Handle file selection
  const handleQuizImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Selected file:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });
      setQuizImage(file);
    }
  };

  // Edit quiz
  const handleEdit = (quiz) => {
    setFormData({
      nom: quiz.nom,
      type: quiz.type,
      date_debut: formatDateForInput(quiz.date_debut),
      date_fin: formatDateForInput(quiz.date_fin),
    });
    setEditingId(quiz.id);
    setIsModalOpen(true);
  };

  // Delete quiz
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/quizzes/${id}`);
      fetchQuizzes();
    } catch {
      setError(
        `Le quiz ${id} ne peut pas être supprimé car il a déjà des questions, affectations ou résultats.`
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Generate an 8-char uppercase alphanumeric code
  const generateRandomCode = () =>
    Math.random().toString(36).substr(2, 8).toUpperCase();

  // Assign a generated code to a quiz
  const handleGenerateCode = async (quizId) => {
    const quiz = quizzes.find((q) => q.id === quizId);
    const now = Date.now();
    if (quiz.code && now < new Date(quiz.date_fin).getTime()) {
      setCodeModal({
        visible: true,
        code: quiz.code,
        expiry: quiz.date_fin,
      });
      return;
    }
    const code = generateRandomCode();
    try {
      await api.put(`/api/quizzes/${quizId}`, { ...quiz, code });
      setQuizzes((qs) =>
        qs.map((q) => (q.id === quizId ? { ...q, code } : q))
      );
      setCodeModal({ visible: true, code, expiry: quiz.date_fin });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Impossible de générer un code pour le quiz ${quizId}`
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({ nom: "", type: "technique", date_debut: "", date_fin: "" });
    setEditingId(null);
    setQuizImage(null);
  };

  // Open modal for creating new quiz
  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Format date for display
  const formatDisplayDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  // Separate upload function if needed
  const handleQuizImageUpload = async (quizId) => {
    if (!quizImage) return;
    const formData = new FormData();
    formData.append("image", quizImage, quizImage.name);
    try {
      await api.post(`/api/quizzes/${quizId}/upload`, formData);
      fetchQuizzes();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    }
  };
  return (
    <AuthLayout>
      <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Gestion des quiz
            </h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors"
            >
              Add Quiz
            </motion.button>
          </div>
      
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
      
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
              <AnimatePresence>
                {quizzes.map((quiz) => (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => {
                      fetchAssignedUsers(quiz.id);
                      setSelectedQuizForUsers(quiz.id);
                      setShowUsersModal(true);
                    }}
                    style={{ cursor: "pointer" }}
                    className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 hover:shadow-xl transition-all w-full"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-4">
                          {quiz.image ? (
                            <img
                              src={`http://localhost:8000${quiz.image}`}
                              alt={quiz.nom}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                              {quiz.nom}
                            </h2>
                            {quiz.code && (
                              <p className="text-sm text-gray-600 mb-2">
                                Code: <span className="font-mono">{quiz.code}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            quiz.type === "technique"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {quiz.type}
                        </span>
                      </div>
            
                      <div className="space-y-2 mb-4">
                        <div>
                          <span className="text-gray-500 text-sm">Start:</span>
                          <p className="text-gray-700">
                            {formatDisplayDate(quiz.date_debut)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-sm">End:</span>
                          <p className="text-gray-700">
                            {formatDisplayDate(quiz.date_fin)}
                          </p>
                        </div>
                      </div>
            
                      <div className="flex flex-wrap gap-2 mt-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(quiz);
                          }}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-sm transition tracking-wide font-medium text-sm"
                        >
                          Edit
                        </motion.button>
            
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(quiz.id);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-sm transition tracking-wide font-medium text-sm"
                        >
                          Delete
                        </motion.button>
            
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/quizzes/${quiz.id}/questions`);
                          }}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg shadow-sm transition tracking-wide font-medium text-sm"
                        >
                          View Questions
                        </motion.button>
            
                        <motion.button
                          disabled={
                            quiz.code &&
                            Date.now() < new Date(quiz.date_fin).getTime()
                          }
                          whileHover={
                            !(
                              quiz.code &&
                              Date.now() < new Date(quiz.date_fin).getTime()
                            )
                              ? { scale: 1.05 }
                              : {}
                          }
                          whileTap={
                            !(
                              quiz.code &&
                              Date.now() < new Date(quiz.date_fin).getTime()
                            )
                              ? { scale: 0.95 }
                              : {}
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateCode(quiz.id);
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium tracking-wide shadow-sm transition text-white ${
                            quiz.code && Date.now() < new Date(quiz.date_fin).getTime()
                              ? "bg-purple-300 cursor-not-allowed"
                              : "bg-purple-500 hover:bg-purple-600"
                          }`}
                        >
                          Generate Code
                        </motion.button>
            
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShareModal({
                              visible: true,
                              email: "",
                              code: quiz.code || "",
                              quizName: quiz.nom,
                            });
                          }}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-sm transition tracking-wide font-medium text-sm"
                        >
                          Share
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Quiz Form Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#14111196] flex items-center justify-center p-4 z-50"
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {editingId ? "Edit Quiz" : "Add New Quiz"}
                  </h2>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label
                        htmlFor="nom"
                        className="block text-gray-700 font-medium mb-2"
                      >
                        Quiz Name
                      </label>
                      <input
                        type="text"
                        id="nom"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Quiz Image Upload */}
                    <div className="mb-4">
                      <label className="block text-gray-700 font-medium mb-2">
                        Quiz Image
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                          {quizImage ? (
                            <img
                              src={URL.createObjectURL(quizImage)}
                              alt="Quiz preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleQuizImageChange}
                            className="hidden"
                            id="quiz-image"
                          />
                          <label
                            htmlFor="quiz-image"
                            className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Choose Image
                          </label>
                          {quizImage && (
                            <p className="mt-2 text-sm text-gray-500">
                              {quizImage.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor="type"
                        className="block text-gray-700 font-medium mb-2"
                      >
                        Type
                      </label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="technique">Technique</option>
                        <option value="general">General</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label
                        htmlFor="date_debut"
                        className="block text-gray-700 font-medium mb-2"
                      >
                        Start Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        id="date_debut"
                        name="date_debut"
                        value={formData.date_debut}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="mb-6">
                      <label
                        htmlFor="date_fin"
                        className="block text-gray-700 font-medium mb-2"
                      >
                        End Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        id="date_fin"
                        name="date_fin"
                        value={formData.date_fin}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        {editingId ? "Update" : "Create"}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Code Popup Modal */}
        <AnimatePresence>
          {codeModal.visible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#14111196] flex items-center justify-center p-4 z-50"
              onClick={() =>
                setCodeModal({ visible: false, code: "", expiry: "" })
              }
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 text-center">
                  <h2 className="text-2xl font-semibold mb-4">Quiz Code</h2>
                  <p className="text-4xl font-mono mb-2">{codeModal.code}</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Valide pour : {countdown}
                  </p>
                  <div className="flex justify-center space-x-4">
                    {/* <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md"
                    >
                      Share
                    </motion.button> */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setCodeModal({ visible: false, code: "", expiry: "" })
                      }
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md"
                    >
                      Close
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {showUsersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowUsersModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowUsersModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>
              {/* Show only the assigned‐users list */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {assignedUsersList.length > 0 ? (
                  assignedUsersList.map((u) => (
                    <div
                      key={u.id}
                      className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <h3 className="font-medium text-gray-800">
                        {u.username}
                      </h3>
                      <p className="text-sm text-gray-600">{u.email}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">
                    No users have attempted this quiz yet.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Share Modal */}
      <AnimatePresence>
        {shareModal.visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() =>
              setShareModal((prev) => ({ ...prev, visible: false }))
            }
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4">Share Quiz</h2>
              <p className="mb-2">
                Quiz: <strong>{shareModal.quizName}</strong>
              </p>
              <p className="mb-4">
                Code: <code>{shareModal.code}</code>
              </p>
              <label className="block mb-2 text-gray-700">
                Recipient Email
              </label>
              <input
                type="email"
                value={shareModal.email}
                onChange={(e) =>
                  setShareModal((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full mb-4 p-2 border rounded focus:ring-2 focus:ring-indigo-400"
                placeholder="email@example.com"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() =>
                    setShareModal((prev) => ({ ...prev, visible: false }))
                  }
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await api.post("/api/quizzes/share-quiz", {
                        email: shareModal.email,
                        code: shareModal.code,
                        quizName: shareModal.quizName,
                        link: "http://localhost:5173/join?code=${shareModal.code}",
                      });
                      setShareModal((prev) => ({ ...prev, visible: false }));
                    } catch (err) {
                      setError(err.response?.data?.message || err.message);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
