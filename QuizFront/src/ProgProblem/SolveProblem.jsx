import { useState, useEffect } from 'react';
import { progressService } from '../services/progressService';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from "../Layout/AuthLayout";
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getProgProblem, getProgProblemTasks, startProgProblem, submitSolution, verifyProgProblemCode, submitTaskSolution } from '../services/progProblemApi';
import api from '../services/api';
import { FaArrowLeft, FaCheck, FaInfoCircle, FaClock, FaLightbulb, FaCode } from 'react-icons/fa';
import Confetti from 'react-confetti';
import { saveProgrammingSubmission } from '../services/historyService';


const CodeEditor = ({ value, onChange, language }) => {
  const [showCopyPasteWarning, setShowCopyPasteWarning] = useState(false);

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  // Handle copy-paste prevention
  const preventCopyPaste = (e) => {
    e.preventDefault();
    setShowCopyPasteWarning(true);
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setShowCopyPasteWarning(false);
    }, 3000);
  };

  return (
    <div className="relative border rounded-lg overflow-hidden shadow-md">
      {/* Copy-Paste Warning Notification */}
      <AnimatePresence>
        {showCopyPasteWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center justify-between max-w-sm"
          >
            <div className="flex items-center">
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span>Copy and paste actions are disabled.</span>
            </div>
            <button
              onClick={() => setShowCopyPasteWarning(false)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-gray-800 text-gray-200 px-4 py-2 flex justify-between items-center">
        <span className="font-medium">{language?.name || 'Code'}</span>
        <span className="text-xs opacity-70">{language?.name} Editor</span>
      </div>
      <textarea
        value={value}
        onChange={handleChange}
        className="w-full h-96 p-4 font-mono bg-gray-900 text-gray-100 focus:outline-none resize-none"
        placeholder={`Write your solution here in ${language?.name || 'the required language'}...`}
        spellCheck="false"
        onCopy={preventCopyPaste}
        onPaste={preventCopyPaste}
        onCut={preventCopyPaste}
        onContextMenu={preventCopyPaste}
      />
    </div>
  );
};

import { useWebSocket } from '../context/WebSocketContext';

const SolveProblem = ({ sessionId , problemId }) => {
  var { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [solutions, setSolutions] = useState({});
  const [showHint, setShowHint] = useState(false);
  const [showTestCase, setShowTestCase] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // WebSocket context for real-time updates
  const { sendMessage } = useWebSocket();

  // Get email from query params if available
  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get('email');

  // Simulate a user ID (in a real app, this would come from auth context)
  const user = JSON.parse(localStorage.getItem('user') || '{"id": 0}');
  const userId = user.id || 0;

  useEffect(() => {
    if (problemId) {
     code = problemId;
    }
    if (code) {
      fetchProblem();
    }

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [code]);

  const fetchProblem = async () => {
    try {
      setIsLoading(true);

      console.log("Fetching problem with code:", code);

      let problemId;
      let problemData;
      let tasksData = [];

      try {
        // First try to verify the code (this might be a share code)
        const response = await verifyProgProblemCode(code);
        console.log("Verify code response:", response.data);
        problemId = response.data?.id || response.data?.progProblemId;
      } catch (error) {
        console.log("Code verification failed, trying code as direct problem ID");
        // If verification fails, try using the code directly as a problem ID
        if (!isNaN(parseInt(code))) {
          problemId = parseInt(code);
        }
      }

      if (!problemId) {
        console.error("No valid problem ID found");
        throw new Error('Invalid problem code or ID');
      }

      console.log("Using problem ID:", problemId);

      try {
        // Fetch problem data
        const problemRes = await getProgProblem(problemId);
        problemData = problemRes.data;
        console.log("Problem data:", problemData);

        // Try first endpoint for tasks
        try {
          const tasksRes = await getProgProblemTasks(problemId);
          tasksData = tasksRes.data;
        } catch (taskError) {
          console.warn("First task endpoint failed, trying alternate endpoint:", taskError);

          // Try second endpoint format (direct tasks endpoint)
          try {
            const altTasksRes = await api.get(`/api/tasks/problem/${problemId}`);
            tasksData = altTasksRes.data;
          } catch (altTaskError) {
            console.error("All task endpoints failed:", altTaskError);

            // Check if the problem data already contains tasks
            if (problemData.tasks && Array.isArray(problemData.tasks)) {
              console.log("Using tasks from problem data");
              tasksData = problemData.tasks;
            } else {
              throw new Error("Could not fetch tasks for this problem");
            }
          }
        }

        console.log("Tasks data:", tasksData);

        setProblem(problemData);
        setTasks(tasksData);

        // Initialize solutions object
        const initialSolutions = {};
        tasksData.forEach(task => {
          initialSolutions[task.id] = '';
        });
        setSolutions(initialSolutions);

        // Start the problem
        if (userId) {
          await startProgProblem({
            userId,
            progProblemId: problemId,
            email // Include email for guest users
          });
        }

        // Set initial task timer
        if (tasksData.length > 0) {
          const firstTaskTime = tasksData[0].time;
          setTimeLeft(firstTaskTime > 0 ? firstTaskTime * 60 : null); // Convert minutes to seconds
        }
      } catch (fetchError) {
        console.error("Error fetching problem or tasks:", fetchError);
        throw fetchError;
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching problem:', error);
      setIsLoading(false);
      navigate('/join-coding', { state: { error: 'Invalid or expired problem code' } });
    }
  };

  useEffect(() => {
    let timer;
    if (!isLoading && !result && timeLeft !== null && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleNextTask();
    }
    return () => clearInterval(timer);
  }, [isLoading, result, timeLeft]);

  const handleCodeChange = (code) => {
    const taskId = tasks[currentTaskIndex]?.id;
    if (taskId) {
      setSolutions(prev => ({
        ...prev,
        [taskId]: code
      }));
    }
  };

  const goToPreviousTask = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1);
      const prevTaskTime = tasks[currentTaskIndex - 1].time;
      setTimeLeft(prevTaskTime > 0 ? prevTaskTime * 60 : null);
      setShowHint(false);
      setShowTestCase(false);
    }
  };

  const handleNextTask = async () => {
    // Appel API progression prog (progId, userId, sessionId doivent être définis dans le scope)
    if (problemId && userId && sessionId) {
      progressService.updateProgProgress(problemId, userId, sessionId, currentTaskIndex + 1)
        .then(() => {
          // Envoi du message WebSocket update_score après succès API
          if (sendMessage && typeof sendMessage === 'function') {
            console.log("send")
            sendMessage({
              type: 'update_score',
              data: {
                teamSessionId: sessionId
              }
            });
          }
        })
        .catch(() => {});
    }
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
      const nextTaskTime = tasks[currentTaskIndex + 1].time;
      setTimeLeft(nextTaskTime > 0 ? nextTaskTime * 60 : null);
      setShowHint(false);
      setShowTestCase(false);
    } else if (currentTaskIndex === tasks.length - 1) {
      handleSubmit();
    }
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  const toggleTestCase = () => {
    setShowTestCase(!showTestCase);
  };

  const formatTime = (seconds) => {
    if (seconds === null) return 'No time limit';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = async () => {
    console.log("Starting submission process...");
    console.log("Current task state:", {
      currentTaskIndex,
      task: problem?.tasks?.[currentTaskIndex] || {},
      code: solutions[problem?.tasks?.[currentTaskIndex]?.id] || ''
    });

    try {
      setSubmitting(true);

      // Check if any solutions are empty
      const emptyTasks = Object.entries(solutions).filter(([taskId, code]) => !code.trim());
      if (emptyTasks.length > 0) {
        const taskNumbers = emptyTasks.map(([taskId]) => {
          const taskIndex = tasks.findIndex(t => t.id == taskId);
          return taskIndex >= 0 ? taskIndex + 1 : '?';
        });

        if (confirm(`Task${taskNumbers.length > 1 ? 's' : ''} ${taskNumbers.join(', ')} ${taskNumbers.length > 1 ? 'have' : 'has'} no code. Submit anyway?`)) {
          // Continue with submission
        } else {
          setSubmitting(false);
          return;
        }
      }

      // Format the submission data
      const solutions_array = [];
      Object.entries(solutions).forEach(([taskId, code]) => {
        const task = tasks.find(t => t.id == taskId);
        solutions_array.push({
          taskId: parseInt(taskId),
          code: code,
          language: task?.language?.name || 'HTML'
        });
      });

      console.log("Submitting solution with data:", {
        userId,
        progProblemId: problem.id,
        solutions: solutions_array
      });

      // Display a message to the user that evaluation is in progress
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50';
      notification.innerHTML = `
        <div class="flex items-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Evaluating your code...</span>
        </div>
      `;
      document.body.appendChild(notification);

      // Submit the solutions for evaluation
      try {
        const response = await submitTaskSolution({
          userId: parseInt(userId),
          progProblemId: parseInt(problem.id),
          email : email,
          teamSessionId : sessionId,
          solutions: solutions_array
        });

        console.log("Solution submission successful:", response.data);

        // Remove notification
        document.body.removeChild(notification);

        setResult(response.data);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);

        // Save submission to history
        saveProgrammingSubmission(response.data);

        // Show confirmation message
        setFeedbackMessage("Submission successful! Check the History page to view your results.");
      } catch (submissionError) {
        console.error('Error submitting solutions:', submissionError);
        console.error('Error details:', submissionError.response?.data);

        // Remove notification
        document.body.removeChild(notification);

        // Show error notification
        const errorNotification = document.createElement('div');
        errorNotification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
        errorNotification.innerHTML = `
          <div class="flex items-center">
            <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <span>Error evaluating code: ${submissionError.message || 'Unknown error'}</span>
          </div>
        `;
        document.body.appendChild(errorNotification);

        // Remove error notification after 5 seconds
        setTimeout(() => {
          if (document.body.contains(errorNotification)) {
            document.body.removeChild(errorNotification);
          }
        }, 5000);

        // Try to create a mock result instead of failing completely
        const mockResult = {
          id: Date.now(),
          progProblemId: problem.id,
          userId: userId,
          score: 0,
          completedTasks: 0,
          totalTasks: tasks.length,
          evaluations: {},
          submission_date: new Date().toISOString(),
          error: "Server evaluation failed. Showing limited results."
        };

        tasks.forEach(task => {
          mockResult.evaluations[task.id] = {
            score: 0,
            feedback: "Could not evaluate solution due to server error.",
            strengths: ["Your solution was submitted"],
            weaknesses: ["Server evaluation failed", "Try again later"]
          };
        });

        setResult(mockResult);
      }

      setSubmitting(false);
    } catch (error) {
      console.error('Error in submission process:', error);
      setSubmitting(false);

      // Show error message to the user
      alert('An error occurred during submission. Please try again.');
    }
  };

  const goBack = () => {
    navigate('/home');
  };

  if (isLoading) {
    return (
      <>
        <div className="flex justify-center items-center h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-[#006674] border-t-transparent rounded-full"
          ></motion.div>
        </div>
      </>
    );
  }

  const currentTask = tasks[currentTaskIndex] || null;

  // If we have a result, show the results screen
  if (result) {
    return (
      <>
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={200}
          />
        )}
        <div className="container mx-auto p-4 pt-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6 max-w-5xl mx-auto"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2 text-gray-800">Submission Results</h1>
              <p className="text-gray-600">
                You've completed the programming challenge!
              </p>
              {result.error && (
                <div className="mt-2 p-2 bg-yellow-50 text-yellow-700 rounded-md">
                  <p className="font-medium">{result.error}</p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-[#e6f7fa] to-[#ebf9ff] border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-xl text-gray-800">{problem.title}</h2>
                  <p className="text-gray-600">
                    Completed {result.completedTasks || result.tasks_completed || result.completed || tasks.length} of {tasks.length} tasks
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-[#006674]">{result.totalScore || result.total_score || result.score || 0} points</div>
                  <div className="text-sm text-gray-500">Total Score</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {tasks.map((task, index) => {
                const evaluations = result.evaluations || result.taskEvaluations || result.task_evaluations || {};
                const taskResult = result.taskResults || result.task_results || [];

                let evaluation = evaluations[task.id];

                if (!evaluation && Array.isArray(taskResult)) {
                  const found = taskResult.find(tr => tr.taskId == task.id || tr.task_id == task.id);
                  if (found) {
                    evaluation = {
                      score: found.score || 0,
                      feedback: found.feedback || found.ai_feedback || "",
                      strengths: found.strengths || [],
                      weaknesses: found.weaknesses || []
                    };
                  }
                }

                if (!evaluation) {
                  evaluation = { score: 0, feedback: "No evaluation available", strengths: [], weaknesses: [] };
                }

                const scorePercentage = evaluation?.score / (task.points || 10) * 100 || 0;

                return (
                  <motion.div
                    key={task.id}
                    className="border rounded-lg overflow-hidden shadow-md"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className={`p-4 ${
                      scorePercentage >= 70
                        ? 'bg-green-50 border-b border-green-100'
                        : scorePercentage >= 40
                          ? 'bg-yellow-50 border-b border-yellow-100'
                          : 'bg-red-50 border-b border-red-100'
                    }`}>
                      <div className="flex justify-between">
                        <h3 className="font-semibold text-gray-800">
                          <span className="inline-block w-7 h-7 bg-gray-100 rounded-full text-center mr-2 text-sm leading-7">
                            {index + 1}
                          </span>
                          {task.title}
                        </h3>
                        <div className="font-semibold">
                          <span className={scorePercentage >= 70 ? 'text-green-600' : scorePercentage >= 40 ? 'text-yellow-600' : 'text-red-600'}>
                            {evaluation?.score || 0}
                          </span>/{task.points} points
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div
                          className={`h-1.5 rounded-full ${
                            scorePercentage >= 70
                              ? 'bg-green-500'
                              : scorePercentage >= 40
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${scorePercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="p-4">
                      <h4 className="font-semibold mb-2 text-gray-700">Feedback</h4>
                      <p className="mb-4 text-gray-600">{evaluation?.feedback || 'No feedback available'}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Strengths
                          </h4>
                          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                            {evaluation?.strengths?.length > 0
                              ? evaluation.strengths.map((strength, i) => (
                                  <li key={i}>{strength}</li>
                                ))
                              : <li>No specific strengths noted</li>
                            }
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-yellow-700 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Areas for Improvement
                          </h4>
                          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                            {evaluation?.weaknesses?.length > 0
                              ? evaluation.weaknesses.map((weakness, i) => (
                                  <li key={i}>{weakness}</li>
                                ))
                              : <li>No specific weaknesses noted</li>
                            }
                          </ul>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-semibold mb-2 text-gray-700 flex items-center">
                          <FaCode className="mr-1" /> Your Solution
                        </h4>
                        <pre className="bg-gray-100 p-3 rounded-lg text-sm overflow-auto max-h-40 text-gray-800 font-mono">
                          {solutions[task.id] || '// No solution submitted'}
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={goBack}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-700 flex items-center"
              >
                <FaArrowLeft className="mr-2" /> Return to Home
              </button>

              <button
                onClick={() => setResult(null)}
                className="px-4 py-2 bg-[#006674] text-white rounded hover:bg-[#00525d]"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="container mx-auto p-4 pt-28">
        <div className="flex items-center mb-6">
          <button
            onClick={goBack}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {problem?.title || 'Programming Problem'}
          </h1>
        </div>

        {currentTask && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Task {currentTaskIndex + 1}/{tasks.length}
                  </h2>

                  <div className={`flex items-center text-sm ${
                    timeLeft !== null && timeLeft < 60
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    <FaClock className="mr-1" /> {formatTime(timeLeft)}
                  </div>
                </div>

                <h3 className="text-lg font-medium text-[#006674] mb-3">{currentTask.title}</h3>

                <div className="prose max-w-none mb-6 text-gray-700">
                  <p>{currentTask.description}</p>
                </div>

                {showHint && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                    <h3 className="font-semibold flex items-center text-yellow-800">
                      <FaLightbulb className="text-yellow-500 mr-2" /> Hint
                    </h3>
                    <p className="text-yellow-700">Try breaking down the problem into smaller steps and test your solution with different inputs.</p>
                  </div>
                )}

                {showTestCase && currentTask.sampleTestCases?.length > 0 && (
                  <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                    <h3 className="font-semibold mb-2 text-gray-700">Sample Test Cases</h3>
                    <div className="space-y-3">
                      {currentTask.sampleTestCases.map((testCase, idx) => (
                        <div key={idx} className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Input:</div>
                            <pre className="bg-gray-100 p-2 rounded text-xs font-mono">{testCase.input}</pre>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700 mb-1">Expected Output:</div>
                            <pre className="bg-gray-100 p-2 rounded text-xs font-mono">{testCase.output}</pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={toggleHint}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200 flex items-center"
                  >
                    <FaLightbulb className="mr-1" />
                    {showHint ? 'Hide Hint' : 'Show Hint'}
                  </button>

                  {currentTask.sampleTestCases?.length > 0 && (
                    <button
                      onClick={toggleTestCase}
                      className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded text-sm hover:bg-indigo-200 flex items-center"
                    >
                      <FaInfoCircle className="mr-1" />
                      {showTestCase ? 'Hide Test Cases' : 'Show Test Cases'}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={goToPreviousTask}
                  disabled={currentTaskIndex === 0}
                  className={`px-4 py-2 rounded flex items-center gap-1 ${
                    currentTaskIndex === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous Task
                </button>

                <button
                  onClick={handleNextTask}
                  className={`px-4 py-2 rounded flex items-center gap-1 ${
                    currentTaskIndex === tasks.length - 1
                      ? 'bg-[#006674] hover:bg-[#00525d] text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {currentTaskIndex === tasks.length - 1 ? (
                    <>
                      Submit All
                      <FaCheck className="ml-1" />
                    </>
                  ) : (
                    <>
                      Next Task
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CodeEditor
                value={solutions[currentTask.id] || ''}
                onChange={handleCodeChange}
                language={currentTask.language}
              />

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 ${
                    submitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <FaCheck /> {submitting ? 'Submitting...' : 'Submit All Solutions'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Feedback Message */}
        {feedbackMessage && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg flex items-center justify-between">
            <span>{feedbackMessage}</span>
            <button
              onClick={() => setFeedbackMessage('')}
              className="text-green-700 hover:text-green-900"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default SolveProblem;