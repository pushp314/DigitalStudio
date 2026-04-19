import api from './api';

const licenseService = {
    getMyLicenses: () => api.get('/licenses/my'),
    validate: (data) => api.post('/licenses/validate', data),
    adminIssue: (orderId) => api.post('/admin/licenses/issue', { orderId }),
};

export default licenseService;
