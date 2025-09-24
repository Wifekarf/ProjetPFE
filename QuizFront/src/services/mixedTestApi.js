import api from './api';

export const mixedTestApi = {
    // Get all mixed tests
    getAll: () => api.get('/api/mixed-tests'),
    
    // Get specific mixed test
    getById: (id) => api.get(`/api/mixed-tests/${id}`),
    
    // Create new mixed test
    create: (data) => api.post('/api/mixed-tests/create', data),
    
    // Update mixed test
    update: (id, data) => api.put(`/api/mixed-tests/${id}`, data),
    
    // Delete mixed test
    delete: (id) => api.delete(`/api/mixed-tests/${id}`),
    
    // Assign questions to mixed test
    assignQuestions: (id, questionIds) => api.post(`/api/mixed-tests/${id}/assign-questions`, { question_ids: questionIds }),
    
    // Assign tasks to mixed test
    assignTasks: (id, taskIds) => api.post(`/api/mixed-tests/${id}/assign-tasks`, { task_ids: taskIds }),
    
    // Assign users to mixed test
    assignUsers: (id, userIds) => api.post(`/api/mixed-tests/${id}/assign-users`, { user_ids: userIds }),
    
    // Admin functions
    generateFromCV: (userId) => api.post('/api/mixed-test-actions/generate-from-cv', { user_id: userId }),
    
    // Get users with CV for admin
    getUsersWithCV: () => api.get('/api/mixed-test-actions/users-with-cv'),
    
    // Get user's assigned tests
    getUserAssignedTests: (userId) => api.get(`/api/mixed-test-actions/user/${userId}/assigned`),
    
    // Update assignment status
    updateAssignmentStatus: (assignmentId, status, nombrePassed) => 
        api.put(`/api/mixed-test-actions/assignment/${assignmentId}/status`, { status, nombre_passed: nombrePassed }),
    
    // Submit mixed test
    submitMixedTest: (assignmentId, answers, codeSolutions) => 
        api.post('/api/mixed-test-actions/submit', {
            assignment_id: assignmentId,
            answers: answers,
            code_solutions: codeSolutions
        })
}; 