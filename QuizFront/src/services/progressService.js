import api from './api';

export const progressService = {
  updateQuizProgress: (quizId, userId, sessionId, answeredCount) =>
    api.post(`/api/quiz/session/progress/quiz/${quizId}/${userId}/${sessionId}`, { answeredCount }),

  updateProgProgress: (progId, userId, sessionId, answeredCount) =>
    api.post(`/api/quiz/session/progress/prog/${progId}/${userId}/${sessionId}`, { answeredCount }),
};
