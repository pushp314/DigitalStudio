import api from './api';

const authService = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (name, email, password, referrerCode) => api.post('/auth/register', { name, email, password, referrerCode }),
    getMe: () => api.get('/auth/me'),
};

export default authService;
