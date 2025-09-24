import api from './api';

/**
 * Fetch all quizzes from the backend
 * @returns {Promise} Axios response with quizzes array
 */
export const getQuizzes = () => {
  return api.get('/api/quizzes');
};

export default {
  getQuizzes
};
