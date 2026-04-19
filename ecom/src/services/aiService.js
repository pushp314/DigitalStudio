import api from './api';

const aiService = {
    generateDescription: (title, techStack) => 
        api.post('/ai/generate-description', { title, techStack }),
    
    suggestTags: (title, content) => 
        api.post('/ai/suggest-tags', { title, content }),
    
    recommendPricing: (category, features) => 
        api.post('/ai/recommend-pricing', { category, features }),
    
    askDocAI: (markdown, question) =>
        api.post('/ai/chat', { markdown, question }),

    askDocAIStream: async (markdown, question, conversationId) => {
        const token = localStorage.getItem('token');
        return fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ markdown, question, conversationId })
        });
    },
    
    getUserRoadmap: (wishlistIds) =>
        api.post('/ai/roadmap', { wishlistIds })
};

export default aiService;
