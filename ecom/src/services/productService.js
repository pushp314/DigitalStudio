import api from './api';

const productService = {
    getAll: (keyword = '') => api.get(`/products?keyword=${keyword}`),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data), // Admin
    update: (id, data) => api.put(`/products/${id}`, data), // Admin
    delete: (id) => api.delete(`/products/${id}`), // Admin
};

export default productService;
