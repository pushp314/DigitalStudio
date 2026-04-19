import api from './api';

const buildQueryString = (params = {}) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return;
        }
        query.set(key, String(value));
    });

    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
};

const normalizeParams = (input) => {
    if (typeof input === 'string') {
        return { keyword: input };
    }

    return input ?? {};
};

const productService = {
    getAll: (params = {}) => api.get(`/products${buildQueryString(normalizeParams(params))}`),
    getById: (id, params = {}) => api.get(`/products/${id}${buildQueryString(normalizeParams(params))}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
    getReviews: (id) => api.get(`/products/${id}/reviews`),
    getReviewEligibility: (id) => api.get(`/products/${id}/review-eligibility`),
    createReview: (id, data) => api.post(`/products/${id}/review`, data),
};

export default productService;
