import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from "../Layout/AuthLayout";
import { getProgProblem, getProgProblemTasks, createTask, updateTask, deleteTask } from '../services/progProblemApi';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa';

export default function TaskAssignment() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 10,
    language: {
      name: 'JavaScript',
      id: 'javascript'
    },
    time: 15,
    sampleTestCases: [{ input: '', output: '' }],
    evaluationCriteria: [
      { name: 'Correctness', weight: 60 },
      { name: 'Efficiency', weight: 20 },
      { name: 'Code Quality', weight: 20 }
    ]
  });

  // Available programming languages
  const availableLanguages = [
    { name: 'JavaScript', id: 'javascript' },
    { name: 'Python', id: 'python' },
    { name: 'Java', id: 'java' },
    { name: 'C++', id: 'cpp' },
    { name: 'C#', id: 'csharp' }
  ];

  useEffect(() => {
    if (problemId) {
      fetchData();
    }
  }, [problemId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [problemResponse, tasksResponse] = await Promise.all([
        getProgProblem(problemId),
        getProgProblemTasks(problemId)
      ]);
      
      setProblem(problemResponse.data);
      setTasks(tasksResponse.data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('An error occurred while loading the problem and tasks.');
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value
    }));
  };

  const handleLanguageChange = (e) => {
    const languageId = e.target.value;
    const selectedLanguage = availableLanguages.find(lang => lang.id === languageId);
    
    setFormData(prev => ({
      ...prev,
      language: selectedLanguage
    }));
  };

  const handleTestCaseChange = (index, field, value) => {
    const updatedTestCases = [...formData.sampleTestCases];
    updatedTestCases[index] = {
      ...updatedTestCases[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      sampleTestCases: updatedTestCases
    }));
  };

  const addTestCase = () => {
    setFormData(prev => ({
      ...prev,
      sampleTestCases: [...prev.sampleTestCases, { input: '', output: '' }]
    }));
  };

  const removeTestCase = (index) => {
    if (formData.sampleTestCases.length <= 1) return;
    
    const updatedTestCases = formData.sampleTestCases.filter((_, i) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      sampleTestCases: updatedTestCases
    }));
  };

  const handleCriteriaChange = (index, field, value) => {
    const updatedCriteria = [...formData.evaluationCriteria];
    updatedCriteria[index] = {
      ...updatedCriteria[index],
      [field]: field === 'weight' ? parseInt(value, 10) : value
    };
    
    setFormData(prev => ({
      ...prev,
      evaluationCriteria: updatedCriteria
    }));
  };

  const addCriteria = () => {
    setFormData(prev => ({
      ...prev,
      evaluationCriteria: [...prev.evaluationCriteria, { name: '', weight: 0 }]
    }));
  };

  const removeCriteria = (index) => {
    if (formData.evaluationCriteria.length <= 1) return;
    
    const updatedCriteria = formData.evaluationCriteria.filter((_, i) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      evaluationCriteria: updatedCriteria
    }));
  };

  const openModal = (task = null) => {
    if (task) {
      // Edit existing task
      setCurrentTask(task);
      setFormData({
        title: task.title || '',
        description: task.description || '',
        points: task.points || 10,
        language: task.language || availableLanguages[0],
        time: task.time || 15,
        sampleTestCases: task.sampleTestCases?.length > 0 
          ? task.sampleTestCases 
          : [{ input: '', output: '' }],
        evaluationCriteria: task.evaluationCriteria?.length > 0 
          ? task.evaluationCriteria 
          : [{ name: 'Correctness', weight: 60 }]
      });
    } else {
      // Create new task
      setCurrentTask(null);
      setFormData({
        title: '',
        description: '',
        points: 10,
        language: availableLanguages[0],
        time: 15,
        sampleTestCases: [{ input: '', output: '' }],
        evaluationCriteria: [
          { name: 'Correctness', weight: 60 },
          { name: 'Efficiency', weight: 20 },
          { name: 'Code Quality', weight: 20 }
        ]
      });
    }
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentTask(null);
  };

  const validateForm = () => {
    // Check that criteria weights sum to 100
    const totalWeight = formData.evaluationCriteria.reduce((sum, criteria) => sum + criteria.weight, 0);
    return totalWeight === 100;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Evaluation criteria weights must sum to 100.');
      return;
    }
    
    try {
      if (currentTask) {
        // Update existing task
        await updateTask(problemId, currentTask.id, formData);
      } else {
        // Create new task
        await createTask(problemId, formData);
      }
      
      fetchData();
      closeModal();
    } catch (err) {
      console.error('Error saving task:', err);
      setError('An error occurred while saving the task.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      await deleteTask(problemId, taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('An error occurred while deleting the task.');
    }
  };

  const goBack = () => {
    navigate('/admin/progproblems');
  };

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex justify-center items-center h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-[#006674] border-t-transparent rounded-full"
          ></motion.div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center">
            <button 
              onClick={goBack}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Task Management</h1>
              {problem && (
                <p className="text-gray-600">
                  Problem: <span className="font-medium">{problem.title}</span>
                </p>
              )}
            </div>
          </div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 bg-red-100 border-l-4 border-red-500 text-red-700"
            >
              {error}
              <button 
                onClick={() => setError(null)} 
                className="ml-2 text-red-700 hover:text-red-900"
              >
                <FaTimes />
              </button>
            </motion.div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div className="text-gray-700">
              Total Tasks: <span className="font-semibold">{tasks.length}</span>
              {tasks.length > 0 && (
                <span className="ml-4">
                  Total Points: <span className="font-semibold">
                    {tasks.reduce((sum, task) => sum + (task.points || 0), 0)}
                  </span>
                </span>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openModal()}
              className="bg-[#006674] hover:bg-[#00525d] text-white py-2 px-4 rounded-lg flex items-center gap-2 shadow-md"
            >
              <FaPlus className="text-sm" /> Add Task
            </motion.button>
          </div>

          {tasks.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">No Tasks Added Yet</h3>
              <p className="text-gray-600 mb-4">
                Create programming tasks for students to solve. Each task should include clear instructions and evaluation criteria.
              </p>
              <button
                onClick={() => openModal()}
                className="px-4 py-2 bg-[#006674] text-white rounded-lg hover:bg-[#00525d] inline-flex items-center"
              >
                <FaPlus className="mr-2" /> Create First Task
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-[#006674] text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">
                        {index + 1}
                      </div>
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm">
                        {task.points} points
                      </span>
                      <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {task.time} min
                      </span>
                      <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm">
                        {task.language?.name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="prose max-w-none mb-4">
                      <p className="text-gray-700">{task.description}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                      <div className="flex-1 min-w-[300px]">
                        <h4 className="font-medium text-gray-700 mb-2">Sample Test Cases</h4>
                        {task.sampleTestCases && task.sampleTestCases.length > 0 ? (
                          <div className="space-y-2 bg-gray-50 p-3 rounded-lg text-sm">
                            {task.sampleTestCases.map((testCase, idx) => (
                              <div key={idx} className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-xs font-medium text-gray-600">Input:</span>
                                  <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-x-auto">{testCase.input}</pre>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-gray-600">Output:</span>
                                  <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-x-auto">{testCase.output}</pre>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No sample test cases</p>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-[300px]">
                        <h4 className="font-medium text-gray-700 mb-2">Evaluation Criteria</h4>
                        {task.evaluationCriteria && task.evaluationCriteria.length > 0 ? (
                          <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                            {task.evaluationCriteria.map((criteria, idx) => (
                              <div key={idx} className="flex justify-between items-center">
                                <span className="text-gray-700">{criteria.name}</span>
                                <div className="flex items-center">
                                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                    <div
                                      className="bg-[#006674] h-2 rounded-full"
                                      style={{ width: `${criteria.weight}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-gray-600 text-sm">{criteria.weight}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">No evaluation criteria</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                      <button
                        onClick={() => openModal(task)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center"
                      >
                        <FaEdit className="mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
                      >
                        <FaTrash className="mr-1" /> Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {currentTask ? 'Edit Task' : 'Create New Task'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">
                        Task Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#006674] focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Points
                        </label>
                        <input
                          type="number"
                          name="points"
                          value={formData.points}
                          onChange={handleChange}
                          min="1"
                          max="100"
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#006674] focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Time (min)
                        </label>
                        <input
                          type="number"
                          name="time"
                          value={formData.time}
                          onChange={handleChange}
                          min="1"
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#006674] focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Language
                        </label>
                        <select
                          value={formData.language?.id}
                          onChange={handleLanguageChange}
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#006674] focus:border-transparent"
                          required
                        >
                          {availableLanguages.map(lang => (
                            <option key={lang.id} value={lang.id}>
                              {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">
                      Task Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="4"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#006674] focus:border-transparent"
                      required
                    ></textarea>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-gray-700 font-medium">
                        Sample Test Cases
                      </label>
                      <button
                        type="button"
                        onClick={addTestCase}
                        className="text-[#006674] hover:text-[#00525d] text-sm"
                      >
                        + Add Test Case
                      </button>
                    </div>
                    <div className="space-y-4">
                      {formData.sampleTestCases.map((testCase, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between mb-2">
                            <h4 className="font-medium text-gray-700">Test Case {index + 1}</h4>
                            {formData.sampleTestCases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTestCase(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-gray-700 text-sm mb-1">
                                Input
                              </label>
                              <textarea
                                value={testCase.input}
                                onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                                rows="3"
                                className="w-full p-2 border border-gray-300 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#006674] focus:border-transparent"
                              ></textarea>
                            </div>
                            <div>
                              <label className="block text-gray-700 text-sm mb-1">
                                Expected Output
                              </label>
                              <textarea
                                value={testCase.output}
                                onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                                rows="3"
                                className="w-full p-2 border border-gray-300 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#006674] focus:border-transparent"
                              ></textarea>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-gray-700 font-medium">
                        Evaluation Criteria (Must Sum to 100%)
                      </label>
                      <button
                        type="button"
                        onClick={addCriteria}
                        className="text-[#006674] hover:text-[#00525d] text-sm"
                      >
                        + Add Criteria
                      </button>
                    </div>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      {formData.evaluationCriteria.map((criteria, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={criteria.name}
                              onChange={(e) => handleCriteriaChange(index, 'name', e.target.value)}
                              placeholder="Criteria name"
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#006674] focus:border-transparent"
                              required
                            />
                          </div>
                          <div className="w-24">
                            <input
                              type="number"
                              value={criteria.weight}
                              onChange={(e) => handleCriteriaChange(index, 'weight', e.target.value)}
                              min="1"
                              max="100"
                              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#006674] focus:border-transparent"
                              required
                            />
                          </div>
                          <div className="text-sm text-gray-500">%</div>
                          {formData.evaluationCriteria.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCriteria(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      ))}
                      
                      <div className="flex justify-between pt-2 text-sm">
                        <span>Total:</span>
                        <span className={`font-semibold ${
                          formData.evaluationCriteria.reduce((sum, c) => sum + c.weight, 0) === 100
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {formData.evaluationCriteria.reduce((sum, c) => sum + c.weight, 0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#006674] text-white rounded hover:bg-[#00525d] flex items-center"
                    >
                      <FaCheck className="mr-2" /> {currentTask ? 'Update Task' : 'Create Task'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
} 