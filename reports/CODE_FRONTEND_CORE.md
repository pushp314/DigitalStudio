# Frontend Core Architecture - BizCode

This document contains the application shell, state management, and service layers.

---

## App.jsx
```jsx
// [Full routing logic with layout suppression for /admin and /chat]
```

## context/AuthContext.jsx
```jsx
import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { setLoading(false); return; }
        api.get('/auth/me').then(setUser).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login }}>
            {children}
        </AuthContext.Provider>
    );
};
export default AuthContext;
```

## services/api.js
```javascript
export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const api = {
    getToken: () => localStorage.getItem('token'),
    request: async (endpoint, options = {}) => {
        const token = localStorage.getItem('token');
        const headers = {
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        };
        const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        if (!res.ok) throw new Error("API Error");
        return res.json();
    },
    get: (endpoint) => api.request(endpoint, { method: 'GET' }),
    post: (endpoint, body) => api.request(endpoint, { method: 'POST', body: JSON.stringify(body), headers: {'Content-Type': 'application/json'} }),
};
export default api;
```
