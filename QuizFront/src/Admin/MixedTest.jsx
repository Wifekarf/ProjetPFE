import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiUsers, FiCode, FiFileText } from 'react-icons/fi';
import api from '../services/api';
import AuthLayout from '../Layout/AuthLayout';

export default function MixedTest() {
    const [mixedTests, setMixedTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedTest, setSelectedTest] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        difficulty: 'medium',
        points_total: 0,
        test_type: 'mixed',
        nb_questions: 0,
        nb_tasks: 0,
        primary_language_id: null
    });

    useEffect(() => {
        fetchMixedTests();
    }, []);

    const fetchMixedTests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/mixed-tests');
            if (response.data.success) {
                setMixedTests(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching mixed tests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/mixed-tests/create', formData);
            if (response.data.success) {
                setShowCreateModal(false);
                setFormData({
                    title: '',
                    description: '',
                    difficulty: 'medium',
                    points_total: 0,
                    test_type: 'mixed',
                    nb_questions: 0,
                    nb_tasks: 0,
                    primary_language_id: null
                });
                fetchMixedTests();
            }
        } catch (error) {
            console.error('Error creating mixed test:', error);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put(`/api/mixed-tests/${selectedTest.id}`, formData);
            if (response.data.success) {
                setShowEditModal(false);
                setSelectedTest(null);
                fetchMixedTests();
            }
        } catch (error) {
            console.error('Error updating mixed test:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this mixed test?')) {
            try {
                const response = await api.delete(`/api/mixed-tests/${id}`);
                if (response.data.success) {
                    fetchMixedTests();
                }
            } catch (error) {
                console.error('Error deleting mixed test:', error);
            }
        }
    };

    const openEditModal = (test) => {
        setSelectedTest(test);
        setFormData({
            title: test.title,
            description: test.description,
            difficulty: test.difficulty,
            points_total: test.points_total,
            test_type: test.test_type,
            nb_questions: test.nb_questions,
            nb_tasks: test.nb_tasks,
            primary_language_id: test.primary_language?.id
        });
        setShowEditModal(true);
    };

    const openAssignModal = (test) => {
        setSelectedTest(test);
        setShowAssignModal(true);
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'hard': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTestTypeIcon = (testType) => {
        switch (testType) {
            case 'mixed': return <FiCode className="w-4 h-4" />;
            case 'quiz': return <FiFileText className="w-4 h-4" />;
            case 'programming': return <FiCode className="w-4 h-4" />;
            default: return <FiCode className="w-4 h-4" />;
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

    return (
        <AuthLayout>
            <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Mixed Tests</h1>
                            <p className="text-gray-600 mt-2">Manage mixed tests with questions and programming tasks</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold"
                        >
                            <FiPlus className="w-5 h-5" />
                            Create Mixed Test
                        </motion.button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Tests</p>
                                    <p className="text-2xl font-bold text-gray-900">{mixedTests.length}</p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <FiCode className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Mixed Tests</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {mixedTests.filter(t => t.test_type === 'mixed').length}
                                    </p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-full">
                                    <FiCode className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Quiz Tests</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {mixedTests.filter(t => t.test_type === 'quiz').length}
                                    </p>
                                </div>
                                <div className="bg-yellow-100 p-3 rounded-full">
                                    <FiFileText className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Programming Tests</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {mixedTests.filter(t => t.test_type === 'programming').length}
                                    </p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-full">
                                    <FiCode className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mixed Tests Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">All Mixed Tests</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Test
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Difficulty
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Content
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Points
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {mixedTests.map((test) => (
                                        <motion.tr
                                            key={test.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {test.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {test.description.substring(0, 50)}...
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {getTestTypeIcon(test.test_type)}
                                                    <span className="text-sm text-gray-900 capitalize">
                                                        {test.test_type}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(test.difficulty)}`}>
                                                    {test.difficulty}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex items-center gap-4">
                                                    <span className="flex items-center gap-1">
                                                        <FiFileText className="w-4 h-4 text-blue-500" />
                                                        {test.question_count || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <FiCode className="w-4 h-4 text-green-500" />
                                                        {test.task_count || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {test.points_total}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => openAssignModal(test)}
                                                        className="text-blue-600 hover:text-blue-900 p-1"
                                                        title="Assign to Users"
                                                    >
                                                        <FiUsers className="w-4 h-4" />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => openEditModal(test)}
                                                        className="text-indigo-600 hover:text-indigo-900 p-1"
                                                        title="Edit"
                                                    >
                                                        <FiEdit className="w-4 h-4" />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleDelete(test.id)}
                                                        className="text-red-600 hover:text-red-900 p-1"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4">Create Mixed Test</h3>
                            <form onSubmit={handleCreate}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Title
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows="3"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Difficulty
                                            </label>
                                            <select
                                                value={formData.difficulty}
                                                onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="easy">Easy</option>
                                                <option value="medium">Medium</option>
                                                <option value="hard">Hard</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Points Total
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.points_total}
                                                onChange={(e) => setFormData({...formData, points_total: parseInt(e.target.value)})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {showEditModal && selectedTest && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4">Edit Mixed Test</h3>
                            <form onSubmit={handleEdit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Title
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows="3"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Difficulty
                                            </label>
                                            <select
                                                value={formData.difficulty}
                                                onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="easy">Easy</option>
                                                <option value="medium">Medium</option>
                                                <option value="hard">Hard</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Points Total
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.points_total}
                                                onChange={(e) => setFormData({...formData, points_total: parseInt(e.target.value)})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Update
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthLayout>
    );
} 