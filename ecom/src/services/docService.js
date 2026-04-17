import api from './api';

const docService = {
    getAll: (category = '') => api.get(`/docs${category ? `?category=${encodeURIComponent(category)}` : ''}`),
    getById: (id) => api.get(`/docs/${id}`),
    create: (data) => api.post('/docs', data),
    update: (id, data) => api.put(`/docs/${id}`, data),
    delete: (id) => api.delete(`/docs/${id}`),
};

export default docService;
