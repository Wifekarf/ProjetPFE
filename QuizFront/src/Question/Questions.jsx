import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import AuthLayout from "../Layout/AuthLayout";
import "./Ques.css";
import Select from 'react-select';
//import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";

export default function Questions() {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [filters, setFilters] = useState({
    languages: [],
    difficulty: "all",
    search: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    difficulty: "facile",
    language_id: "",
    points: 5,
    time: 30,
    imageFile: null     // ← new
  });

     async function fetchQuestions() {
    setLoading(true);
     try {
       const { data } = await api.get("/api/questions");
       setQuestions(data);
     } catch (e) {
       setError("Failed to load questions");
     } finally {
       setLoading(false);
     }
   }
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generationData, setGenerationData] = useState({
    language_id: "",
    difficulty: "facile",
    count: 5
  });
  const [generating, setGenerating] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [saving, setSaving] = useState(false);

  const { id: quizIdFromURL } = useParams();


  console.log("quizIdFromURL:", quizIdFromURL);

  // const fetchQuestions = async () => {
  //   try {
  //     const response = await api.get("/api/questions");
  //     setQuestions(response.data);
  //   } catch (error) {
  //     console.error("Error fetching questions:", error);
  //   }
  // };

  // useEffect(() => {
  //   fetchQuestions();
  // }, []);
  useEffect(() => {
      setLoading(true);

  Promise.all([
    api.get("/api/questions"),
    api.get("/api/langages")
  ])
    .then(([qRes, langRes]) => {
      setQuestions(qRes.data);
      setLanguages(langRes.data);
    })
    .catch(err => {
      console.error("Error loading data:", err);
      setError("Failed to load questions or languages.");
    })
    .finally(() => {
      setLoading(false);
    });
  }, []);


  useEffect(() => {
    let result = [...questions];

    if (filters.languages.length > 0) {
      result = result.filter(q =>
        q.language && filters.languages.includes(q.language.id.toString())
      );
    }

    if (filters.difficulty !== "all") {
      result = result.filter(q => q.difficulty === filters.difficulty);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(q =>
        q.question.toLowerCase().includes(searchTerm) ||
        q.options.some(opt => opt.toLowerCase().includes(searchTerm))
      );
    }

    console.log("Filtered Questions:", result);
    setFilteredQuestions(result);
  }, [questions, filters]);


  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle option changes
  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData((prev) => ({
      ...prev,
      options: newOptions,
    }));
  };

    const handleSubmit = async e => {
    e.preventDefault();
    try {
      let questionId;

      if (editingId) {
        // update existing
        await api.put(`/api/questions/${editingId}`, {
          question:      formData.question,
          options:       formData.options,
          correctAnswer: formData.correctAnswer,
          difficulty:    formData.difficulty,
          language_id:   formData.language_id,
          points:        formData.points,
          time:          formData.time
        });
        questionId = editingId;
      } else {
        // create new
        const { data } = await api.post("/api/questions/create", {
          question:      formData.question,
          options:       formData.options,
          correctAnswer: formData.correctAnswer,
          difficulty:    formData.difficulty,
          language_id:   formData.language_id,
          points:        formData.points,
          time:          formData.time
        });
        questionId = data.id;
      }

      // if user picked a file, upload it
      if (formData.imageFile) {
        const fd = new FormData();
        fd.append("image", formData.imageFile);
        await api.post(
          `/api/questions/${questionId}/upload-image`,
          fd,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      // refresh & close
      await fetchQuestions();
      resetForm();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      setError("Failed to save question");
    }
  };


  // Edit question
  const handleEdit = (question) => {
    setFormData({
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      difficulty: question.difficulty,
      language_id: question.language.id,
      points: question.points,
      time: question.time // ⏱️ Ajout du temps

    });
    setEditingId(question.id);
    setIsModalOpen(true);
  };

  // Delete question
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/questions/${id}`);
      fetchQuestions();
    } catch (err) {
      setError(err.message);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      difficulty: "facile",
      language_id: "",
      points: 5,
      time: 30, // Valeur par défaut
      imageFile:     null

    });
    setEditingId(null);
  };

  // Open modal for creating new question
  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Handle generation form input changes
  const handleGenerationChange = (e) => {
    const { name, value } = e.target;
    setGenerationData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open generation modal
  const openGenerateModal = () => {
    setIsGenerateModalOpen(true);
  };

  // Generate questions using AI
  const handleGenerateQuestions = async () => {
    if (!generationData.language_id) {
      setError("Please select a language");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await api.post("/api/questions/generate", {
        language_id: parseInt(generationData.language_id),
        difficulty: generationData.difficulty,
        count: parseInt(generationData.count)
      });

      if (response.data.questions) {
        // Show confirmation modal with generated questions
        setGeneratedQuestions(response.data.questions);
        setSelectedQuestions(response.data.questions.map((_, index) => index)); // Select all by default
        setIsGenerateModalOpen(false);
        setIsConfirmModalOpen(true);
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(err.response?.data?.error || "Failed to generate questions");
    } finally {
      setGenerating(false);
    }
  };

  // Handle question selection for confirmation
  const handleQuestionSelection = (index) => {
    setSelectedQuestions(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  // Select/deselect all questions
  const handleSelectAll = () => {
    if (selectedQuestions.length === generatedQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(generatedQuestions.map((_, index) => index));
    }
  };

  // Save confirmed questions
  const handleSaveConfirmedQuestions = async () => {
    if (selectedQuestions.length === 0) {
      setError("Please select at least one question to save");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const questionsToSave = selectedQuestions.map(index => generatedQuestions[index]);
      
      const response = await api.post("/api/questions/save-generated", {
        questions: questionsToSave
      });

      if (response.data.questions) {
        // Refresh questions list
        await fetchQuestions();
        setIsConfirmModalOpen(false);
        setGeneratedQuestions([]);
        setSelectedQuestions([]);
        setGenerationData({
          language_id: "",
          difficulty: "facile",
          count: 5
        });
        alert(`Successfully saved ${response.data.count} questions!`);
      }
    } catch (err) {
      console.error("Save error:", err);
      setError(err.response?.data?.error || "Failed to save questions");
    } finally {
      setSaving(false);
    }
  };

  // Cancel confirmation
  const handleCancelConfirmation = () => {
    setIsConfirmModalOpen(false);
    setGeneratedQuestions([]);
    setSelectedQuestions([]);
  };

  // Fonction pour convertir les secondes en format minutes:secondes
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  return (
    <AuthLayout>
      <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Questions</h1>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openGenerateModal}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors flex items-center gap-2"
              >
                <span>🤖</span>
                Generate Questions
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openCreateModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors"
              >
                Add Question
              </motion.button>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Language Filter */}
              {/* Language Filter - Version avec react-select */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Filter by Languages
                </label>
                <Select
                  isMulti
                  options={languages.map(lang => ({
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
                    color: lang.color
                  }))}
                  value={filters.languages.map(langId => {
                    const lang = languages.find(l => l.id.toString() === langId);
                    return lang ? {
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
                      )
                    } : null;
                  }).filter(Boolean)}
                  onChange={(selectedOptions) => {
                    setFilters(prev => ({
                      ...prev,
                      languages: selectedOptions.map(option => option.value)
                    }));
                  }}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  placeholder="Select languages..."
                  closeMenuOnSelect={false}
                  components={{
                    Option: ({ innerProps, label, data, isSelected }) => (
                      <div
                        {...innerProps}
                        className={`flex items-center px-3 py-2 hover:bg-blue-50 cursor-pointer ${isSelected ? 'bg-blue-100' : ''}`}
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
                    MultiValueLabel: (base) => ({
                      ...base,
                      color: '#1E40AF',
                      padding: '0 0.5rem'
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: '#1E40AF',
                      ':hover': {
                        backgroundColor: '#DBEAFE',
                        color: '#1E3A8A'
                      }
                    })
                  }}
                  styles={{
                    control: (base) => ({
                      ...base,
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '0.25rem',
                      minHeight: '46px',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: '#3b82f6'
                      },
                      '&:focus-within': {
                        borderColor: '#3b82f6',
                        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)'
                      }
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: '#EFF6FF',
                      borderRadius: '9999px'
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: '#1E40AF',
                      padding: '0 0.5rem'
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: '#1E40AF',
                      ':hover': {
                        backgroundColor: '#DBEAFE',
                        color: '#1E3A8A'
                      }
                    })
                  }}
                />
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Filter by Difficulty
                </label>
                <select
                  name="difficulty"
                  value={filters.difficulty}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Difficulties</option>
                  <option value="facile">Facile</option>
                  <option value="moyen">Moyen</option>
                  <option value="difficile">Difficile</option>
                </select>
              </div>

              {/* Search Filter */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Search Questions
                </label>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search questions or options..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
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
            <div className="space-y-6">
              <AnimatePresence>
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No questions found matching your filters
                  </div>
                ) : (
                  filteredQuestions.map((question) => (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >

                      {question.image && (
  <div className="mb-4">
    <img
      src={question.image}
      alt="Question illustration"
      className="w-full max-h-40 object-contain rounded"
    />
  </div>
)}
   
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <h2 className="text-xl font-semibold text-gray-800">
                            {question.question}
                          </h2>
                          <div className="flex space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${question.difficulty === 'facile'
                              ? 'bg-green-100 text-green-800'
                              : question.difficulty === 'moyen'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                              {question.difficulty}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {question.points} pts
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              {formatTime(question.time)}
                            </span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-gray-500 text-sm mb-1">Options:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {question.options.map((option, index) => (
                              <li
                                key={index}
                                className={`${option === question.correctAnswer ? 'font-bold text-green-600' : 'text-gray-700'}`}
                              >
                                {option}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            {question.language?.icon && (
                              <img
                                src={question.language.icon}
                                alt={`${question.language.nom} icon`}
                                className="w-6 h-6 mr-2"
                                style={{ backgroundColor: question.language.color }}
                              />
                            )}
                            <span className="text-gray-600">
                              {question.language?.nom || 'No language'}
                            </span>
                          </div>

                       <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEdit(question)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Edit
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDelete(question.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Delete
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#14111196] bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {editingId ? "Edit Question" : "Add New Question"}
                  </h2>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label
                        htmlFor="question"
                        className="block text-gray-700 font-medium mb-2"
                      >
                        Question
                      </label>
                      <input
                        type="text"
                        id="question"
                        name="question"
                        value={formData.question}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 font-medium mb-2">
                        Options (at least 2 required)
                      </label>
                      {formData.options.map((option, index) => (
                        <div key={index} className="mb-2">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="correctOption"
                              checked={option === formData.correctAnswer}
                              onChange={() => setFormData(prev => ({
                                ...prev,
                                correctAnswer: option
                              }))}
                              className="mr-2"
                              disabled={option.trim() === ""}
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`Option ${index + 1}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label
                          htmlFor="difficulty"
                          className="block text-gray-700 font-medium mb-2"
                        >
                          Difficulty
                        </label>
                        <select
                          id="difficulty"
                          name="difficulty"
                          value={formData.difficulty}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="facile">Facile</option>
                          <option value="moyen">Moyen</option>
                          <option value="difficile">Difficile</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="language_id"
                          className="block text-gray-700 font-medium mb-2"
                        >
                          Language
                        </label>
                        <select
                          id="language_id"
                          name="language_id"
                          value={formData.language_id}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select Language</option>
                          {languages.map((language) => (
                            <option key={language.id} value={language.id}>
                              {language.nom}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="points"
                          className="block text-gray-700 font-medium mb-2"
                        >
                          Points
                        </label>
                        <input
                          type="number"
                          id="points"
                          name="points"
                          min="1"
                          value={formData.points}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>


                      <div>
                        <label
                          htmlFor="time"
                          className="block text-gray-700 font-medium mb-2"
                        >
                          Time (seconds)
                        </label>
                        <input
                          type="number"
                          id="time"
                          name="time"
                          min="1"
                          value={formData.time}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>



                    </div>
                      <div className="mb-4">
    <label className="block text-gray-700 font-medium mb-2">
      Upload Image (optional)
    </label>
    <input
      type="file"
      accept="image/*"
      onChange={e =>
        setFormData(prev => ({
          ...prev,
          imageFile: e.target.files?.[0] || null
        }))
      }
      className="w-full"
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

        {/* Generation Modal */}
        <AnimatePresence>
          {isGenerateModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#14111196] bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setIsGenerateModalOpen(false)}
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
                    🤖 Generate Questions with AI
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Language
                      </label>
                      <select
                        name="language_id"
                        value={generationData.language_id}
                        onChange={handleGenerationChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Language</option>
                        {languages.map((language) => (
                          <option key={language.id} value={language.id}>
                            {language.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Difficulty
                      </label>
                      <select
                        name="difficulty"
                        value={generationData.difficulty}
                        onChange={handleGenerationChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="facile">Facile</option>
                        <option value="moyen">Moyen</option>
                        <option value="difficile">Difficile</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Number of Questions
                      </label>
                      <input
                        type="number"
                        name="count"
                        min="1"
                        max="10"
                        value={generationData.count}
                        onChange={handleGenerationChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Generate 1-10 questions at once
                      </p>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsGenerateModalOpen(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        disabled={generating}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleGenerateQuestions}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={generating}
                      >
                        {generating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <span>🚀</span>
                            Generate
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {isConfirmModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#14111196] bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={handleCancelConfirmation}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                      🔍 Review Generated Questions
                    </h2>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        {selectedQuestions.length} of {generatedQuestions.length} selected
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSelectAll}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        {selectedQuestions.length === generatedQuestions.length ? 'Deselect All' : 'Select All'}
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    {generatedQuestions.map((question, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 transition-all ${
                          selectedQuestions.includes(index)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedQuestions.includes(index)}
                            onChange={() => handleQuestionSelection(index)}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-2">
                              {question.question}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                              {question.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className={`p-2 rounded text-sm ${
                                    option === question.correctAnswer
                                      ? 'bg-green-100 text-green-800 font-medium'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                  {option === question.correctAnswer && (
                                    <span className="ml-2">✅</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                {question.language.nom}
                              </span>
                              <span>Difficulty: {question.difficulty}</span>
                              <span>Points: {question.points}</span>
                              <span>Time: {formatTime(question.time)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCancelConfirmation}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      disabled={saving}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSaveConfirmedQuestions}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      disabled={saving || selectedQuestions.length === 0}
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <span>💾</span>
                          Save {selectedQuestions.length} Question{selectedQuestions.length !== 1 ? 's' : ''}
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}