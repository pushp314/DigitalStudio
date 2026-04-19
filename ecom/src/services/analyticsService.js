import api from './api';

const analyticsService = {
    getSales: () => api.get('/analytics/sales'),
    getTopProducts: () => api.get('/analytics/top-products'),
    getIntelligenceMetrics: () => api.get('/admin/intelligence/metrics'),
};

export default analyticsService;
