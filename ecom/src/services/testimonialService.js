import api from './api';

const testimonialService = {
    getApproved: () => api.get('/testimonials'),
    create: (data) => api.post('/testimonials', data),
    
    // Admin methods
    adminList: (status = 'all') => api.get(`/admin/testimonials${status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''}`),
    approve: (id) => api.patch(`/admin/testimonials/${id}/approve`, {}),
    reject: (id) => api.patch(`/admin/testimonials/${id}/reject`, {}),
    delete: (id) => api.delete(`/admin/testimonials/${id}`),
};

export default testimonialService;
