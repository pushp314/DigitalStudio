export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
export const getOAuthLoginUrl = (provider) => `${API_URL}/auth/${provider}/login`;

const isFormDataBody = (body) => typeof FormData !== 'undefined' && body instanceof FormData;

const api = {
    // Helper to get token
    getToken: () => localStorage.getItem('token'),

    // Standard Fetch wrapper
    request: async (endpoint, options = {}) => {
        const token = localStorage.getItem('token');
        const bodyIsFormData = isFormDataBody(options.body);
        const headers = {
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        };

        if (!bodyIsFormData && options.body !== undefined && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const config = {
            ...options,
            headers,
        };

        if (options.body !== undefined && !bodyIsFormData && typeof options.body !== 'string') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const res = await fetch(`${API_URL}${endpoint}`, config);
            const contentType = res.headers.get('content-type') || '';
            const data = contentType.includes('application/json')
                ? await res.json()
                : await res.text();

            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = '/login?session_expired=true';
                }
                throw new Error(data?.error ?? data?.message ?? (typeof data === 'string' ? data : 'API Error'));
            }
            return data;
        } catch (error) {
            console.error("API Request Failed:", endpoint, error);
            throw error;
        }
    },

    get: (endpoint) => api.request(endpoint, { method: 'GET' }),

    post: (endpoint, body, options = {}) => api.request(endpoint, {
        ...options,
        method: 'POST',
        body,
    }),

    put: (endpoint, body, options = {}) => api.request(endpoint, {
        ...options,
        method: 'PUT',
        body,
    }),

    patch: (endpoint, body, options = {}) => api.request(endpoint, {
        ...options,
        method: 'PATCH',
        body,
    }),

    delete: (endpoint) => api.request(endpoint, { method: 'DELETE' }),
};

export default api;
