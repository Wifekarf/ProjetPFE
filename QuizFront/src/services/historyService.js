import api from './api';
import axios from 'axios';

/**
 * Service for handling both quiz and programming problem history
 * Focused on backend data retrieval only
 */

/**
 * Get quiz history for a user from the backend
 * @param {number} userId - The user ID
 * @returns {Promise} - Promise with history data
 */
export const getUserQuizHistory = async (userId, role) => {
  try {
    console.log("Fetching quiz history for role:", role, "user:", userId);

    // si admin, on n’envoie que { role }
    // sinon on envoie { role, userId }
    const payload = role === 'ROLE_ADMIN'
      ? { role }
      : { role, userId };

    const { data } = await axios.post(
      'http://localhost:8000/actions/get_all_historique_user',
      payload
    );

    console.log("Backend quiz history fetched successfully:", data);
    // data = { count: number, history: Array }
    return data;
  } catch (error) {
    console.error('Error fetching quiz history from backend:', error);
    return { count: 0, history: [] };
  }
};

/**
 * Get programming problem history for a user (or all if admin)
 * @param {number|null} userId – the user’s ID, or null for admin
 * @param {string}     role   – 'ROLE_ADMIN' or 'ROLE_USER'
 * @returns {Promise<{count:number, history:Array}>}
 */
export const getUserProgProblemHistory = async (userId, role) => {
  console.log("Fetching programming history for role:", role, "user:", userId);

  // ─── ADMIN: fetch everyone’s history ─────────────────────────────────────
  if (role === 'ROLE_ADMIN') {
    const { data } = await api.post(
      '/prog-actions/get-all-problem-history-admin',
      {}          // no userId for admin
    );
    console.log("Admin programming history fetched successfully:", data);
    return {
      count: data.count,
      history: data.history
    };
  }

  // ─── NON-ADMIN: fetch just this user’s history ───────────────────────────
  const payload = { role, userId };
  const { data } = await api.post(
    '/prog-actions/get-user-problem-history',
    payload
  );
  console.log("User programming history fetched successfully:", data);

  return {
    count: Array.isArray(data.history) ? data.history.length : 0,
    history: data.history || []
  };
};


/**
 * Save a programming problem submission to the backend
 * @param {Object} data - The submission data to record
 * @returns {Promise} - Promise with submission result
 */
export const saveProgrammingSubmission = async (data) => {
  try {
    console.log("Recording programming submission to backend");
    
    // The actual submission is handled by the progProblemApi.js file
    // This function is now just a placeholder since we're not using localStorage
    
    // In a real implementation, we could add additional logic here if needed
    return data.id || Date.now();
  } catch (error) {
    console.error('Error recording programming submission:', error);
    return null;
  }
};

/**
 * Save a quiz submission to the backend
 * @param {Object} data - The quiz submission data to record
 * @returns {Promise} - Promise with submission result
 */
export const saveQuizSubmission = async (data) => {
  try {
    console.log("Recording quiz submission to backend");
    
    // The actual submission is handled elsewhere when the quiz is submitted
    // This function is now just a placeholder since we're not using localStorage
    
    return data.id || Date.now();
  } catch (error) {
    console.error('Error recording quiz submission:', error);
    return null;
  }
};

export default {
  getUserQuizHistory,
  getUserProgProblemHistory,
  saveQuizSubmission,
  saveProgrammingSubmission
}; 