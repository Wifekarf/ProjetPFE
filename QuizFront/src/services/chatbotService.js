import api from './api';

export const chatbotService = {
  ask(question, userId = null) {
    return api.post('/api/chatbot/ask', { question, userId }).then(r => r.data);
  },
  stats() {
    return api.get('/api/admin/chatbot/stats').then(r => r.data);
  }
};


