import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiFileText, FiZap, FiCheck, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';
import AuthLayout from '../Layout/AuthLayout';

export default function CVTestGenerator() {
    const [usersWithCV, setUsersWithCV] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUsersWithCV();
    }, []);

    const fetchUsersWithCV = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/mixed-test-actions/users-with-cv');
            if (response.data.success) {
                setUsersWithCV(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching users with CV:', error);
            setError('Failed to fetch users with CV');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateTest = async () => {
        if (!selectedUser) {
            setError('Please select a user first');
            return;
        }

        try {
            setGenerating(true);
            setError(null);
            setSuccess(null);

            const response = await api.post('/api/mixed-test-actions/generate-from-cv', {
                user_id: selectedUser.id
            });

            if (response.data.success) {
                setSuccess({
                    message: `Test generated and assigned successfully to ${selectedUser.username}`,
                    data: response.data.data
                });
                setSelectedUser(null);
                // Reset form
            }
        } catch (error) {
            console.error('Error generating test:', error);
            console.error('Error response data:', error.response?.data);
            console.error('Error response status:', error.response?.status);
            setError(error.response?.data?.error || error.response?.data?.message || 'Failed to generate test');
        } finally {
            setGenerating(false);
        }
    };

    const getUserProfileSummary = (user) => {
        const profile = user.profile_attributes || {};
        const skills = profile.skills || [];
        const experience = profile.experience || 'Not specified';
        const role = profile.role || 'Developer';

        return {
            skills: skills.slice(0, 3).join(', '),
            experience,
            role
        };
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

    return (
        <AuthLayout>
            <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">CV-Based Test Generator</h1>
                        <p className="text-gray-600">Generate personalized mixed tests based on user CVs</p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
                        >
                            <div className="flex items-center gap-3">
                                <FiCheck className="w-5 h-5 text-green-600" />
                                <div>
                                    <h3 className="text-sm font-medium text-green-800">Success!</h3>
                                    <p className="text-sm text-green-700 mt-1">{success.message}</p>
                                    {success.data && (
                                        <div className="mt-2 text-xs text-green-600">
                                            <p>Test ID: {success.data.mixed_test_id}</p>
                                            <p>Questions: {success.data.questions_count} | Tasks: {success.data.tasks_count}</p>
                                            <p>Difficulty: {success.data.difficulty} | Points: {success.data.points_total}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
                        >
                            <div className="flex items-center gap-3">
                                <FiAlertCircle className="w-5 h-5 text-red-600" />
                                <div>
                                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                                    <p className="text-sm text-red-700 mt-1">{error}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Main Content */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Select User with CV</h2>
                            <p className="text-gray-600 text-sm">
                                Choose a user who has uploaded their CV to generate a personalized mixed test
                            </p>
                        </div>

                        {usersWithCV.length === 0 ? (
                            <div className="text-center py-8">
                                <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Users with CV</h3>
                                <p className="text-gray-600">
                                    No users have uploaded their CV yet. Users need to upload their CV to generate personalized tests.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {usersWithCV.map((user) => {
                                    const profile = getUserProfileSummary(user);
                                    return (
                                        <motion.div
                                            key={user.id}
                                            whileHover={{ scale: 1.02 }}
                                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                                selectedUser?.id === user.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => setSelectedUser(user)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-blue-100 p-3 rounded-full">
                                                        <FiUser className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{user.username}</h3>
                                                        <p className="text-sm text-gray-600">{user.email}</p>
                                                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <FiFileText className="w-3 h-3" />
                                                                CV uploaded
                                                            </span>
                                                            <span>Role: {profile.role}</span>
                                                            <span>Experience: {profile.experience}</span>
                                                        </div>
                                                        {profile.skills && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Skills: {profile.skills}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {selectedUser?.id === user.id && (
                                                        <div className="bg-blue-500 text-white p-1 rounded-full">
                                                            <FiCheck className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Generate Button */}
                        {selectedUser && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 pt-6 border-t border-gray-200"
                            >
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                        Generate Test for {selectedUser.username}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-4">
                                        This will create a personalized mixed test based on the user's CV and automatically assign it to them.
                                    </p>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleGenerateTest}
                                        disabled={generating}
                                        className={`px-8 py-3 rounded-lg font-semibold flex items-center gap-2 mx-auto ${
                                            generating
                                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                    >
                                        {generating ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                                Generating Test...
                                            </>
                                        ) : (
                                            <>
                                                <FiZap className="w-5 h-5" />
                                                Generate & Assign Test
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* How it Works */}
                    <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">How It Works</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                                    <FiUser className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800 mb-2">1. CV Analysis</h3>
                                <p className="text-sm text-gray-600">
                                    The AI analyzes the user's CV to understand their skills, experience, and background.
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                                    <FiZap className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800 mb-2">2. Test Generation</h3>
                                <p className="text-sm text-gray-600">
                                    Creates personalized questions and programming tasks based on the CV analysis.
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                                    <FiCheck className="w-8 h-8 text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800 mb-2">3. Auto Assignment</h3>
                                <p className="text-sm text-gray-600">
                                    Automatically assigns the generated test to the user for immediate access.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
} 