import api from './api';

const userService = {
    getAll: () => api.get('/admin/users'),
    adminList: () => api.get('/admin/users'),
    update: (id, data) => api.patch(`/admin/users/${id}`, data),
    resetPassword: (id, password) => api.post(`/admin/users/${id}/reset-password`, { password }),
};

export default userService;
