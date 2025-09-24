import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiUsers, FiAward, FiClock, FiBarChart2 } from 'react-icons/fi';
import api from '../services/api';
import AuthLayout from '../Layout/AuthLayout';

export default function MixedTestResults() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/mixed-test-actions/results');
            if (response.data.success) {
                setResults(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching results:', error);
            setError('Failed to load test results');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'passed':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'easy':
                return 'bg-green-100 text-green-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'hard':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
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

    if (error) {
        return (
            <AuthLayout>
                <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] p-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center py-12">
                            <FiX className="w-16 h-16 text-red-400 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-900 mb-2">Error Loading Results</h3>
                            <p className="text-gray-600">{error}</p>
                        </div>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mixed Test Results</h1>
                        <p className="text-gray-600">View all CV-Based Test results and performance (BE CAREFUL EVALUATING TASKS)</p>
                    </div>

                    {results.length === 0 ? (
                        <div className="text-center py-12">
                            <FiBarChart2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-900 mb-2">No Results Yet</h3>
                            <p className="text-gray-600">
                                No test results have been submitted yet. Results will appear here once users complete their tests.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Test
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Score
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Quiz Section
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Task Section
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {results.map((result) => (
                                            <motion.tr
                                                key={result.submission_id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                                                <span className="text-white font-medium">
                                                                    {result.user.username.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {result.user.username}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {result.user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {result.test.title}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(result.test.difficulty)}`}>
                                                                {result.test.difficulty}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {result.test.points_total} pts
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {result.score.total_score}/{result.score.max_score}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{result.score.percentage}%</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {result.quiz_section.correct_answers}/{result.quiz_section.total_questions}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{result.quiz_section.accuracy}% accuracy</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {result.task_section.tasks_completed}/{result.task_section.tasks_attempted}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{result.task_section.completion_rate}% completion</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(result.score.passed ? 'passed' : 'failed')}`}>
                                                        {result.score.passed ? (
                                                            <>
                                                                <FiCheck className="w-3 h-3 mr-1" />
                                                                PASSED
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FiX className="w-3 h-3 mr-1" />
                                                                FAILED
                                                            </>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {Math.round(result.time_taken / 60)}m
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center">
                                                        <FiClock className="w-4 h-4 mr-1" />
                                                        {new Date(result.submission_date).toLocaleDateString()}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthLayout>
    );
} 