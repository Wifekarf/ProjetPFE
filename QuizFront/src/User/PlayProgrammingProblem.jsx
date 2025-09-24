import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from "../Layout/AuthLayout";
import { useNavigate } from 'react-router-dom';
import { getAffectedProgProblemsByUser, startProgProblem } from '../services/progProblemApi';
import Confetti from 'react-confetti';
import { FaCode, FaLaptopCode, FaExclamationTriangle, FaStar } from 'react-icons/fa';

const PlayProgrammingProblem = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showList, setShowList] = useState(true);
  const [completedProblems, setCompletedProblems] = useState([]);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const response = await getAffectedProgProblemsByUser(parseInt(user.id));
        // Handle different response structures
        const problemsData = response.data.problems || response.data.progProblems || response.data;
        console.log('Problems data:', problemsData);
        
        // Process the data to normalize it
        const normalizedProblems = Array.isArray(problemsData) ? problemsData.map(item => {
          // If the data has a nested progProblem property, normalize it
          if (item.progProblem) {
            return {
              id: item.affectationId || item.id,
              title: item.progProblem.title,
              description: item.progProblem.description,
              difficulty: item.progProblem.difficulty,
              tasksCount: item.progProblem.totalTasks || item.progProblem.tasks?.length || 0,
              points_total: item.progProblem.totalPoints,
              languages: item.progProblem.tasks?.map(task => task.language?.name).filter(Boolean) || [],
              dateAffectation: item.dateAffectation,
              status: item.status,
              progProblemId: item.progProblem.id // Keep the actual problem ID for starting the problem
            };
          }
          // Otherwise return the item as is
          return item;
        }) : [];
        
        console.log('Normalized problems:', normalizedProblems);
        setProblems(normalizedProblems);
      } catch (err) {
        setError(err.message || 'Failed to load programming problems');
        console.error('Error fetching problems:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [user.id]);

  const startProblem = async (problem) => {
    try {
      // Use progProblemId if it exists, otherwise fall back to other ID options
      const problemId = problem.progProblemId || problem.id || problem._id;
      
      if (!problemId) {
        setError('Problem ID not found');
        return;
      }
      
      console.log(`Starting problem with ID: ${problemId}`);
      
      await startProgProblem({
        userId: user.id,
        progProblemId: problemId
      });
      
      // Try to find the code if it exists
      const problemCode = problem.code || problem.accessCode;
      
      // Navigate to the solve problem page
      if (problemCode) {
        navigate(`/solve-problem/${problemCode}`);
      } else {
        navigate(`/solve-problem/${problemId}`);
      }
    } catch (err) {
      setError('Failed to start problem. Please try again.');
      console.error('Error starting problem:', err);
    }
  };

  const formatDifficulty = (difficulty) => {
    const colors = {
      'easy': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'hard': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[difficulty] || 'bg-gray-100 text-gray-800'}`}>
        {difficulty}
      </span>
    );
  };

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex justify-center items-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
          />
        </div>
      </AuthLayout>
    );
  }

  if (error) {
    return (
      <AuthLayout>
        <div className="flex justify-center items-center min-h-screen p-4">
          <div className="bg-red-100 border-l-4 border-red-500 p-4 max-w-md">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (problems.length === 0) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden p-8 text-center"
          >
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-indigo-100 mb-4">
              <FaCode className="h-10 w-10 text-indigo-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No Programming Problems Assigned
            </h2>
            
            <p className="text-gray-600 mb-6">
              You don't have any programming problems assigned at the moment. Check back later or contact your instructor.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/home')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Return to Dashboard
            </motion.button>
          </motion.div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="pt-28 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Programming Challenges</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems
              .filter(problem => !completedProblems.includes(problem.id))
              .map((problem, index) => (
                <motion.div
                  key={problem.id || problem.affectationId || `problem-${index}`}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
                >
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                        <FaLaptopCode size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">
                          {problem.title || problem.name}
                        </h2>
                        <div className="mt-1">
                          {formatDifficulty(problem.difficulty || problem.level || 'medium')}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <h3 className="text-xs font-medium text-blue-800">Tasks</h3>
                        <p className="text-lg font-bold text-blue-600">
                          {problem.tasksCount || problem.tasks_count || problem.tasks?.length || 0}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-2 rounded-lg">
                        <h3 className="text-xs font-medium text-purple-800">Points</h3>
                        <p className="text-lg font-bold text-purple-600">
                          {problem.points_total || problem.totalPoints || problem.points || 0}
                        </p>
                      </div>
                      <div className="bg-green-50 p-2 rounded-lg col-span-2">
                        <h3 className="text-xs font-medium text-green-800">Languages</h3>
                        <p className="text-sm font-bold text-green-600 truncate">
                          {(problem.languages || problem.programmingLanguages) ? 
                            (problem.languages || problem.programmingLanguages).join(', ') : 'Any'}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {problem.description || problem.desc || "No description available"}
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => startProblem(problem)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg flex items-center justify-center"
                    >
                      <FaCode className="mr-2" />
                      Start Coding
                    </motion.button>
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.div>
      </div>
    </AuthLayout>
  );
};

export default PlayProgrammingProblem; 