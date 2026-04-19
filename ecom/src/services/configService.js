import api from './api';

const configService = {
    getPublic: () => api.get('/config'),
    getAdmin: () => api.get('/config/admin'),
    update: (data) => api.put('/config', data),
};

export default configService;
