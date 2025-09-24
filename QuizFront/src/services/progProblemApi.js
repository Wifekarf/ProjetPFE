import api from './api';
import { saveProgrammingSubmission } from './historyService';

export const getProgProblems = () => {
  return api.get('/api/prog-problems/');
};

export const getProgProblem = (id) => {
  return api.get(`/api/prog-problems/${id}`);
};

export const createProgProblem = (data) => {
  return api.post('/api/prog-problems', data);
};

export const updateProgProblem = (id, data) => {
  return api.put(`/api/prog-problems/${id}`, data);
};

export const deleteProgProblem = (id) => {
  return api.delete(`/api/prog-problems/${id}`);
};

export const shareProgProblem = (data) => {
  return api.post('/api/prog-problems/share-problem', data);
};

export const verifyProgProblemCode = async (code) => {
  try {
    console.log(`Verifying problem code: ${code}`);
    
    // If the code looks like a number, try getting the problem directly first
    if (!isNaN(parseInt(code))) {
      try {
        console.log('Code looks like a number, trying direct problem fetch first');
        const directResponse = await getProgProblem(parseInt(code));
        console.log('Got problem directly by ID:', directResponse.data);
        return { data: { id: parseInt(code) } };
      } catch (directError) {
        console.error('Failed to get problem directly, falling back to verification endpoints:', directError);
      }
    }
    
    // Try multiple endpoint formats
    try {
      // Try original endpoint first
      const response = await api.post('/api/prog-problems/verify-code', { code });
      console.log('Verify code response from original endpoint:', response.data);
      return response;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('Original verify endpoint not found, trying alternative...');
        
        // Try alternative endpoint formats
        try {
          const altResponse = await api.post('/prog-actions/verify-problem-code', { code });
          console.log('Verify code response from alternative endpoint:', altResponse.data);
          return altResponse;
        } catch (altError) {
          console.error('Alternative verify endpoint also failed:', altError);
          
          throw new Error('Could not verify problem code');
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Error verifying problem code:', error);
    throw error;
  }
};

export const getProgProblemTasks = (problemId) => {
  return api.get(`/api/prog-problems/${problemId}/tasks`);
};

// Task related endpoints
export const getTasks = () => {
  return api.get('/api/tasks/');
};

export const getTask = (id) => {
  return api.get(`/api/tasks/${id}`);
};

export const createTask = async (problemId, data) => {
  try {
    console.log('Creating task with data:', data);
    
    // If problemId is provided, create task and associate with problem
    if (problemId) {
      return await api.post(`/api/prog-problems/${problemId}/tasks`, data);
    }
    // Otherwise, create standalone task
    return await api.post('/api/tasks/create', data);
  } catch (error) {
    console.error('Error creating task:', error.response?.data || error.message);
    throw error;
  }
};

export const updateTask = (problemId, taskId, data) => {
  // If problemId is provided, update task within problem context
  if (problemId) {
    return api.put(`/api/prog-problems/${problemId}/tasks/${taskId}`, data);
  }
  // Otherwise, update standalone task
  return api.put(`/api/tasks/${taskId}`, data);
};

export const deleteTask = (problemId, taskId) => {
  // If problemId is provided, delete task within problem context
  if (problemId) {
    return api.delete(`/api/prog-problems/${problemId}/tasks/${taskId}`);
  }
  // Otherwise, delete standalone task
  return api.delete(`/api/tasks/${taskId}`);
};

// ProgActions related endpoints
export const assignTasksToProgProblem = (data) => {
  return api.post('/prog-actions/assign-tasks-to-problem', data);
};

export const unassignTaskFromProgProblem = (problemId, taskId) => {
  return api.post(`/prog-actions/unassign-task-from-problem/${problemId}/${taskId}`);
};

export const assignProgProblemToUser = (data) => {
  return api.post('/prog-actions/assign-problem', data);
};

export const unassignProgProblemFromUser = (data) => {
  return api.post('/prog-actions/unassign-problem', data);
};

// export const startProgProblem = (data) => {
//   return api.post('/prog-actions/start-problem', data);
// };
export const startProgProblem = ({
  progProblemId,
  userId = null,
  email  = null        // 👈 new
}) => {
  if (!progProblemId) throw new Error('progProblemId is required');

  const body = { progProblemId };
  if (userId) body.userId = userId;   // logged‑in
  if (email)  body.email  = email;    // guest

  return api.post('/prog-actions/start-problem', body);
};


export const getAffectedProgProblemsByUser = (userId) => {
  return api.post('/prog-actions/get-affected-problems-by-user', { userId });
};

export const submitSolution = async (data) => {
  try {
    console.log('Submitting solution with data:', data);
    
    // Map to the same structure used in the Quiz system
    const submissionData = {
      userId: data.userId,
      progProblemId: data.progProblemId,
      solutions: data.solutions || []
    };
    
    // Try first endpoint format
    try {
      const response = await api.post('/api/submissions/prog-problem', submissionData);
      return response;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('First endpoint not found, trying alternative...');
        // Try second endpoint format if first fails with 404
        const response = await api.post('/prog-actions/evaluate-solutions', submissionData);
        return response;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error submitting solution:', error);
    throw error;
  }
};

export const getUserProgProblemHistory = async (userId) => {
  try {
    console.log("Fetching programming problem history for user:", userId);
    
    // Try main backend endpoint
    try {
      const response = await api.post('/prog-actions/get-user-problem-history', { userId });
      console.log("Successfully fetched history from backend");
      return response;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('First history endpoint not found, trying alternative...');
        
        // Try alternative endpoint as fallback
        const altResponse = await api.get(`/api/submissions/user/${userId}/prog-problems`);
        console.log("Successfully fetched history from alternative endpoint");
        return altResponse;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching programming problem history:', error);
    throw error;
  }
};

// Problem Tasks endpoints
export const getProblemTasks = (problemId) => {
  return api.get(`/prog-actions/problem-tasks/${problemId}`);
};

export const getAssignedUsers = (problemId) => {
  return api.get(`/api/prog-problems/${problemId}/assigned-users`);
};

// New endpoints for enhanced functionality
export const getUserProgrammingStats = (userId) => {
  return api.post('/prog-actions/user-programming-stats', { userId });
};

export const getProgrammingProblemDetails = (problemId, userId) => {
  return api.get(`/api/prog-problems/${problemId}/details?userId=${userId}`);
};

// export const submitTaskSolution = async (data) => {
//   try {
//     console.log('Submitting task solution with data:', data);
    
//     // if (!data.userId || !data.progProblemId) {
//     //   throw new Error('Missing required fields: userId and progProblemId are required');
//     // }
//      if (!data.progProblemId) {
//    throw new Error('progProblemId is required');
//  }
//  if (!data.userId && !data.email) {
//    throw new Error('Either userId or email is required');
//  }
//     if (!data.solutions || !Array.isArray(data.solutions) || data.solutions.length === 0) {
//       throw new Error('Solutions array is required and cannot be empty');
//     }

//     // Prepare solutions for submission - remove any evaluation that might have been added
//     const cleanSolutions = data.solutions.map(solution => ({
//       taskId: solution.taskId,
//       code: solution.code,
//       language: solution.language
//     }));
    
//     // Prepare request payload
//   const submissionData = {
//    progProblemId: data.progProblemId,
//    solutions: cleanSolutions
//  };
//  if (data.userId) submissionData.userId = data.userId;
//  if (data.email)  submissionData.email  = data.email;
//  if (data.codeSubmissions) submissionData.codeSubmissions = data.codeSubmissions;
//    // ----------------------------------------
//   // Decide which endpoint to hit
//   // - Logged‑in user (has userId)   → /evaluate-solutions
//   // - Guest (email only)            → /submit-solution
//   // ----------------------------------------
//   const mainEndpoint  = data.userId ? '/prog-actions/evaluate-solutions'
//                                     : '/prog-actions/submit-solution';
    
//     console.log("Submitting solutions to backend for evaluation:", {
//       userId: submissionData.userId,
//       progProblemId: submissionData.progProblemId,
//       solutionsCount: submissionData.solutions.length
//     });
    
//     try {
//       // Use our new dedicated endpoint
//       const response = await api.post(mainEndpoint, submissionData);
//       console.log("Backend submission successful:", response.data);
      
//       // Add fields needed for history
//       const problemTitle = await fetchProblemTitle(data.progProblemId);
//       const normalizedData = {
//         ...response.data,
//         title: problemTitle || `Problem ${data.progProblemId}`,
//         date_submission: response.data.submission_date || new Date().toISOString(),
//         // Map the data structure to match history format if needed
//         taskResults: Object.entries(response.data.evaluations || {}).map(([taskId, evaluation]) => ({
//           taskId: parseInt(taskId),
//           passed: evaluation.passed || false,
//           score: evaluation.score || 0,
//           feedback: evaluation.feedback || "",
//           code: cleanSolutions.find(s => s.taskId == taskId)?.code || ""
//         }))
//       };
      
//       // Save to history service
//       saveProgrammingSubmission(normalizedData);
      
//       return response;
//     } catch (error) {
//       console.error('Error submitting solutions to backend:', error.response?.data || error.message);
      
//       // If endpoint not found, try fallback endpoint
//       if (error.response?.status === 404) {
//         console.log("Primary endpoint not found, trying fallback endpoint");
        
//         try {
//           const fallbackResponse = await api.post('/prog-actions/submit-solution', submissionData);
//           console.log("Fallback submission successful:", fallbackResponse.data);
          
//           // Add fields needed for history
//           const problemTitle = await fetchProblemTitle(data.progProblemId);
//           const normalizedData = {
//             ...fallbackResponse.data,
//             title: problemTitle || `Problem ${data.progProblemId}`,
//             date_submission: fallbackResponse.data.submission_date || new Date().toISOString()
//           };
          
//           // Save to history service
//           saveProgrammingSubmission(normalizedData);
          
//           return fallbackResponse;
//         } catch (fallbackError) {
//           console.error('Fallback endpoint also failed:', fallbackError.response?.data || fallbackError.message);
//           throw new Error('All backend submission endpoints failed. Please try again later.');
//         }
//       }
      
//       throw error;
//     }
//   } catch (error) {
//     console.error('Error in submission process:', error);
//     throw error;
//   }
// };


export const submitTaskSolution = async (data) => {
  try {
    // Validate
    if (!data.progProblemId) throw new Error('progProblemId is required');
    if (!data.userId && !data.email) throw new Error('Either userId or email is required');
    if (!data.solutions || !Array.isArray(data.solutions) || data.solutions.length === 0) {
      throw new Error('Solutions array is required and cannot be empty');
    }

    // If userId exists: logged-in user → use /prog-actions/evaluate-solutions (expects array)
    if (data.userId) {
      const submissionData = {
        userId: data.userId,
        progProblemId: data.progProblemId,
        teamSessionId : data.teamSessionId || null,
        solutions: data.solutions.map(sol => ({
          taskId: sol.taskId,
          code: sol.code,
          language: sol.language
        }))
      };
      return await api.post('/prog-actions/evaluate-solutions', submissionData);
    }

    // If email only: guest → use /prog-actions/submit-solution (expects object)
    const codeSubmissions = {};
    data.solutions.forEach(sol => {
      codeSubmissions[sol.taskId] = {
        code: sol.code,
        language: sol.language
      };
    });
    const submissionData = {
      progProblemId: data.progProblemId,
      email: data.email,
      codeSubmissions
    };
    return await api.post('/prog-actions/submit-solution', submissionData);

  } catch (error) {
    console.error('Error in submission process:', error);
    throw error;
  }
};


// Helper function to fetch problem title
const fetchProblemTitle = async (problemId) => {
  try {
    const problem = await getProgProblem(problemId);
    return problem.data.title || `Problem ${problemId}`;
  } catch (error) {
    console.warn(`Couldn't fetch title for problem ${problemId}:`, error);
    return `Problem ${problemId}`;
  }
};

export const getTaskTestCases = (taskId) => {
  return api.get(`/api/tasks/${taskId}/test-cases`);
};

export const getFeedbackForSolution = (data) => {
  return api.post('/prog-actions/get-solution-feedback', data);
}; 