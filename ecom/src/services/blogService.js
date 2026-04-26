import api from './api';

const blogService = {
    // Public: List all posts
    list: (params) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/posts?${query}`);
    },

    // Public: Get single post
    get: (slug) => api.get(`/posts/${slug}`),

    // Admin: Create post
    create: (data) => api.post('/posts', data),

    // Admin: Update post
    update: (id, data) => api.put(`/posts/${id}`, data),

    // Admin: Delete post
    delete: (id) => api.delete(`/posts/${id}`),
};

export default blogService;
