import { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import AuthLayout from '../Layout/AuthLayout';
import { FaCode } from 'react-icons/fa';
import { getUserProgProblemHistory, getUserQuizHistory } from '../services/historyService';

const Index = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        role: 'ROLE_USER',
        userId: '',
        quizName: '',
        dateFrom: '',
        dateTo: ''
    });
    const [expandedAttempt, setExpandedAttempt] = useState(null);
    const user = JSON.parse(localStorage.getItem("user"));
    const [historyType, setHistoryType] = useState('quiz'); // 'quiz' or 'programming'

    const [currentUserRole, setCurrentUserRole] = useState(user.role);

    // Fetch user role on component mount
    useEffect(() => {
        const fetchUserRole = async () => {
            try {
                setCurrentUserRole(user.role);
            } catch (err) {
                console.error('Error fetching user role:', err);
            }
        };
        fetchUserRole();
    }, []);

    useEffect(() => {
        if (historyType === 'quiz') {
          fetchHistory();
        } else {
          fetchProgrammingHistory();
        }
      }, [currentUserRole, historyType]);

// inside your Index.jsx
const fetchHistory = async () => {
    setLoading(true);
    setError(null);
  
    try {
      // pass null userId for admin, otherwise the actual id
      const payloadUserId = currentUserRole === 'ROLE_ADMIN' ? null : user.id;
      const { count, history: quizHistory } = await getUserQuizHistory(
        payloadUserId,
        currentUserRole
      );
  
      // quizHistory is now the array from backend
      setHistory(quizHistory);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch quiz history');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };
// const fetchHistory = async () => {
//   try {
//     const { data } = await api.get(`/api/users/getQuizHistoriqueByid/${user.id}`);
//     // data is an array of { id, quiz_title, score, completed_at, ... }

//     // 1) build the shape your UI expects:
//     const formatted = data.map(item => ({
//       id: item.id,
//       user: { username: user.username },           // so the name shows up
//       quiz: { nom: item.quiz_title },              // so you get attempt.quiz.nom
//       dateCreation:     item.completed_at,         // so formatDate() works
//       scorePoints:      item.score,                // UI uses scorePoints
//       correctAnswers:   `${item.correct}/${item.total}`, // if you have those
//       userAnswer:       item.userAnswer            // if you need to drill in
//     }));

//     setHistory(formatted);
//   } catch (err) {
//     setError(err.message);
//   } finally {
//     setLoading(false);
//   }
// };


    // Add programming history fetch function
    // const fetchProgrammingHistory = async () => {
    //     setLoading(true);
    //     setError(null);
    //     try {
    //         // Use the history service to fetch programming problem history from backend
    //         const response = await getUserProgProblemHistory(user.id);
            
    //         if (response.data) {
    //             setHistory(Array.isArray(response.data) ? response.data : 
    //                       (response.data.history && Array.isArray(response.data.history)) ? 
    //                       response.data.history : []);
    //         } else {
    //             setHistory([]);
    //         }
    //     } catch (err) {
    //         setError('Failed to fetch programming history data');
    //         console.error('Error in programming history process:', err);
    //         setHistory([]);
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    // const fetchProgrammingHistory = async () => {
    //             setLoading(true);
    //             setError(null);
    //             try {
    //                 // For admin, send only role; otherwise send role + userId
    //                 const payload = currentUserRole === 'ROLE_ADMIN'
    //                     ? { role: currentUserRole }
    //                     : { role: currentUserRole, userId: user.id };
        
    //                 // Call the service
    //                 const { history: progHistory } = await getUserProgProblemHistory(
    //                     payload.userId ?? null,
    //                     payload.role
    //                 );
        
    //                 setHistory(Array.isArray(progHistory) ? progHistory : []);
    //             } catch (err) {
    //                 setError('Failed to fetch programming history');
    //                 console.error('Error in programming history process:', err);
    //                 setHistory([]);
    //             } finally {
    //                 setLoading(false);
    //             }
    //         };

    // // Update useEffect to handle both history types
    // useEffect(() => {
    //     if (historyType === 'quiz') {
    //         fetchHistory();
    //     } else {
    //         fetchProgrammingHistory();
    //     }
    // }, [currentUserRole, historyType]);
     // inside your Index.jsx
const fetchProgrammingHistory = async () => {
    setLoading(true);
    setError(null);
  
    try {
      // admin => null, others => their own ID
      const sendUserId = currentUserRole === 'ROLE_ADMIN' ? null : user.id;
  
      // now pass both userId and role
      const { history: progHistory } = await getUserProgProblemHistory(
        sendUserId,
        currentUserRole
      );
  
      setHistory(progHistory);
    } catch (err) {
      console.error('Error fetching programming history:', err);
      setError('Failed to fetch programming history');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };
  
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const applyFilters = () => {
        if (historyType === 'quiz') {
            fetchHistory();
        } else {
            fetchProgrammingHistory();
        }
    };

    const toggleAttemptDetails = (id) => {
        setExpandedAttempt(expandedAttempt === id ? null : id);
    };

    const filteredHistory = history.filter(attempt => {
        // For quiz history
        if (historyType === 'quiz') {
            const matchesQuiz = filters.quizName ?
                attempt.quiz?.nom?.toLowerCase().includes(filters.quizName.toLowerCase()) : true;
            
            const matchesDate = () => {
                if (!filters.dateFrom && !filters.dateTo) return true;

                const attemptDate = new Date(attempt.dateCreation);
                const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
                const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

                if (fromDate && toDate) {
                    return attemptDate >= fromDate && attemptDate <= toDate;
                } else if (fromDate) {
                    return attemptDate >= fromDate;
                } else if (toDate) {
                    return attemptDate <= toDate;
                }
                return true;
            };

            return matchesQuiz && matchesDate();
        } 
        // For programming problem history
        else {
            // Handle multiple possible field name formats
            const getTitle = () => {
                return attempt.problem?.title || 
                       attempt.prog_problem?.title || 
                       attempt.title || 
                       `Problem ${attempt.progProblemId || attempt.prog_problem_id}`;
            };
            
            const getDate = () => {
                return attempt.dateSubmission || 
                       attempt.date_submission || 
                       attempt.submission_date || 
                       attempt.dateCreation || 
                       new Date();
            };
            
            // Match problem name with better fallbacks
            const matchesProblem = filters.quizName ?
                getTitle().toLowerCase().includes(filters.quizName.toLowerCase()) : true;
            
            const matchesDate = () => {
                if (!filters.dateFrom && !filters.dateTo) return true;

                const attemptDate = new Date(getDate());
                const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
                const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

                if (fromDate && toDate) {
                    return attemptDate >= fromDate && attemptDate <= toDate;
                } else if (fromDate) {
                    return attemptDate >= fromDate;
                } else if (toDate) {
                    return attemptDate <= toDate;
                }
                return true;
            };

            return matchesProblem && matchesDate();
        }
    });

    const formatDate = (dateString) => {
        try {
            // Handle different date formats that might come from the backend
            // First check if it's already a Date object
            if (dateString instanceof Date) {
                const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
                return dateString.toLocaleDateString(undefined, options);
            }
            
            // Try to parse the date string
            const date = new Date(dateString);
            
            // Check if the date is valid
            if (isNaN(date.getTime())) {
                // If not valid, try to manually parse common formats like "YYYY-MM-DD HH:MM:SS"
                if (typeof dateString === 'string') {
                    const parts = dateString.split(/[- :]/);
                    if (parts.length >= 6) {
                        // Format: YYYY-MM-DD HH:MM:SS
                        const newDate = new Date(
                            parseInt(parts[0]), 
                            parseInt(parts[1]) - 1, // Month is 0-indexed in JS Date
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
                
                // If all parsing attempts fail, return a fallback
                return "Invalid date";
            }
            
            // Format the valid date
            const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return date.toLocaleDateString(undefined, options);
        } catch (error) {
            console.error("Error formatting date:", error, dateString);
            return "Date formatting error";
        }
    };

    const calculatePercentage = (correctAnswers) => {
        try {
            // Handle undefined or non-string values
            if (!correctAnswers || typeof correctAnswers !== 'string') {
                return 0;
            }
            
            // Make sure we have a proper format to split
            if (!correctAnswers.includes('/')) {
                return 0;
            }
            
            const [correct, total] = correctAnswers.split('/').map(Number);
            
            // Check for NaN values after conversion
            if (isNaN(correct) || isNaN(total)) {
                return 0;
            }
            
            return total > 0 ? Math.round((correct / total) * 100) : 0;
        } catch (error) {
            console.error("Error calculating percentage:", error);
            return 0;
        }
    };

    return (
        <AuthLayout>
            <div className="container mx-auto px-4 py-8">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold text-gray-800 mb-8"
                >
                    {historyType === 'quiz' ? 'Quiz Attempt History' : 'Programming Problem History'}
                </motion.h1>

                {/* History Type Toggle */}
                <div className="flex justify-center mb-6">
                    <div className="inline-flex rounded-md shadow-sm">
                        <button
                            onClick={() => {
                                setHistoryType('quiz');
                                setHistory([]);
                                setError(null);
                                fetchHistory();
                            }}
                            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                                historyType === 'quiz'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Quiz History
                        </button>
                        <button
                            onClick={() => {
                                setHistoryType('programming');
                                setHistory([]);
                                setError(null);
                                fetchProgrammingHistory();
                            }}
                            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                                historyType === 'programming'
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {historyType === 'quiz' ? 'Quiz Name' : 'Problem Name'}
                            </label>
                            <input
                                type="text"
                                name="quizName"
                                placeholder={historyType === 'quiz' ? "Search by quiz name" : "Search by problem name"}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={filters.quizName}
                                onChange={handleFilterChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                            <input
                                type="date"
                                name="dateFrom"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={filters.dateFrom}
                                onChange={handleFilterChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                            <input
                                type="date"
                                name="dateTo"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={filters.dateTo}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>


                </motion.div>

                {/* Loading and Error States */}
                {loading && (
                    <div className="flex justify-center my-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                )}

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
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No history found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {historyType === 'quiz' 
                                        ? "You haven't attempted any quizzes yet."
                                        : "You haven't attempted any programming problems yet."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {historyType === 'programming' ? (
                                    // Programming problem attempt cards
                                    filteredHistory.map((attempt, index) => (
                                        <div 
                                            key={attempt.id || index} 
                                            className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row"
                                        >
                                            <div className="md:w-3/4">
                                                <div className="flex items-start">
                                                    <div className="mr-4 p-2 bg-indigo-100 rounded-full">
                                                        <FaCode className="text-indigo-600 text-xl" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-lg">
                                                            {attempt.progProblem?.title || attempt.problem?.title || attempt.prog_problem?.title || attempt.title || "Programming Problem"}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            {formatDate(attempt.dateSubmission || attempt.date_submission || attempt.submission_date || attempt.dateCreation || new Date())}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <span className="text-sm text-gray-500">Score:</span>
                                                        <span className="ml-2 font-semibold">
                                                            {attempt.score || attempt.scorePoints || 0} / {attempt.progProblem?.pointsTotal || attempt.problem?.pointsTotal || attempt.totalTasks * 10 || 0} pts
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-gray-500">Tasks Completed:</span>
                                                        <span className="ml-2 font-semibold">
                                                            {attempt.completedTasks || attempt.tasksCompleted || attempt.tasks_completed || 0} / {attempt.totalTasks || attempt.problem?.tasksCount || attempt.prog_problem?.tasks_count || 0}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-gray-500">Time Spent:</span>
                                                        <span className="ml-2 font-semibold">
                                                            {attempt.timeSpent || attempt.time_spent || "-"} mins
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="md:w-1/4 flex justify-end items-center mt-4 md:mt-0">
                                                <button
                                                    onClick={() => toggleAttemptDetails(attempt.id)}
                                                    className="px-4 py-2 text-sm rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                                >
                                                    {expandedAttempt === attempt.id ? 'Hide Details' : 'View Details'}
                                                </button>
                                            </div>
                                            
                                            {expandedAttempt === attempt.id && (
                                                <div className="mt-6 w-full border-t pt-4">
                                                    <h4 className="font-medium mb-3">Task Evaluations</h4>
                                                    <div className="space-y-4">
                                                        {attempt.evaluations && Object.entries(attempt.evaluations).map(([taskId, evaluation], idx) => (
                                                            <div 
                                                                key={idx}
                                                                className={`p-4 rounded-lg border ${
                                                                    evaluation.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                                                                }`}
                                                            >
                                                                <p className="font-medium text-sm mb-2">
                                                                    Task {idx + 1}
                                                                </p>
                                                                
                                                                <div className="mb-2">
                                                                    <p className="text-sm font-medium">Result:</p>
                                                                    <p className={`text-sm ${evaluation.passed ? 'text-green-600' : 'text-red-600'}`}>
                                                                        {evaluation.passed ? 'Passed ✓' : 'Failed ✗'}
                                                                    </p>
                                                                    {evaluation.feedback && (
                                                                        <p className="text-xs mt-1 text-gray-600">{evaluation.feedback}</p>
                                                                    )}
                                                                </div>
                                                                
                                                                <div className="mb-2">
                                                                    <p className="text-sm font-medium">Strengths:</p>
                                                                    {evaluation.strengths && evaluation.strengths.length > 0 ? (
                                                                        <ul className="list-disc pl-5 text-xs text-gray-600">
                                                                            {evaluation.strengths.map((strength, i) => (
                                                                                <li key={i}>{strength}</li>
                                                                            ))}
                                                                        </ul>
                                                                    ) : (
                                                                        <p className="text-xs text-gray-600">No strengths identified</p>
                                                                    )}
                                                                </div>
                                                                
                                                                <div className="mb-2">
                                                                    <p className="text-sm font-medium">Weaknesses:</p>
                                                                    {evaluation.weaknesses && evaluation.weaknesses.length > 0 ? (
                                                                        <ul className="list-disc pl-5 text-xs text-gray-600">
                                                                            {evaluation.weaknesses.map((weakness, i) => (
                                                                                <li key={i}>{weakness}</li>
                                                                            ))}
                                                                        </ul>
                                                                    ) : (
                                                                        <p className="text-xs text-gray-600">No weaknesses identified</p>
                                                                    )}
                                                                </div>
                                                                
                                                                <div className="flex justify-between text-xs text-gray-500">
                                                                    <span>Score: {evaluation.score || 0} pts</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {(!attempt.evaluations || Object.keys(attempt.evaluations).length === 0) && (
                                                            <div className="p-4 bg-gray-50 rounded-lg text-center">
                                                                <p className="text-gray-600">No task evaluations available</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    // Existing quiz attempt cards
                                    filteredHistory.map(attempt => (
                                        <motion.div
                                            key={attempt.id}
                                            whileHover={{ y: -2 }}
                                            className="bg-white rounded-lg shadow overflow-hidden"
                                        >
                                            <div
                                                className="p-4 cursor-pointer"
                                                onClick={() => toggleAttemptDetails(attempt.id)}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-800">{attempt.user?.username || 'Anonymous'}</h3>
                                                        <p className="text-sm text-gray-600">
                                                            {formatDate(attempt.dateCreation)} • {attempt.quiz?.nom || 'Unknown Quiz'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center space-x-4">
                                                        <div className="text-center">
                                                            <span className="block text-2xl font-bold text-blue-600">
                                                                {attempt.scorePoints || 0}
                                                            </span>
                                                            <span className="text-xs text-gray-500">Points</span>
                                                        </div>
                                                        <div className="text-center">
                                                            <span className="block text-2xl font-bold text-green-600">
                                                                {attempt.correctAnswers ? calculatePercentage(attempt.correctAnswers) : 0}%
                                                            </span>
                                                            <span className="text-xs text-gray-500">Correct</span>
                                                        </div>
                                                        <motion.div
                                                            animate={{ rotate: expandedAttempt === attempt.id ? 180 : 0 }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
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
                                                    <div className="p-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            {/* Quiz Info */}
                                                            <div>
                                                                <h4 className="font-medium text-gray-700 mb-2">Quiz Information</h4>
                                                                <div className="space-y-2">
                                                                    <p><span className="text-gray-600">Total Questions:</span> {attempt.quiz?.nb_question || 0}</p>
                                                                    <p><span className="text-gray-600">Total Points:</span> {attempt.quiz?.points_total || 0}</p>
                                                                    <p><span className="text-gray-600">Date Range:</span> {formatDate(attempt.quiz?.date_debut)} - {formatDate(attempt.quiz?.date_fin)}</p>
                                                                    <p><span className="text-gray-600">Type:</span> {attempt.quiz?.type || 'Unknown'}</p>
                                                                </div>
                                                            </div>

                                                            {/* Attempt Info */}
                                                            <div>
                                                                <h4 className="font-medium text-gray-700 mb-2">Attempt Details</h4>
                                                                <div className="space-y-2">
                                                                    <p><span className="text-gray-600">Correct Answers:</span> {attempt.correctAnswers}</p>
                                                                    <p><span className="text-gray-600">Time Spent:</span> {attempt.user_time_total_selon_time_total}</p>
                                                                    <p><span className="text-gray-600">Score:</span> {attempt.scorePoints} points</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* User Answers */}
                                                        <div className="mt-6">
                                                            <h4 className="font-medium text-gray-700 mb-3">Question Breakdown</h4>
                                                            <div className="space-y-3">
                                                                {attempt.userAnswer && Array.isArray(attempt.userAnswer) ? (
                                                                    attempt.userAnswer.map((answer, index) => (
                                                                        <div
                                                                            key={index}
                                                                            className={`p-3 rounded-lg border ${answer.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                                                                }`}
                                                                        >
                                                                            <div className="flex justify-between items-start">
                                                                                <div>
                                                                                    <p className="font-medium text-gray-800">{answer.question}</p>
                                                                                    <p className="text-sm mt-1">
                                                                                        <span className="text-gray-600">Your answer:</span> {answer.reponse}
                                                                                    </p>
                                                                                    {!answer.correct && (
                                                                                        <p className="text-sm mt-1">
                                                                                            <span className="text-gray-600">Correct answer:</span> {answer.correctAnswer}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center space-x-2">
                                                                                    <span className={`px-2 py-1 rounded-full text-xs ${answer.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                                        }`}>
                                                                                        {answer.correct ? 'Correct' : 'Incorrect'}
                                                                                    </span>
                                                                                    <span className="text-xs text-gray-500">
                                                                                        {answer.time_user_quest}s
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                                                                        <p className="text-gray-600">No answer data available</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </AuthLayout>
    );
};

export default Index;