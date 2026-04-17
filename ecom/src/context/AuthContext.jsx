import { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { normalizeUser } from '../utils/normalizers';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const applyAuthPayload = useCallback((payload) => {
        if (!payload) return;
        if (payload.token) {
            localStorage.setItem('token', payload.token);
        }
        if (payload.user) {
            setUser(normalizeUser(payload.user));
        }
    }, []);

    // Check if user is logged in
    useEffect(() => {
        checkUserLoggedIn();
    }, []);

    const checkUserLoggedIn = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const data = await authService.getMe();
            setUser(normalizeUser(data));
        } catch (err) {
            console.error("Auth Check Error", err);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const data = await authService.login(email, password);
            applyAuthPayload(data);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (name, email, password) => {
        try {
            const data = await authService.register(name, email, password);
            applyAuthPayload(data);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const completeOAuth = async ({ token, user: initialUser }) => {
        if (!token) {
            return { success: false, error: 'Missing OAuth token' };
        }

        localStorage.setItem('token', token);

        if (initialUser) {
            setUser(normalizeUser(initialUser));
        }

        try {
            const me = await authService.getMe();
            setUser(normalizeUser(me));
            return { success: true };
        } catch (error) {
            localStorage.removeItem('token');
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, completeOAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
