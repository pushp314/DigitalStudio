import api from './api';

const userService = {
    getAll: () => api.get('/users'),
};

export default userService;
