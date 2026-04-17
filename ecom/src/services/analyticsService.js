import api from './api';

const analyticsService = {
    getSales: () => api.get('/analytics/sales'),
    getTopProducts: () => api.get('/analytics/top-products'),
};

export default analyticsService;
