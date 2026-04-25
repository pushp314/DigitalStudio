import api from './api';

const orderService = {
    create: (orderData) => api.post('/orders', orderData),
    getMyOrders: () => api.get('/orders/myorders'),
    adminList: (status = 'all') => api.get(`/admin/orders${status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''}`),
    adminGetById: (id) => api.get(`/admin/orders/${id}`),
    adminUpdate: (id, data) => api.patch(`/admin/orders/${id}`, data),
    adminRefund: (id) => api.post(`/admin/orders/${id}/refund`),
};

export default orderService;
