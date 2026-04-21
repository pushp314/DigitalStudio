import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import authService from '../services/authService';
import orderService from '../services/orderService';
import { normalizeUser, normalizeId } from '../utils/normalizers';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [purchasedProductIds, setPurchasedProductIds] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPurchasedProducts = useCallback(async () => {
        try {
            const res = await orderService.getMyOrders();
            const ids = (res || []).flatMap(order => 
                (order.order_items || order.orderItems || []).map(item => 
                    normalizeId(item.product_id || item.productId)
                )
            );
            setPurchasedProductIds([...new Set(ids)]);
        } catch (err) {
            console.error("Failed to fetch purchased products", err);
        }
    }, []);

    const applyAuthPayload = useCallback((payload) => {
        if (!payload) return;
        if (payload.token) {
            localStorage.setItem('token', payload.token);
        }
        if (payload.user) {
            setUser(normalizeUser(payload.user));
        }
    }, []);

    const checkUserLoggedIn = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const data = await authService.getMe();
            setUser(normalizeUser(data));
            await fetchPurchasedProducts();
        } catch (err) {
            console.error("Auth Check Error", err);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    }, [fetchPurchasedProducts]);

    // Check if user is logged in
    useEffect(() => {
        checkUserLoggedIn();
    }, [checkUserLoggedIn]);

    const login = useCallback(async (email, password) => {
        try {
            const data = await authService.login(email, password);
            const normalized = normalizeUser(data.user);
            applyAuthPayload(data);
            await fetchPurchasedProducts();
            return { success: true, user: normalized };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, [applyAuthPayload, fetchPurchasedProducts]);

    const register = useCallback(async (name, email, password, referrerCode) => {
        try {
            const data = await authService.register(name, email, password, referrerCode);
            const normalized = normalizeUser(data.user);
            applyAuthPayload(data);
            await fetchPurchasedProducts();
            return { success: true, user: normalized };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, [applyAuthPayload, fetchPurchasedProducts]);

    const completeOAuth = useCallback(async ({ token, user: initialUser }) => {
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
            await fetchPurchasedProducts();
            return { success: true };
        } catch (error) {
            localStorage.removeItem('token');
            return { success: false, error: error.message };
        }
    }, [fetchPurchasedProducts]);

    const logout = useCallback(() => {
        setUser(null);
        setPurchasedProductIds([]);
        localStorage.removeItem('token');
    }, []);

    const value = useMemo(() => ({ 
        user, 
        setUser, 
        login, 
        register, 
        logout, 
        loading, 
        completeOAuth, 
        purchasedProductIds, 
        refreshPurchases: fetchPurchasedProducts,
        refreshUser: checkUserLoggedIn 
    }), [user, loading, login, register, logout, completeOAuth, purchasedProductIds, fetchPurchasedProducts, checkUserLoggedIn]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
