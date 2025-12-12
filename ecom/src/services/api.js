const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = {
    // Helper to get token
    getToken: () => localStorage.getItem('token'),

    // Standard Fetch wrapper
    request: async (endpoint, options = {}) => {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        };

        const config = {
            ...options,
            headers,
        };

        try {
            const res = await fetch(`${API_URL}${endpoint}`, config);
            const data = await res.json();

            if (!res.ok) {
                // Handle 401 Unauthorized via global event or redirect logic if needed
                if (res.status === 401) {
                    // Optional: Window.location.href = '/login'; or dispatch event
                    localStorage.removeItem('token');
                }
                throw new Error(data.message || 'API Error');
            }
            return data;
        } catch (error) {
            console.error("API Request Failed:", endpoint, error);
            throw error;
        }
    },

    get: (endpoint) => api.request(endpoint, { method: 'GET' }),

    post: (endpoint, body) => api.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
    }),

    put: (endpoint, body) => api.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body)
    }),

    delete: (endpoint) => api.request(endpoint, { method: 'DELETE' }),
};

export default api;
