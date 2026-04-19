import api from './api';

const docService = {
    getAll: (category = '', search = '') => {
        let url = '/docs?';
        if (category) url += `category=${encodeURIComponent(category)}&`;
        if (search) url += `search=${encodeURIComponent(search)}`;
        return api.get(url);
    },
    getById: (id) => api.get(`/docs/${id}`),
    create: (data) => api.post('/docs', data),
    update: (id, data) => api.put(`/docs/${id}`, data),
    delete: (id) => api.delete(`/docs/${id}`),
};

export default docService;
