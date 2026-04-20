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

    askDocAIStream: async (markdown, question, docId) => {
        const token = localStorage.getItem('token');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
        
        let apiUrl;
        if (baseUrl.startsWith('http')) {
            apiUrl = new URL(`${baseUrl.replace(/\/$/, '')}/ai/chat`);
        } else {
            apiUrl = new URL(`${window.location.origin}${baseUrl.replace(/\/$/, '')}/ai/chat`);
        }
        
        apiUrl.searchParams.append('docId', docId);
        
        return fetch(apiUrl.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ markdown, question })
        });
    },

    getDocChatHistory: (docId) => 
        api.get(`/docs/${docId}/chat`),

    deleteDocChat: (docId) =>
        api.delete(`/docs/${docId}/chat`),
    
    getUserRoadmap: (wishlistIds) =>
        api.post('/ai/roadmap', { wishlistIds })
};

export default aiService;
