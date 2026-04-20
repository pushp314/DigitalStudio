import api from './api';

const getMetrics = () => api.get('/admin/intelligence/metrics');

const analyticsService = {
    getAnalyticsData: () => getMetrics(),
    getSales: async () => {
        const metrics = await getMetrics();
        return Array.isArray(metrics?.topCategories)
            ? metrics.topCategories.map((entry, index) => ({
                productId: index + 1,
                title: entry.category,
                totalSold: entry.count,
                revenue: entry.revenue,
            }))
            : [];
    },
    getTopTemplates: async () => {
        const metrics = await getMetrics();
        return Array.isArray(metrics?.topCategories)
            ? metrics.topCategories.map((entry, index) => ({
                id: index + 1,
                title: entry.category,
                category: entry.category,
                image: '',
                price: 0,
                numSales: entry.count,
            }))
            : [];
    },
    getIntelligenceMetrics: () => getMetrics(),
};

export default analyticsService;
