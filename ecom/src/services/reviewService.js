import api from './api';

const reviewService = {
    adminList: (status = 'all') => api.get(`/admin/reviews${status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''}`),
    update: (id, data) => api.patch(`/admin/reviews/${id}`, data),
    delete: (id) => api.delete(`/admin/reviews/${id}`),
};

export default reviewService;
