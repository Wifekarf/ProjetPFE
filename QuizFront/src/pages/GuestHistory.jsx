import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AuthLayout from '../Layout/AuthLayout';
import api from '../services/api';
import { FaCode } from 'react-icons/fa';

export default function GuestHistory() {
  const [quizHistory, setQuizHistory] = useState([]);
  const [progHistory, setProgHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAttempt, setExpandedAttempt] = useState(null);
  const [filters, setFilters] = useState({
    email: '',
    quizName: '',
    dateFrom: '',
    dateTo: ''
  });
  const [historyType, setHistoryType] = useState('quiz'); // 'quiz' or 'programming'

  useEffect(() => {
    setLoading(true);
    setError(null);
    setExpandedAttempt(null);
    if (historyType === 'quiz') {
      fetchQuizHistory();
    } else {
      fetchProgHistory();
    }
    // eslint-disable-next-line
  }, [historyType]);

  const fetchQuizHistory = async () => {
    try {
      const { data } = await api.get('/api/quiz/guest/history');
      setQuizHistory(data.history || []);
    } catch (err) {
      setError('Failed to fetch guest quiz history');
      setQuizHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgHistory = async () => {
    try {
      const { data } = await api.get('/prog-actions/api/progprob/guest/history');
      setProgHistory(data.history || []);
    } catch (err) {
      setError('Failed to fetch guest programming history');
      setProgHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleAttemptDetails = (id) => {
    setExpandedAttempt(expandedAttempt === id ? null : id);
  };

  const formatDate = (dateString) => {
    try {
      if (dateString instanceof Date) {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return dateString.toLocaleDateString(undefined, options);
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        if (typeof dateString === 'string') {
          const parts = dateString.split(/[- :]/);
          if (parts.length >= 6) {
            const newDate = new Date(
              parseInt(parts[0]),
              parseInt(parts[1]) - 1,
              parseInt(parts[2]),
              parseInt(parts[3]),
              parseInt(parts[4]),
              parseInt(parts[5])
            );
            if (!isNaN(newDate.getTime())) {
              const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
              return newDate.toLocaleDateString(undefined, options);
            }
          }
        }
        return "Invalid date";
      }
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      return "Date formatting error";
    }
  };

  const calculatePercentage = (correctAnswers, attempt = {}) => {
  try {
    // Format 1: 'x/y' string
    if (typeof correctAnswers === 'string' && correctAnswers.includes('/')) {
      const [correct, total] = correctAnswers.split('/').map(Number);
      if (isNaN(correct) || isNaN(total)) return 0;
      return total > 0 ? Math.round((correct / total) * 100) : 0;
    }

    // Format 2: number (correct answers as int, use total from quiz or userAnswer)
    if (typeof correctAnswers === 'number') {
      let total = 0;
      if (attempt.quiz && typeof attempt.quiz.nb_question === 'number') {
        total = attempt.quiz.nb_question;
      } else if (Array.isArray(attempt.userAnswer)) {
        total = attempt.userAnswer.length;
      }
      if (total === 0) return 0;
      return Math.round((correctAnswers / total) * 100);
    }
    return 0;
  } catch (error) {
    return 0;
  }
};

  // Filter logic (applies to both)
  const filteredHistory = (historyType === 'quiz' ? quizHistory : progHistory).filter((attempt) => {
    // Quiz
    if (historyType === 'quiz') {
      const matchesEmail = filters.email ? attempt.email?.toLowerCase().includes(filters.email.toLowerCase()) : true;
      const matchesQuiz = filters.quizName ? attempt.quiz?.name?.toLowerCase().includes(filters.quizName.toLowerCase()) : true;
      const matchesDate = () => {
        if (!filters.dateFrom && !filters.dateTo) return true;
        const attemptDate = new Date(attempt.dateCreation);
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
        if (fromDate && toDate) return attemptDate >= fromDate && attemptDate <= toDate;
        else if (fromDate) return attemptDate >= fromDate;
        else if (toDate) return attemptDate <= toDate;
        return true;
      };
      return matchesEmail && matchesQuiz && matchesDate();
    }
    // Programming Problem
    else {
      const getTitle =
        attempt.problem?.title ||
        attempt.progProblem?.title ||
        attempt.prog_problem?.title ||
        attempt.title ||
        '';
      const matchesProblem = filters.quizName
        ? getTitle.toLowerCase().includes(filters.quizName.toLowerCase())
        : true;
      const matchesDate = () => {
        if (!filters.dateFrom && !filters.dateTo) return true;
        const attemptDate =
          new Date(
            attempt.dateSubmission ||
            attempt.date_submission ||
            attempt.submission_date ||
            attempt.dateCreation
          );
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
        if (fromDate && toDate) return attemptDate >= fromDate && attemptDate <= toDate;
        else if (fromDate) return attemptDate >= fromDate;
        else if (toDate) return attemptDate <= toDate;
        return true;
      };
      return matchesProblem && matchesDate();
    }
  });

  return (
    <AuthLayout>
      <div className="container mx-auto px-4 py-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-800 mb-8"
        >
          {historyType === 'quiz' ? 'Guest Quiz Attempts History' : 'Guest Programming Problem Attempts History'}
        </motion.h1>

        {/* History Type Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => setHistoryType('quiz')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${historyType === 'quiz'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              Quiz History
            </button>
            <button
              onClick={() => setHistoryType('programming')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${historyType === 'programming'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              Programming History
            </button>
          </div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg shadow p-6 mb-8"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {historyType === 'quiz' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="text"
                  name="email"
                  placeholder="Search by email"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.email}
                  onChange={handleFilterChange}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {historyType === 'quiz' ? 'Quiz Name' : 'Problem Name'}
              </label>
              <input
                type="text"
                name="quizName"
                placeholder={historyType === 'quiz' ? "Search by quiz name" : "Search by problem name"}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.quizName}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                name="dateFrom"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.dateFrom}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                name="dateTo"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.dateTo}
                onChange={handleFilterChange}
              />
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* History List */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {filteredHistory.length === 0 ? (
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {historyType === 'quiz'
                    ? 'No guest quiz attempts found'
                    : 'No guest programming problem attempts found'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {historyType === 'quiz'
                    ? 'No guest quiz attempts match your current filters.'
                    : 'No guest programming problem attempts match your current filters.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {historyType === 'quiz'
                  ? filteredHistory.map((attempt) => (
                      <motion.div
                        key={attempt.id}
                        whileHover={{ y: -2 }}
                        className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200"
                      >
                        <div
                          className="p-4 cursor-pointer"
                          onClick={() => toggleAttemptDetails(attempt.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-blue-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-800">
                                    {attempt.email || 'Anonymous Guest'}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {formatDate(attempt.dateCreation)} • {attempt.quiz?.name || 'Unknown Quiz'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-6">
                              <div className="text-center">
                                <span className="block text-2xl font-bold text-blue-600">
                                  {attempt.scorePoints || 0}
                                </span>
                                <span className="text-xs text-gray-500">Points</span>
                              </div>
                              <div className="text-center">
                                <span className="block text-2xl font-bold text-green-600">
                                  {attempt.correctAnswers ? calculatePercentage(attempt.correctAnswers, attempt) : 0}%
                                </span>
                                <span className="text-xs text-gray-500">Correct</span>
                              </div>
                              <div className="text-center">
                                <span className="block text-lg font-semibold text-gray-700">
                                  {attempt.correctAnswers || '0/0'}
                                </span>
                                <span className="text-xs text-gray-500">Questions</span>
                              </div>
                              <motion.div
                                animate={{ rotate: expandedAttempt === attempt.id ? 180 : 0 }}
                                className="ml-4"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-gray-500"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </motion.div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedAttempt === attempt.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-gray-200"
                          >
                            <div className="p-4 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Quiz Information */}
                                <div>
                                  <h4 className="font-medium text-gray-700 mb-3">Quiz Information</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Quiz Name:</span>
                                      <span className="font-medium">{attempt.quiz?.name || 'Unknown'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Total Questions:</span>
                                      <span className="font-medium">{attempt.quiz?.nb_question || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Total Points:</span>
                                      <span className="font-medium">{attempt.quiz?.points_total || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Quiz Type:</span>
                                      <span className="font-medium">{attempt.quiz?.type || 'Unknown'}</span>
                                    </div>
                                  </div>
                                </div>
                                {/* Attempt Details */}
                                <div>
                                  <h4 className="font-medium text-gray-700 mb-3">Attempt Details</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Guest Email:</span>
                                      <span className="font-medium">{attempt.email || 'Not provided'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Score:</span>
                                      <span className="font-medium">{attempt.scorePoints || 0} points</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Correct Answers:</span>
                                      <span className="font-medium">{attempt.correctAnswers || '0/0'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Accuracy:</span>
                                      <span className="font-medium">
                                        {calculatePercentage(attempt.correctAnswers, attempt)}%
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Completed:</span>
                                      <span className="font-medium">{formatDate(attempt.dateCreation)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* Additional Details */}
                              {attempt.userAnswer && Array.isArray(attempt.userAnswer) && (
                                <div className="mt-6">
                                  <h4 className="font-medium text-gray-700 mb-3">Question Breakdown</h4>
                                  <div className="space-y-3">
                                    {attempt.userAnswer.map((answer, index) => (
                                      <div
                                        key={index}
                                        className={`p-3 rounded-lg border ${answer.correct
                                          ? 'bg-green-50 border-green-200'
                                          : 'bg-red-50 border-red-200'
                                          }`}
                                      >
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <p className="font-medium text-gray-800 mb-1">
                                              {answer.question}
                                            </p>
                                            <p className="text-sm">
                                              <span className="text-gray-600">Guest answer:</span>
                                              <span className="ml-1">{answer.reponse}</span>
                                            </p>
                                            {!answer.correct && (
                                              <p className="text-sm mt-1">
                                                <span className="text-gray-600">Correct answer:</span>
                                                <span className="ml-1">{answer.correctAnswer}</span>
                                              </p>
                                            )}
                                          </div>
                                          <div className="flex items-center space-x-2 ml-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${answer.correct
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-red-100 text-red-800'
                                              }`}>
                                              {answer.correct ? 'Correct' : 'Incorrect'}
                                            </span>
                                            {answer.time_user_quest && (
                                              <span className="text-xs text-gray-500">
                                                {answer.time_user_quest}s
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ))
                  // Programming problem attempts
                  : filteredHistory.map((attempt, idx) => (
                    <motion.div
                      key={attempt.id || idx}
                      whileHover={{ y: -2 }}
                      className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200"
                    >
                      <div
                        className="p-4 cursor-pointer flex items-center"
                        onClick={() => toggleAttemptDetails(attempt.id)}
                      >
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                          <FaCode className="text-indigo-600 text-xl" />
                        </div>
                       <div className="flex-1">
  {attempt.email && (
    <p className="text-xs text-gray-500 font-semibold mb-1">
      {attempt.email}
    </p>
  )}
  <h3 className="text-lg font-semibold text-gray-800">
    {attempt.progProblem?.title ||
      attempt.problem?.title ||
      attempt.prog_problem?.title ||
      attempt.title ||
      'Programming Problem'}
  </h3>
  <p className="text-sm text-gray-600">
    {formatDate(attempt.dateSubmission || attempt.date_submission || attempt.submission_date || attempt.dateCreation || new Date())}
  </p>
</div>

                        <div className="flex space-x-6">
                          <div className="text-center">
                            <span className="block text-2xl font-bold text-blue-600">
                              {attempt.score || attempt.scorePoints || 0}
                            </span>
                            <span className="text-xs text-gray-500">Points</span>
                          </div>
                          <div className="text-center">
                            <span className="block text-lg font-semibold text-gray-700">
                              {attempt.completedTasks || attempt.tasksCompleted || attempt.tasks_completed || 0}
                            </span>
                            <span className="text-xs text-gray-500">Tasks</span>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: expandedAttempt === attempt.id ? 180 : 0 }}
                          className="ml-4"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </motion.div>
                      </div>
                      {/* Expanded Details */}
                      {expandedAttempt === attempt.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-gray-200"
                        >
                          <div className="p-4 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-medium text-gray-700 mb-3">Problem Info</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Title:</span>
                                    <span className="font-medium">
                                      {attempt.progProblem?.title ||
                                        attempt.problem?.title ||
                                        attempt.prog_problem?.title ||
                                        attempt.title ||
                                        'Programming Problem'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Difficulty:</span>
                                    <span className="font-medium">
                                      {attempt.progProblem?.difficulty ||
                                        attempt.problem?.difficulty ||
                                        attempt.prog_problem?.difficulty ||
                                        '-'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Total Tasks:</span>
                                    <span className="font-medium">
                                      {attempt.totalTasks ||
                                        attempt.problem?.tasksCount ||
                                        attempt.prog_problem?.tasks_count ||
                                        '-'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-700 mb-3">Attempt Details</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Score:</span>
                                    <span className="font-medium">
                                      {attempt.score || attempt.scorePoints || 0} points
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Tasks Completed:</span>
                                    <span className="font-medium">
                                      {attempt.completedTasks || attempt.tasksCompleted || attempt.tasks_completed || 0} / {attempt.totalTasks || attempt.problem?.tasksCount || attempt.prog_problem?.tasks_count || 0}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Date:</span>
                                    <span className="font-medium">
                                      {formatDate(attempt.dateSubmission || attempt.date_submission || attempt.submission_date || attempt.dateCreation || new Date())}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Evaluations (optional) */}
                            {attempt.evaluations && (
                              <div className="mt-6">
                                <h4 className="font-medium text-gray-700 mb-3">Task Evaluations</h4>
                                <div className="space-y-3">
                                  {Object.entries(attempt.evaluations).map(([task, evaluation], i) => (
                                    <div
                                      key={i}
                                      className={`p-3 rounded-lg border ${evaluation.passed
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-red-50 border-red-200'
                                        }`}
                                    >
                                      <div className="flex justify-between items-center">
                                        <span>Task {task}</span>
                                        <span className={evaluation.passed ? 'text-green-700' : 'text-red-700'}>
                                          {evaluation.passed ? 'Passed' : 'Failed'}
                                        </span>
                                      </div>
                                      {evaluation.feedback && (
                                        <div className="text-xs text-gray-600 mt-1">
                                          {evaluation.feedback}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AuthLayout>
  );
}
