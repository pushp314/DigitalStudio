import api from './api';

const marketingService = {
    getCoupons: () => api.get('/admin/marketing/coupons'),
    createCoupon: (data) => api.post('/admin/marketing/coupons', data),
    updateCoupon: (id, data) => api.patch(`/admin/marketing/coupons/${id}`, data),
    revokeCoupon: (id) => api.patch(`/admin/marketing/coupons/${id}/revoke`),
    deleteCoupon: (id) => api.delete(`/admin/marketing/coupons/${id}`),
};

export default marketingService;
