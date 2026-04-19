import api from './api';

const marketingService = {
    getCoupons: () => api.get('/admin/marketing/coupons'),
    createCoupon: (data) => api.post('/admin/marketing/coupons', data),
    deleteCoupon: (id) => api.delete(`/admin/marketing/coupons/${id}`),
    
    getSEOData: (type, id) => api.get(`/marketing/seo/${type}/${id}`),
    updateSEOData: (type, id, data) => api.put(`/marketing/seo/${type}/${id}`, data),
};

export default marketingService;
