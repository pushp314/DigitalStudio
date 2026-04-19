import api from './api';

const userService = {
    getAll: () => api.get('/users'),
    adminList: () => api.get('/admin/users'),
    update: (id, data) => api.patch(`/users/${id}`, data),
    resetPassword: (id, password) => api.post(`/users/${id}/reset-password`, { password }),
};

export default userService;
