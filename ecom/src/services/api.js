export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
export const WS_URL = API_URL.startsWith('http') 
    ? API_URL.replace(/^http/, 'ws') 
    : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}${API_URL}`;
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
                if (res.status === 429) {
                    throw new Error("Too many requests. Please wait a moment before trying again.");
                }
                if (res.status === 503 && data?.maintenance) {
                    // Dispatch global event for Maintenance UI
                    window.dispatchEvent(new CustomEvent('platform_maintenance', { detail: data.message }));
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
