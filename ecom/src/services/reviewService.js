import api from './api';

const reviewService = {
    adminList: (status) => api.get(`/admin/reviews${status ? `?status=${status}` : ''}`),
    adminUpdate: (id, data) => api.put(`/admin/reviews/${id}`, data),
    adminDelete: (id) => api.delete(`/admin/reviews/${id}`),
};

export default reviewService;
