import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiPause, FiCheck, FiCode, FiFileText, FiClock, FiAward } from 'react-icons/fi';
import api from '../services/api';
import AuthLayout from '../Layout/AuthLayout';

export default function PlayMixedTest() {
    const [assignedTests, setAssignedTests] = useState([]);
    const [selectedTest, setSelectedTest] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [taskSolutions, setTaskSolutions] = useState({});
    const [loading, setLoading] = useState(true);
    const [testStarted, setTestStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState(null);

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchAssignedTests();
    }, []);

    useEffect(() => {
        let timer;
        if (testStarted && timeLeft > 0 && !isPaused) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleSubmitTest();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [testStarted, timeLeft, isPaused]);

    const fetchAssignedTests = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/mixed-test-actions/user/${user.id}/assigned`);
            console.log('Assigned tests response:', response.data);
            if (response.data.success) {
                console.log('All assigned tests:', response.data.data);
                // Filter out completed tests (remove from playable, mark as finished)
                const playableTests = response.data.data.filter(test => {
                    console.log(`Test ID ${test.id}: status = ${test.status}`);
                    return test.status !== 'completed' && test.status !== 'failed';
                });
                console.log('Playable tests after filtering:', playableTests);
                setAssignedTests(playableTests);
            }
        } catch (error) {
            console.error('Error fetching assigned tests:', error);
        } finally {
            setLoading(false);
        }
    };

    const startTest = async (test) => {
        try {
            console.log('Starting test:', test);
            setSelectedTest(test);
            setTestStarted(true);
            setTimeLeft(test.time_limit || 3600); // Default 1 hour
            setCurrentQuestionIndex(0);
            setCurrentTaskIndex(0);
            setAnswers({});
            setTaskSolutions({});
            setIsPaused(false);
        } catch (error) {
            console.error('Error starting test:', error);
        }
    };

    const handleAnswerChange = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleTaskSolutionChange = (taskId, solution) => {
        setTaskSolutions(prev => ({
            ...prev,
            [taskId]: solution
        }));
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < selectedTest.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const nextTask = () => {
        if (currentTaskIndex < selectedTest.tasks.length - 1) {
            setCurrentTaskIndex(prev => prev + 1);
        }
    };

    const prevTask = () => {
        if (currentTaskIndex > 0) {
            setCurrentTaskIndex(prev => prev - 1);
        }
    };

    const handleSubmitTest = async () => {
        try {
            const submissionData = {
                test_id: selectedTest.id,
                user_id: user.id,
                answers: answers,
                task_solutions: taskSolutions,
                time_taken: (selectedTest.time_limit || 3600) - timeLeft
            };

            console.log('Submitting test with data:', submissionData);
            console.log('Answers:', answers);
            console.log('Task solutions:', taskSolutions);

            const response = await api.post('/api/mixed-test-actions/submit', submissionData);
            console.log('Submission response:', response.data);
            
            if (response.data.success) {
                setResults(response.data.data);
                setShowResults(true);
                setTestStarted(false);
                console.log('Test results saved:', response.data.data);
                
                // Refresh the assigned tests list to remove completed test
                await fetchAssignedTests();
            }
        } catch (error) {
            console.error('Error submitting test:', error);
            console.error('Error details:', error.response?.data);
        }
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getProgressPercentage = () => {
        const totalItems = (selectedTest?.questions?.length || 0) + (selectedTest?.tasks?.length || 0);
        const completedItems = Object.keys(answers).length + Object.keys(taskSolutions).length;
        return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    };

    if (loading) {
        return (
            <AuthLayout>
                <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] p-6">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    if (showResults && results) {
        return (
            <AuthLayout>
                <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                            <div className="mb-6">
                                <FiAward className="w-16 h-16 text-green-600 mx-auto mb-4" />
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">Test Completed!</h1>
                                <p className="text-gray-600">You have successfully completed the mixed test</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-blue-800 mb-2">Score</h3>
                                    <p className="text-2xl font-bold text-blue-600">{results.total_score}/{results.max_score}</p>
                                    <p className="text-sm text-blue-600">{results.percentage}%</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-green-800 mb-2">Questions Correct</h3>
                                    <p className="text-2xl font-bold text-green-600">{results.correct_answers}/{results.total_questions}</p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-purple-800 mb-2">Tasks Completed</h3>
                                    <p className="text-2xl font-bold text-purple-600">{results.tasks_completed}/{results.tasks_attempted}</p>
                                </div>
                                <div className={`rounded-lg p-4 ${results.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <h3 className={`font-semibold mb-2 ${results.passed ? 'text-green-800' : 'text-red-800'}`}>Status</h3>
                                    <p className={`text-2xl font-bold ${results.passed ? 'text-green-600' : 'text-red-600'}`}>
                                        {results.passed ? 'PASSED' : 'FAILED'}
                                    </p>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setShowResults(false);
                                    setSelectedTest(null);
                                    setResults(null);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
                            >
                                Back to Tests
                            </motion.button>
                        </div>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    if (showResults && results) {
        return (
            <AuthLayout>
                <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">Test Results</h1>
                                <p className="text-gray-600">Your CV-Based Test Results</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-blue-50 p-6 rounded-lg">
                                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Score</h3>
                                    <div className="text-3xl font-bold text-blue-600">{results.total_score}/{results.max_score}</div>
                                    <div className="text-sm text-blue-600">{results.percentage}%</div>
                                </div>

                                <div className={`p-6 rounded-lg ${results.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <h3 className={`text-lg font-semibold mb-2 ${results.passed ? 'text-green-800' : 'text-red-800'}`}>Status</h3>
                                    <div className={`text-2xl font-bold ${results.passed ? 'text-green-600' : 'text-red-600'}`}>
                                        {results.passed ? 'PASSED' : 'FAILED'}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-800">{results.correct_answers}</div>
                                    <div className="text-sm text-gray-600">Correct Answers</div>
                                    <div className="text-xs text-gray-500">{results.total_questions} total</div>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-800">{results.tasks_completed}</div>
                                    <div className="text-sm text-gray-600">Tasks Completed</div>
                                    <div className="text-xs text-gray-500">{results.tasks_attempted} attempted</div>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-800">{Math.round(results.time_taken / 60)}</div>
                                    <div className="text-sm text-gray-600">Minutes Taken</div>
                                    <div className="text-xs text-gray-500">Time used</div>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-800">{results.submission_id}</div>
                                    <div className="text-sm text-gray-600">Submission ID</div>
                                    <div className="text-xs text-gray-500">Reference</div>
                                </div>
                            </div>

                            <div className="text-center">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setShowResults(false);
                                        setSelectedTest(null);
                                        setTestStarted(false);
                                        setResults(null);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold"
                                >
                                    Back to Tests
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    if (testStarted && selectedTest) {
        console.log('Rendering test:', selectedTest);
        console.log('Questions:', selectedTest.questions);
        console.log('Tasks:', selectedTest.tasks);
        console.log('currentQuestionIndex:', currentQuestionIndex);
        console.log('currentTaskIndex:', currentTaskIndex);
        const currentQuestion = selectedTest.questions?.[currentQuestionIndex];
        const currentTask = selectedTest.tasks?.[currentTaskIndex];
        const isQuestionSection = currentQuestionIndex < (selectedTest.questions?.length || 0);
        console.log('isQuestionSection:', isQuestionSection);
        console.log('currentTask:', currentTask);

        return (
            <AuthLayout>
                <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] p-6">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">{selectedTest.title}</h1>
                                    <p className="text-gray-600">{selectedTest.description}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <FiClock className="w-5 h-5 text-red-500" />
                                        <span className="font-mono text-lg font-bold text-red-600">
                                            {formatTime(timeLeft)}
                                        </span>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setIsPaused(!isPaused)}
                                        className={`px-4 py-2 rounded-lg font-semibold ${
                                            isPaused
                                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                        }`}
                                    >
                                        {isPaused ? <FiPlay className="w-4 h-4" /> : <FiPause className="w-4 h-4" />}
                                    </motion.button>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>Progress: {Math.round(getProgressPercentage())}%</span>
                                    <span>
                                        {isQuestionSection ? 'Questions' : 'Tasks'} - {isQuestionSection ? currentQuestionIndex + 1 : currentTaskIndex + 1} of {isQuestionSection ? selectedTest.questions?.length : selectedTest.tasks?.length}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${getProgressPercentage()}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Question Section */}
                        {isQuestionSection && currentQuestion && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <FiFileText className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-600">Question {currentQuestionIndex + 1}</span>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">{currentQuestion.question}</h3>
                                    
                                    <div className="space-y-3">
                                        {currentQuestion.options?.map((option, index) => (
                                            <label key={index} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={`question-${currentQuestion.id}`}
                                                    value={option}
                                                    checked={answers[currentQuestion.id] === option}
                                                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                                    className="mr-3"
                                                />
                                                <span className="text-gray-800">{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={prevQuestion}
                                        disabled={currentQuestionIndex === 0}
                                        className={`px-4 py-2 rounded-lg font-semibold ${
                                            currentQuestionIndex === 0
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-gray-600 hover:bg-gray-700 text-white'
                                        }`}
                                    >
                                        Previous
                                    </motion.button>

                                    {currentQuestionIndex === (selectedTest.questions?.length || 0) - 1 ? (
                                        selectedTest.tasks && selectedTest.tasks.length > 0 ? (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    console.log('Start Tasks clicked!');
                                                    console.log('Current tasks:', selectedTest.tasks);
                                                    setCurrentTaskIndex(0);
                                                    setCurrentQuestionIndex(selectedTest.questions.length); // This will make isQuestionSection false
                                                    console.log('Set currentTaskIndex to 0 and currentQuestionIndex to', selectedTest.questions.length);
                                                }}
                                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
                                            >
                                                Start Tasks
                                            </motion.button>
                                        ) : (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleSubmitTest}
                                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
                                            >
                                                Submit Test
                                            </motion.button>
                                        )
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={nextQuestion}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                                        >
                                            Next
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Task Section */}
                        {(() => {
                            console.log('Task section condition check:');
                            console.log('!isQuestionSection:', !isQuestionSection);
                            console.log('currentTask:', currentTask);
                            console.log('selectedTest.tasks:', selectedTest.tasks);
                            console.log('selectedTest.tasks.length > 0:', selectedTest.tasks && selectedTest.tasks.length > 0);
                            return !isQuestionSection && currentTask && selectedTest.tasks && selectedTest.tasks.length > 0;
                        })() && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <FiCode className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-medium text-green-600">Task {currentTaskIndex + 1}</span>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{currentTask.title}</h3>
                                    <p className="text-gray-600 mb-4">{currentTask.description}</p>
                                    
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-gray-800 mb-2">Sample Test Cases:</h4>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <pre className="text-sm text-gray-700">{JSON.stringify(currentTask.sample_test_cases, null, 2)}</pre>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Your Solution:
                                        </label>
                                        <textarea
                                            value={taskSolutions[currentTask.id] || ''}
                                            onChange={(e) => handleTaskSolutionChange(currentTask.id, e.target.value)}
                                            className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                            placeholder="Write your code solution here..."
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={prevTask}
                                        disabled={currentTaskIndex === 0}
                                        className={`px-4 py-2 rounded-lg font-semibold ${
                                            currentTaskIndex === 0
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-gray-600 hover:bg-gray-700 text-white'
                                        }`}
                                    >
                                        Previous
                                    </motion.button>

                                    {currentTaskIndex === (selectedTest.tasks?.length || 0) - 1 ? (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleSubmitTest}
                                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
                                        >
                                            Submit Test
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={nextTask}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                                        >
                                            Next
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">My CV-Based Tests</h1>
                        <p className="text-gray-600">Take your assigned CV-Based Tests with questions and programming tasks</p>
                    </div>

                    {assignedTests.length === 0 ? (
                        <div className="text-center py-12">
                            <FiCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-900 mb-2">No Tests Assigned</h3>
                            <p className="text-gray-600">
                                You don't have any CV-Based Tests assigned yet. Contact your administrator to get assigned tests.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {assignedTests.map((test) => (
                                <motion.div
                                    key={test.id}
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <FiCode className="w-5 h-5 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-600 capitalize">
                                                {test.test_type}
                                            </span>
                                        </div>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            test.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                            test.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {test.difficulty}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{test.title}</h3>
                                    <p className="text-gray-600 text-sm mb-4">{test.description}</p>

                                    <div className="space-y-2 mb-6">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Questions:</span>
                                            <span className="font-semibold">{test.question_count}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Tasks:</span>
                                            <span className="font-semibold">{test.task_count}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Points:</span>
                                            <span className="font-semibold">{test.points_total}</span>
                                        </div>
                                        {test.primary_language && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Language:</span>
                                                <span className="font-semibold">{test.primary_language.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => startTest(test)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
                                    >
                                        <FiPlay className="w-4 h-4" />
                                        Start Test
                                    </motion.button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthLayout>
    );
} 