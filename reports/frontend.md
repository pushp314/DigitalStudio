## File: src/context/WishlistContext.jsx
 ```javascript
import { createContext } from 'react';
import { normalizeProduct } from '../utils/normalizers';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useLocalStorageState('wishlistItems', []);

    const addToWishlist = (product) => {
        const normalizedProduct = normalizeProduct(product);
        const existItem = wishlistItems.find((x) => x.id === normalizedProduct.id);
        if (existItem) {
            return;
        }
        const itemWithTimestamp = { ...normalizedProduct, addedAt: Math.floor(Date.now() / 1000) };
        setWishlistItems([...wishlistItems, itemWithTimestamp]);
    };

    const removeFromWishlist = (id) => {
        setWishlistItems(wishlistItems.filter((x) => x.id !== id));
    };

    const isInWishlist = (id) => {
        return wishlistItems.some((x) => x.id === id);
    };

    return (
        <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export default WishlistContext;
 ```

## File: src/context/AuthContext.jsx
 ```javascript
import { createContext, useState, useEffect, useCallback } from 'react';
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

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, completeOAuth, purchasedProductIds, refreshPurchases: fetchPurchasedProducts }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
 ```

## File: src/context/ToastContext.jsx
 ```javascript
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
    const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
    const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
    const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

    return (
        <ToastContext.Provider value={{ success, error, warning, info, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

const ToastContainer = ({ toasts, removeToast }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-[200] flex flex-col gap-2 max-w-sm">
            {toasts.map(toast => (
                <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const Toast = ({ id: _id, message, type, duration, onClose }) => {
    const [progress, setProgress] = useState(100);

    React.useEffect(() => {
        if (duration > 0) {
            const interval = setInterval(() => {
                setProgress(prev => Math.max(0, prev - (100 / (duration / 100))));
            }, 100);
            return () => clearInterval(interval);
        }
    }, [duration]);

    const variants = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    const icons = {
        success: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
        ),
        error: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
        ),
        warning: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
        ),
        info: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
        )
    };

    return (
        <div
            className={`${variants[type]} border rounded-lg p-4 shadow-lg transform transition-all duration-300 animate-slideIn relative overflow-hidden`}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    {icons[type]}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            {duration > 0 && (
                <div className="absolute bottom-0 left-0 h-1 bg-currentColor opacity-30" style={{ width: `${progress}%`, transition: 'width 100ms linear' }} />
            )}
        </div>
    );
};

export default ToastProvider;
 ```

## File: src/context/CartContext.jsx
 ```javascript
import { createContext, useContext } from 'react';
import { normalizeProduct } from '../utils/normalizers';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useLocalStorageState('cartItems', []);

    // Growth Matrix: AOV Bundle Logic (10% off for 3+ items)
    const isBundleEligible = cartItems.length >= 3;
    const itemsCount = cartItems.length;

    const addToCart = (product) => {
        const normalizedProduct = normalizeProduct(product);
        const existItem = cartItems.find((x) => x.id === normalizedProduct.id);
        if (existItem) {
            setCartItems(
                cartItems.map((x) =>
                    x.id === normalizedProduct.id ? normalizedProduct : x
                )
            );
        } else {
            setCartItems([...cartItems, normalizedProduct]);
        }
    };

    const removeFromCart = (id) => {
        setCartItems(cartItems.filter((x) => x.id !== id));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, isBundleEligible, itemsCount }}>
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;
 ```

## File: src/context/ConfigContext.jsx
 ```javascript
import React, { createContext, useState, useEffect } from 'react';
import configService from '../services/configService';
import { normalizeSiteConfig } from '../utils/normalizers';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({
        heroTitle: "Build premium products for developers",
        announcements: [],
        showAnnouncement: false,
        supportEmail: "",
        features: {
            docs: true,
            reviews: true,
            analytics: true,
            ai: true,
            payments: true,
            subscriptions: false,
            licenses: true,
            testimonials: true,
        },
        faqs: [],
        socialProof: {
            rating: '',
            summary: '',
            creatorsLabel: '',
            trustedCompanies: [],
            avatarImages: [],
        },
        showcaseItems: [],
        contact: {
            heading: 'Contact us',
            subheading: '',
            email: '',
            address: '',
            phone: '',
        },
        aiSettings: {
            enabled: false,
            serviceUrl: '',
            model: '',
            apiKey: '',
        },
    });

    const [loading, setLoading] = useState(true);

    const fetchConfig = async () => {
        try {
            const data = await configService.getPublic();
            setConfig(normalizeSiteConfig(data));
        } catch (error) {
            console.error("Failed to fetch site config", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const updateContextConfig = (newConfig) => {
        setConfig(normalizeSiteConfig(newConfig));
    };

    return (
        <ConfigContext.Provider value={{ config, updateContextConfig, loading, fetchConfig }}>
            {children}
        </ConfigContext.Provider>
    );
};

export default ConfigContext;
 ```

## File: src/config/features.js
 ```javascript
const envFlag = (name, fallback) => {
    const value = import.meta.env[name];
    if (value === undefined) {
        return fallback;
    }

    return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

export const FEATURES = {
    docs: envFlag('VITE_FEATURE_DOCS', true),
    reviews: envFlag('VITE_FEATURE_REVIEWS', true),
    analytics: envFlag('VITE_FEATURE_ANALYTICS', true),
    ai: envFlag('VITE_FEATURE_AI', true),
    payments: envFlag('VITE_FEATURE_PAYMENTS', true),
    subscriptions: envFlag('VITE_FEATURE_SUBSCRIPTIONS', false),
    licenses: envFlag('VITE_FEATURE_LICENSES', false),
};
 ```

## File: src/utils/normalizers.js
 ```javascript
const CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const toArray = (value) => (Array.isArray(value) ? value : []);
const toString = (value, fallback = '') => (typeof value === 'string' ? value : fallback);
const toObject = (value, fallback = {}) => (value && typeof value === 'object' && !Array.isArray(value) ? value : fallback);

export const normalizeId = (value) => {
    const raw = value ?? null;
    const numeric = Number(raw);
    return Number.isFinite(numeric) && raw !== '' && raw !== null ? numeric : raw;
};

export const formatCurrency = (value) => {
    const amount = Number(value ?? 0);
    return CURRENCY_FORMATTER.format(Number.isFinite(amount) ? amount : 0);
};

export const normalizeUser = (user = {}) => ({
    ...user,
    id: normalizeId(user.id ?? user._id),
    name: toString(user.name, 'Anonymous User'),
    email: toString(user.email),
    role: toString(user.role, 'user'),
    subscriptionPlan: toString(user.subscriptionPlan ?? user.subscription_plan, 'free'),
    provider: toString(user.provider, 'local'),
    providerId: toString(user.providerId ?? user.provider_id),
    suspended: Boolean(user.suspended ?? false),
    createdAt: user.createdAt ?? user.created_at ?? null,
    updatedAt: user.updatedAt ?? user.updated_at ?? null,
});

const normalizeStatusFlags = (statusFlags) => {
    const flags = Array.isArray(statusFlags)
        ? statusFlags
        : String(statusFlags || '')
            .split(',')
            .map((flag) => flag.trim())
            .filter(Boolean);

    return {
        raw: flags,
        isFree: flags.includes('free'),
        isBestseller: flags.includes('bestseller'),
        isNewProduct: flags.includes('new'),
        isTrending: flags.includes('trending'),
        isFeatured: flags.includes('featured'),
    };
};

const normalizeDocumentationInfo = (documentation) => {
    const items = toArray(documentation).filter(Boolean);
    return {
        items,
        setup: items.some((item) => /setup|frontend/i.test(item)),
        deployment: items.some((item) => /deploy|backend/i.test(item)),
    };
};

export const normalizePreviewAsset = (asset, index = 0) => {
    if (typeof asset === 'string') {
        return {
            url: asset,
            alt: '',
            caption: '',
            sortOrder: index + 1,
        };
    }

    const normalized = toObject(asset);
    return {
        url: toString(normalized.url),
        alt: toString(normalized.alt),
        caption: toString(normalized.caption),
        sortOrder: Number(normalized.sortOrder ?? index + 1),
    };
};

export const normalizeProduct = (product = {}) => {
    const id = normalizeId(product.id ?? product._id);
    const price = Number(product.price ?? 0);
    const status = normalizeStatusFlags(product.statusFlags ?? product.status_flags ?? []);
    const documentation = normalizeDocumentationInfo(product.documentation);
    const previewImages = toArray(product.previewImages ?? product.preview_images).map(normalizePreviewAsset).filter((item) => item.url);

    return {
        ...product,
        id,
        price: Number.isFinite(price) ? price : 0,
        formattedPrice: formatCurrency(price),
        productType: product.productType ?? product.type ?? 'template',
        fileURL: product.fileURL ?? product.file_url ?? '',
        previewUrl: product.previewUrl ?? product.liveDemo ?? product.live_demo ?? '',
        image: toString(product.image),
        liveDemo: toString(product.liveDemo ?? product.live_demo),
        githubRepo: toString(product.githubRepo ?? product.github_repo),
        videoUrl: toString(product.videoUrl ?? product.video_url),
        courseOutline: toString(product.courseOutline ?? product.course_outline),
        duration: toString(product.duration),
        snippetLanguage: toString(product.snippetLanguage ?? product.snippet_language),
        snippet: toString(product.snippet),
        techStack: toArray(product.techStack ?? product.tech_stack),
        documentation: documentation.items,
        documentationInfo: documentation,
        previewImages,
        features: toArray(product.features),
        pages: toArray(product.pages),
        rating: Number(product.rating ?? 0),
        numReviews: Number(product.numReviews ?? product.num_reviews ?? 0),
        numSales: Number(product.numSales ?? product.num_sales ?? 0),
        revenue: Number(product.revenue ?? 0),
        requiresSubscription: Boolean(product.requiresSubscription ?? product.requires_subscription ?? false),
        tags: toArray(product.tags).map((tag) => typeof tag === 'string' ? tag : toString(tag?.name)).filter(Boolean),
        moderationStatus: toString(product.moderationStatus ?? product.moderation_status, 'approved'),
        createdAt: product.createdAt ?? product.created_at ?? null,
        updatedAt: product.updatedAt ?? product.updated_at ?? null,
        isFree: product.isFree ?? (price === 0 || status.isFree),
        isBestseller: product.isBestseller ?? status.isBestseller,
        isNewProduct: product.isNewProduct ?? status.isNewProduct,
        isTrending: product.isTrending ?? status.isTrending,
        isFeatured: product.isFeatured ?? status.isFeatured,
    };
};

export const normalizeOrder = (order = {}) => {
    const orderItems = toArray(order.orderItems ?? order.order_items).map((item) => {
        const normalizedProduct = normalizeProduct(item.product ?? item);
        const price = Number(item.price ?? normalizedProduct.price ?? 0);

        return {
            ...item,
            id: normalizeId(item.id ?? item._id),
            orderId: normalizeId(item.orderId ?? item.order_id),
            productId: normalizeId(item.productId ?? item.product_id ?? normalizedProduct.id),
            quantity: Number(item.quantity ?? 1),
            price,
            formattedPrice: formatCurrency(price),
            product: normalizedProduct,
            title: normalizedProduct.title,
            image: normalizedProduct.image,
        };
    });

    const totalPrice = Number(order.totalPrice ?? order.total_price ?? 0);

    return {
        ...order,
        id: normalizeId(order.id ?? order._id),
        userId: normalizeId(order.userId ?? order.user_id),
        totalPrice,
        formattedTotalPrice: formatCurrency(totalPrice),
        status: order.status ?? 'pending',
        paymentStatus: order.paymentStatus ?? order.payment_status ?? 'pending',
        entitlementStatus: order.entitlementStatus ?? order.entitlement_status ?? 'auto',
        razorpayOrderId: toString(order.razorpayOrderId ?? order.razorpay_order_id),
        razorpayPaymentId: toString(order.razorpayPaymentId ?? order.razorpay_payment_id),
        entitled: Boolean(
            order.entitled ??
            order.isPaid ??
            ((order.paymentStatus ?? order.payment_status) === 'paid' || (order.status ?? '') === 'paid')
        ),
        orderItems,
        createdAt: order.createdAt ?? order.created_at ?? null,
        updatedAt: order.updatedAt ?? order.updated_at ?? null,
    };
};

export const normalizeDoc = (doc = {}) => {
    const price = Number(doc.price ?? 0);

    return {
        ...doc,
        id: normalizeId(doc.id ?? doc._id),
        price,
        formattedPrice: price === 0 ? 'Free' : formatCurrency(price),
        isPremium: Boolean(doc.isPremium ?? doc.is_premium ?? price > 0),
        hasAccess: Boolean(doc.hasAccess ?? doc.has_access ?? false),
        locked: Boolean(doc.locked ?? false),
        previewContent: toString(doc.previewContent ?? doc.preview_content),
        tableOfContents: toArray(doc.tableOfContents ?? doc.table_of_contents),
        tags: toArray(doc.tags ?? doc.docTags),
        createdAt: doc.createdAt ?? doc.created_at ?? null,
        updatedAt: doc.updatedAt ?? doc.updated_at ?? null,
    };
};

export const normalizeSiteConfig = (config = {}) => ({
    ...config,
    heroTitle: config.heroTitle ?? '',
    heroSubtitle: config.heroSubtitle ?? '',
    announcements: toArray(config.announcements).length > 0 
        ? toArray(config.announcements) 
        : (config.announcementMessage ? [config.announcementMessage] : []),
    showAnnouncement: Boolean(config.showAnnouncement),
    supportEmail: config.supportEmail ?? '',
    features: config.features ?? {},
    memberPlans: toArray(config.memberPlans),
    faqs: toArray(config.faqs),
    socialProof: {
        rating: toString(config.socialProof?.rating),
        summary: toString(config.socialProof?.summary),
        creatorsLabel: toString(config.socialProof?.creatorsLabel),
        trustedCompanies: toArray(config.socialProof?.trustedCompanies),
        avatarImages: toArray(config.socialProof?.avatarImages),
    },
    showcaseItems: toArray(config.showcaseItems),
    contact: {
        heading: toString(config.contact?.heading, 'Contact us'),
        subheading: toString(config.contact?.subheading),
        email: toString(config.contact?.email ?? config.supportEmail),
        address: toString(config.contact?.address),
        phone: toString(config.contact?.phone),
    },
    aiSettings: {
        enabled: Boolean(config.aiSettings?.enabled ?? false),
        serviceUrl: toString(config.aiSettings?.serviceUrl),
        model: toString(config.aiSettings?.model),
        apiKey: toString(config.aiSettings?.apiKey),
    },
});

export const normalizeSalesSummary = (entry = {}) => ({
    ...entry,
    productId: normalizeId(entry.productId ?? entry.product_id),
    totalSold: Number(entry.totalSold ?? entry.total_sold ?? 0),
    revenue: Number(entry.revenue ?? 0),
    formattedRevenue: formatCurrency(entry.revenue ?? 0),
});

export const normalizeReview = (review = {}) => ({
    ...review,
    id: normalizeId(review.id ?? review._id),
    productId: normalizeId(review.productId ?? review.product_id),
    userId: normalizeId(review.userId ?? review.user_id),
    rating: Number(review.rating ?? 0),
    comment: toString(review.comment ?? review.text),
    status: toString(review.status, 'approved'),
    verifiedPurchase: Boolean(review.verifiedPurchase ?? review.verified_purchase ?? false),
    createdAt: review.createdAt ?? review.created_at ?? null,
    updatedAt: review.updatedAt ?? review.updated_at ?? null,
    user: review.user ? normalizeUser(review.user) : null,
    product: review.product ? normalizeProduct(review.product) : null,
});

export const normalizeLicense = (license = {}) => ({
    ...license,
    id: normalizeId(license.id ?? license._id),
    userId: normalizeId(license.userId ?? license.user_id),
    productId: normalizeId(license.productId ?? license.product_id),
    orderId: normalizeId(license.orderId ?? license.order_id),
    type: toString(license.type, 'personal'),
    status: toString(license.status, 'active'),
    licenseKey: toString(license.licenseKey ?? license.license_key),
    expiryDate: license.expiryDate ?? license.expiry_date ?? null,
    createdAt: license.createdAt ?? license.created_at ?? null,
    updatedAt: license.updatedAt ?? license.updated_at ?? null,
    product: license.product ? normalizeProduct(license.product) : null,
    order: license.order ? normalizeOrder(license.order) : null,
});
 ```

## File: src/index.css
 ```javascript
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply antialiased text-gray-900 bg-[#F5F5F7];
    font-feature-settings: "cv11", "ss01";
  }

  ::selection {
    @apply bg-primary text-white;
  }
}

@layer utilities {
  @keyframes scroll {
    0% {
      transform: translateX(0);
    }

    100% {
      transform: translateX(-50%);
    }
  }

  .animate-scroll {
    animation: scroll 30s linear infinite;
  }

  .animate-scroll:hover {
    animation-play-state: paused;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in-up {
    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .delay-100 {
    animation-delay: 100ms;
  }

  .delay-200 {
    animation-delay: 200ms;
  }

  .delay-300 {
    animation-delay: 300ms;
  }
}

/* Markdown Support */
.markdown-content h1 { @apply text-3xl font-black mb-6 mt-8; }
.markdown-content h2 { @apply text-2xl font-bold mb-4 mt-8 border-b border-gray-100 pb-2; }
.markdown-content h3 { @apply text-xl font-bold mb-3 mt-6; }
.markdown-content p { @apply mb-4 leading-relaxed text-gray-700; }
.markdown-content ul { @apply list-disc list-inside mb-4 space-y-1; }
.markdown-content ol { @apply list-decimal list-inside mb-4 space-y-1; }
.markdown-content li { @apply text-gray-700; }
.markdown-content code { @apply bg-gray-100 text-primary px-1.5 py-0.5 rounded font-mono text-sm; }
.markdown-content pre { @apply bg-gray-900 text-gray-100 p-6 rounded-2xl mb-6 overflow-x-auto font-mono text-sm shadow-xl; }
.markdown-content pre code { @apply bg-transparent text-inherit p-0; }
.markdown-content blockquote { @apply border-l-4 border-primary bg-blue-50/50 p-4 rounded-r-xl italic mb-6; }
.markdown-content a { @apply text-primary hover:underline font-medium; }
.markdown-content table { @apply w-full border-collapse mb-6; }
.markdown-content th { @apply bg-gray-50 border border-gray-200 px-4 py-2 text-left font-bold; }
.markdown-content td { @apply border border-gray-200 px-4 py-2; }
.markdown-content img { @apply rounded-2xl shadow-lg my-8 max-w-full; }
.markdown-content hr { @apply my-10 border-gray-200; } ```

## File: src/components/HeroSection.jsx
 ```javascript
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfigContext from '../context/ConfigContext';

const HeroSection = () => {
    const { config } = useContext(ConfigContext);
    const navigate = useNavigate();
    const [activeIndex, setActiveIndex] = React.useState(0);
    const trustedCompanies = Array.isArray(config?.socialProof?.trustedCompanies) ? config.socialProof.trustedCompanies : [];

    // Protocol: Asset Rotation Loop
    React.useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % 3);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    const stackImages = Array.isArray(config?.heroImages) && config.heroImages.length > 0
        ? config.heroImages
        : [
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200",
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
        ];

    return (
        <div className="relative w-full bg-[#F8FAFC] min-h-[90vh] lg:h-screen lg:max-h-[950px] flex flex-col justify-center px-6 md:px-12 overflow-hidden font-sans">
            
            {/* ATMOSPHERIC LAYERS */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-400/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* MAIN CONTENT WRAPPER */}
            <div className="max-w-[1400px] mx-auto w-full relative z-10 pt-12 lg:pt-0">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-center gap-12 lg:gap-20">
                    
                    {/* LEFT SECTOR: INTELLIGENCE & HEADING */}
                    <div className="text-left animate-in slide-in-from-left-8 duration-700">
                        {/* Live Signal Badge */}
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full mb-6 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Marketplace Protocol: 50+ Verified Assets</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.9] font-black text-slate-900 tracking-tighter mb-6">
                            {config?.heroTitle || "High-Performance Marketplace for Modern Teams"}
                        </h1>

                        <p className="max-w-xl text-lg text-slate-400 font-medium leading-relaxed mb-10">
                            {config?.heroSubtitle || "Discover, acquire, and launch pixel-perfect React templates and SaaS modules in minutes."}
                        </p>

                        <div className="flex flex-wrap items-center gap-5">
                            <button 
                                onClick={() => navigate('/templates')}
                                className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-xl shadow-blue-500/20 outline-none"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                </svg>
                                Browse Templates
                            </button>
                            <button 
                                onClick={() => navigate('/docs')}
                                className="px-8 py-4 bg-white border border-slate-100 text-slate-900 rounded-full font-bold text-lg flex items-center gap-3 hover:bg-slate-50 transition-all font-sans outline-none"
                            >
                                <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></span>
                                Protocol
                            </button>
                        </div>
                    </div>

                    {/* RIGHT SECTOR: POLYMORPHIC INTELLIGENCE VISUALS */}
                    <div className="relative animate-in zoom-in-95 duration-1000 hidden lg:block h-[500px]">
                        
                        {/* 1. Protocol: PERSPECTIVE STACK */}
                        {(config?.heroVisualEffect === 'stack' || !config?.heroVisualEffect) && stackImages.map((src, idx) => {
                            const position = (idx - activeIndex + 3) % 3;
                            const styles = {
                                0: "z-30 scale-100 opacity-100 translate-x-[0%] translate-y-[0%] rotate-0 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)]",
                                1: "z-20 scale-[0.92] opacity-60 translate-x-[8%] translate-y-[-12%] rotate-[2deg] blur-[0.5px]",
                                2: "z-10 scale-[0.84] opacity-30 translate-x-[16%] translate-y-[-24%] rotate-[4deg] blur-[1px]"
                            };
                            return (
                                <div key={idx} className={`absolute top-[15%] left-[0%] w-[520px] aspect-[16/10] bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden transition-all duration-[1200ms] ${styles[position]}`} style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                                    <img src={src} className="w-full h-full object-cover" alt={`Template ${idx}`} />
                                    {position === 0 && <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-100 shadow-sm animate-fade-in"><span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Asset {idx + 1} — Verified</span></div>}
                                </div>
                            );
                        })}

                        {/* 2. Protocol: CINEMATIC CROSS-FADE */}
                        {config?.heroVisualEffect === 'fade' && stackImages.map((src, idx) => (
                            <div key={idx} className={`absolute inset-0 w-full h-full rounded-[3.5rem] overflow-hidden transition-opacity duration-[2000ms] ease-in-out ${idx === activeIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'}`}>
                                <img src={src} className="w-full h-full object-cover" alt={`Template ${idx}`} />
                                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/40 via-transparent to-transparent"></div>
                                <div className="absolute bottom-10 left-10 text-white animate-in slide-in-from-bottom-4 duration-1000">
                                     <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Featured Intelligence</p>
                                     <h3 className="text-3xl font-black tracking-tighter">Asset Node 0{idx + 1}</h3>
                                </div>
                            </div>
                        ))}

                        {/* 3. Protocol: FLOATING SCATTER */}
                        {config?.heroVisualEffect === 'scatter' && stackImages.map((src, idx) => {
                             const offsets = [
                                { top: '0%', left: '10%', scale: 'scale-100', delay: '0s' },
                                { top: '30%', left: '40%', scale: 'scale-90', delay: '1s' },
                                { top: '50%', left: '5%', scale: 'scale-95', delay: '2.5s' }
                             ];
                             const pos = offsets[idx % 3];
                             return (
                                <div key={idx} className={`absolute ${pos.top} ${pos.left} w-[380px] aspect-video bg-white rounded-[2rem] shadow-2xl border border-slate-100 transition-all duration-[3000ms] ${pos.scale} animate-float`} style={{ animationDelay: pos.delay }}>
                                    <img src={src} className="w-full h-full object-cover rounded-[2rem]" alt={`Template ${idx}`} />
                                    <div className="absolute -bottom-4 -right-4 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg">0{idx+1}</div>
                                </div>
                             );
                        })}

                        {/* Universal Interaction Node (Shared) */}
                        <div className="absolute -bottom-10 right-10 p-6 bg-white rounded-[2rem] shadow-2xl border border-slate-50 z-40 animate-bounce-slow">
                            <span className="text-2xl font-black text-primary">$49</span>
                        </div>
                    </div>

                </div>

                {/* LOGO MARQUEE (Trust Layer) */}
                <div className="mt-20 pt-10 border-t border-slate-100/80">
                    <div className="w-full overflow-hidden relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
                        <div className="flex gap-16 items-center animate-scroll w-max">
                            {[...trustedCompanies, ...trustedCompanies, ...trustedCompanies].map((name, index) => (
                                <div key={index} className="flex items-center gap-4 transition-all cursor-pointer group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-500 transition-colors"></span>
                                    <span className="text-lg font-black uppercase tracking-tighter text-slate-300 group-hover:text-slate-900 transition-colors">{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0) rotate(12deg); }
                    50% { transform: translateY(-15px) rotate(15deg); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 4s ease-in-out infinite;
                }
                @keyframes scroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(-33.33%); }
                }
                .animate-scroll {
                    animation: scroll 30s linear infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    33% { transform: translateY(-10px) rotate(2deg); }
                    66% { transform: translateY(5px) rotate(-2deg); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default HeroSection;
 ```

## File: src/components/ui/LoadingSkeleton.jsx
 ```javascript
import React from 'react';

const LoadingSkeleton = ({ count = 6, type = 'product' }) => {
    if (type === 'product') {
        return (
            <div className="w-full bg-[#F5F5F7] px-6 pb-20 font-sans">
                <div className="max-w-[1400px] mx-auto flex flex-col gap-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(count)].map((_, index) => (
                            <ProductCardSkeleton key={index} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

const ProductCardSkeleton = () => {
    return (
        <div className="flex flex-col gap-4 cursor-pointer relative animate-pulse">
            {/* Image Skeleton */}
            <div className="w-full aspect-[4/3] rounded-2xl bg-gray-200/80 relative shadow-sm overflow-hidden">
                <div className="absolute inset-0 shimmer" />
            </div>

            {/* Info Card Skeleton */}
            <div className="w-full bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                {/* Title & Price */}
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <div className="h-6 bg-gray-200 rounded w-2/3 shimmer" />
                    <div className="h-6 bg-gray-200 rounded w-16 shimmer" />
                </div>

                {/* Bottom Row */}
                <div className="flex justify-between items-center mt-auto">
                    <div className="h-8 bg-gray-200 rounded-full w-28 shimmer" />
                    <div className="h-4 bg-gray-200 rounded w-24 shimmer" />
                </div>
            </div>
        </div>
    );
};

export const DetailSkeleton = () => {
    return (
        <div className="w-full bg-[#F5F5F7] px-6 py-20 min-h-[50vh] animate-pulse">
            <div className="max-w-[1400px] mx-auto flex flex-col gap-10 pt-10">
                {/* Title */}
                <div className="h-24 bg-gray-200 rounded w-3/4 shimmer" />

                {/* Subtitle */}
                <div className="h-8 bg-gray-200 rounded w-1/2 shimmer" />

                {/* Buttons */}
                <div className="flex gap-4">
                    <div className="h-14 bg-gray-200 rounded-full w-40 shimmer" />
                    <div className="h-14 bg-gray-200 rounded-full w-40 shimmer" />
                    <div className="h-14 bg-gray-200 rounded-full w-32 shimmer" />
                </div>
            </div>
        </div>
    );
};

export default LoadingSkeleton;
 ```

## File: src/components/ui/SearchPalette.jsx
 ```javascript
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import productService from '../../services/productService';
import { normalizeProduct } from '../../utils/normalizers';
import docService from '../../services/docService';

const SearchPalette = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Fetch products and docs based on query
    const { data, isLoading } = useQuery({
        queryKey: ['search-palette', query],
        queryFn: async () => {
            if (query.length < 2) return { products: [], docs: [] };
            const [productsRes, docsRes] = await Promise.all([
                productService.getAll(query),
                docService.getAll('', query)
            ]);
            return {
                products: Array.isArray(productsRes) ? productsRes.map(normalizeProduct) : [],
                docs: Array.isArray(docsRes) ? docsRes : []
            };
        },
        enabled: isOpen && query.length > 1
    });

    const products = data?.products || [];
    const docs = data?.docs || [];
    
    // Combine for selection logic
    const allResults = [
        ...products.map(p => ({ ...p, type: 'template' })),
        ...docs.map(d => ({ ...d, type: 'doc' }))
    ];

    // Keyboard shortcuts handled centrally in App.jsx

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setSelectedIndex(0);
        } else {
            setQuery('');
        }
    }, [isOpen]);

    // Handle selection
    const handleSelect = (item) => {
        onClose();
        if (item.type === 'template') {
            navigate(`/templates/${item.id}`);
        } else {
            navigate(`/docs/${item.id}`);
        }
    };

    // Navigation inside results
    useEffect(() => {
        const handleKeys = (e) => {
            if (!isOpen) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && allResults[selectedIndex]) {
                e.preventDefault();
                handleSelect(allResults[selectedIndex]);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [isOpen, allResults, selectedIndex]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 sm:px-6">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl shadow-blue-500/10 border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Search Header */}
                <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-50">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search templates, components, docs..."
                        className="flex-grow bg-transparent border-none outline-none text-xl font-medium text-black placeholder-gray-400"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        esc
                    </div>
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {query.length === 0 ? (
                        <div className="p-10 text-center">
                            <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" strokeDasharray="4 4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-black mb-1">Quick Search</h3>
                            <p className="text-gray-500 text-sm">Find templates, full-stack projects, and documentation instantly.</p>
                        </div>
                    ) : isLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Searching...</span>
                        </div>
                    ) : allResults.length > 0 ? (
                        <div className="space-y-4">
                            {products.length > 0 && (
                                <div className="space-y-1">
                                    <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Templates & Products</div>
                                    {products.map((item, index) => (
                                        <button
                                            key={item.id}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${
                                                index === selectedIndex ? 'bg-primary/5 border-l-4 border-primary translate-x-1' : 'hover:bg-gray-50'
                                            }`}
                                            onClick={() => handleSelect(item)}
                                        >
                                            <div className="w-12 h-12 rounded-xl border border-gray-100 overflow-hidden shrink-0 bg-gray-50">
                                                <img src={item.image} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center justify-between gap-4">
                                                    <h4 className="font-bold text-black truncate">{item.title}</h4>
                                                    <span className="text-primary font-black text-sm">${item.price}</span>
                                                </div>
                                                <p className="text-[13px] text-gray-500 truncate">{item.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {docs.length > 0 && (
                                <div className="space-y-1">
                                    <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Documentation</div>
                                    {docs.map((item, index) => {
                                        const globalIndex = products.length + index;
                                        return (
                                            <button
                                                key={item.id}
                                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${
                                                    globalIndex === selectedIndex ? 'bg-amber-50 border-l-4 border-amber-400 translate-x-1' : 'hover:bg-gray-50'
                                                }`}
                                                onClick={() => handleSelect({ ...item, type: 'doc' })}
                                            >
                                                <div className="w-12 h-12 rounded-xl border border-gray-100 flex items-center justify-center shrink-0 bg-amber-50 text-amber-500">
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18.477 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <h4 className="font-bold text-black truncate">{item.title}</h4>
                                                    <p className="text-[13px] text-gray-500 truncate">{item.description}</p>
                                                </div>
                                                {item.isPremium && (
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded uppercase">Premium</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-20 text-center">
                            <div className="text-gray-300 mb-2">
                                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="font-bold text-gray-500">No results for "{query}"</h3>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 grayscale opacity-60">
                            <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[9px] font-bold shadow-sm">↵</span>
                            <span className="text-[11px] font-bold text-gray-500">to select</span>
                        </div>
                        <div className="flex items-center gap-1.5 grayscale opacity-60">
                            <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[9px] font-bold shadow-sm">↑↓</span>
                            <span className="text-[11px] font-bold text-gray-500">to navigate</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-400">Powered by</span>
                        <span className="text-[11px] font-black text-primary tracking-tight">CODESTUDIO</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchPalette;
 ```

## File: src/components/ui/AIRecommendationModal.jsx
 ```javascript
import React, { useState, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import api from '../../services/api';

const AIRecommendationModal = ({ isOpen, onClose, selectedTechStack }) => {
    const { user } = useContext(AuthContext);
    const { data: rawUser } = useContext(AuthContext); // Just in case
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleFetchAI = async () => {
        setLoading(true);
        setError('');
        setResponse('');
        
        try {
            const stack = selectedTechStack !== 'all' ? selectedTechStack : 'modern web tech';
            const res = await api.get(`/ai/recommend?techStack=${encodeURIComponent(stack)}`);
            setResponse(res.answer || res);
        } catch (err) {
            setError(err.message || 'Failed to fetch recommendations. Ensure you are on a Pro plan.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpgradeClick = () => {
        onClose();
        navigate('/pricing');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all animate-in zoom-in duration-200">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-black flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        AI Curated Path
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="p-6">
                    {!user ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600 mb-4">Please sign in to use personalized AI features.</p>
                        </div>
                    ) : user.subscriptionPlan !== 'pro' && user.role !== 'admin' ? (
                        <div className="text-center py-10 px-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl">
                            <div className="text-3xl mb-4">✨</div>
                            <h3 className="font-black text-blue-900 text-lg mb-2">Pro Feature</h3>
                            <p className="text-blue-700/80 mb-6 text-sm">Upgrade to our Pro Plan to access AI-powered personalized module curations and roadmap generation.</p>
                            <button 
                                onClick={handleUpgradeClick}
                                className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                            >
                                Upgrade Now
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Target Stack</p>
                                <p className="text-sm font-black text-black">{selectedTechStack === 'all' ? 'All Modern Frameworks' : selectedTechStack}</p>
                            </div>
                            
                            {response ? (
                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    <article className="markdown-content text-sm">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {typeof response === 'string' ? response : (response.answer || JSON.stringify(response))}
                                        </ReactMarkdown>
                                    </article>
                                </div>
                            ) : error ? (
                                <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-medium">{error}</div>
                            ) : (
                                <div className="text-center py-10">
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                    ) : (
                                        <button 
                                            onClick={handleFetchAI}
                                            className="bg-primary hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md"
                                        >
                                            Generate AI Curated Recommendations
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIRecommendationModal;
 ```

## File: src/components/ui/StarRating.jsx
 ```javascript
import React from 'react';

const StarRating = ({ rating = 0, numReviews = 0, size = 'sm', showCount = true }) => {
    const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    const textSizes = {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
    };

    const renderStars = () => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <svg key={`full-${i}`} className={`${sizeClasses[size]} text-yellow-400 fill-current`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            );
        }

        // Half star
        if (hasHalfStar) {
            stars.push(
                <div key="half" className="relative">
                    <svg className={`${sizeClasses[size]} text-gray-300 fill-current`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <svg className={`${sizeClasses[size]} text-yellow-400 fill-current absolute top-0 left-0`} viewBox="0 0 20 20" style={{ clipPath: 'inset(0 50% 0 0)' }}>
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </div>
            );
        }

        // Empty stars
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <svg key={`empty-${i}`} className={`${sizeClasses[size]} text-gray-300 fill-current`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            );
        }

        return stars;
    };

    return (
        <div className="flex items-center gap-1">
            <div className="flex items-center">
                {renderStars()}
            </div>
            {showCount && numReviews > 0 && (
                <span className={`${textSizes[size]} text-gray-500 ml-1`}>
                    ({numReviews})
                </span>
            )}
        </div>
    );
};

export default StarRating;
 ```

## File: src/components/ui/ConfirmModal.jsx
 ```javascript
import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
    if (!isOpen) return null;

    const colors = {
        danger: 'bg-red-600 hover:bg-red-700 shadow-red-500/20',
        primary: 'bg-primary hover:bg-blue-600 shadow-blue-500/20',
        black: 'bg-black hover:bg-gray-800 shadow-black/20'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            ></div>
            
            {/* Modal */}
            <div className="relative bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in zoom-in duration-200">
                <div className="p-8 text-center">
                    <div className={`w-16 h-16 ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-primary'} rounded-full flex items-center justify-center mx-auto mb-6 text-2xl`}>
                        {type === 'danger' ? '⚠️' : '❓'}
                    </div>
                    
                    <h3 className="text-xl font-black text-black mb-2">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-8">{message}</p>
                    
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${colors[type] || colors.primary}`}
                        >
                            {confirmText}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-xl font-bold text-gray-400 hover:text-black hover:bg-gray-50 transition-all"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
 ```

## File: src/components/ui/OAuthButton.jsx
 ```javascript
import React from 'react';

const OAuthButton = ({ provider, icon, onClick }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center justify-center gap-3 w-full bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
            <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
            <span>Continue with {provider}</span>
        </button>
    );
};

export default OAuthButton;
 ```

## File: src/components/TemplateGrid.jsx
 ```javascript
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WishlistContext from '../context/WishlistContext';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';
import StarRating from './ui/StarRating';
import { useToast } from '../context/ToastContext';
import { normalizeProduct } from '../utils/normalizers';

const TemplateGrid = ({ items, limit }) => {
  let templates = (items || []).map(normalizeProduct);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useContext(WishlistContext);
  const { addToCart, clearCart } = useContext(CartContext);
  const { purchasedProductIds } = useContext(AuthContext);
  const { success } = useToast();
  const navigate = useNavigate();

  if (limit) {
    templates = templates.slice(0, limit);
  }

  const handleWishlistClick = (e, template) => {
    e.preventDefault();
    e.stopPropagation();
    const id = template.id;
    if (isInWishlist(id)) {
      removeFromWishlist(id);
      success('Removed from wishlist');
    } else {
      addToWishlist(template);
      success('Added to wishlist ❤️');
    }
  };

  const handleAddToCart = (e, template) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(template);
    success(`${template.title} added to cart!`);
  };
  const handleDirectBuy = (e, template) => {
    e.preventDefault();
    e.stopPropagation();
    clearCart();
    addToCart(template);
    success(`Initiating ${template.title} purchase...`);
    navigate('/subscription-checkout', { state: { plan: template } });
  };

  // Tech stack icon mapping
  const getTechIcon = (tech) => {
    const iconMap = {
      'React': '⚛️',
      'Vue': '🟢',
      'Angular': '🔴',
      'Next.js': '▲',
      'Node.js': '🟢',
      'Express': '⚡',
      'MongoDB': '🍃',
      'PostgreSQL': '🐘',
      'TypeScript': '💙',
      'JavaScript': '💛',
      'Python': '🐍',
      'Tailwind': '🎨',
      'React Native': '📱',
      'Flutter': '🦋'
    };
    return iconMap[tech] || '🔧';
  };

  return (
    <div className="w-full bg-[#F5F5F7] px-6 pb-20 font-sans">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-12">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template) => (
            <div
              onClick={() => navigate(`/templates/${template.id}`)}
              key={template.id}
              className="group flex flex-col gap-4 cursor-pointer relative"
            >
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-200 relative shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                <img
                  src={template.image}
                  alt={template.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Status Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                  {template.requiresSubscription && (
                    <span className="bg-amber-400 text-black px-3 py-1 rounded-full text-[10px] font-black shadow-lg border border-white/20">
                      💎 PRO
                    </span>
                  )}
                  {template.isFree && (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      FREE
                    </span>
                  )}
                  {template.isBestseller && !template.isFree && (
                    <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      🏆 BESTSELLER
                    </span>
                  )}
                  {template.isNewProduct && !template.isBestseller && !template.isFree && (
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      ✨ NEW
                    </span>
                  )}
                  {template.isTrending && !template.isNewProduct && !template.isBestseller && !template.isFree && (
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      🔥 TRENDING
                    </span>
                  )}
                  {template.isFeatured && !template.isTrending && !template.isNewProduct && !template.isBestseller && !template.isFree && (
                    <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      ⭐ FEATURED
                    </span>
                  )}
                </div>

                {/* Wishlist Button */}
                <button
                  onClick={(e) => handleWishlistClick(e, template)}
                  aria-label={isInWishlist(template.id) ? "Remove from wishlist" : "Add to wishlist"}
                  className="absolute top-4 right-4 bg-white/80 hover:bg-white backdrop-blur-sm p-2 rounded-full shadow-sm z-10 transition-colors"
                >
                  <svg className={`w-5 h-5 ${isInWishlist(template.id) ? 'text-red-500 fill-current' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                  <div className="bg-white text-black px-6 py-3 rounded-full font-bold text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-lg">
                    View Details
                  </div>
                </div>
              </div>

              <div className="w-full bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4 transition-all duration-300 group-hover:shadow-md border border-gray-100">

                {/* Title & Price */}
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-black tracking-tight mb-1">
                      {template.title}
                    </h3>
                    {/* Star Rating */}
                    {template.rating > 0 && (
                      <StarRating rating={template.rating} numReviews={template.numReviews} size="sm" />
                    )}
                  </div>
                  <span className="text-2xl font-bold text-black ml-4">
                    {template.formattedPrice}
                  </span>
                </div>

                {/* Tech Stack Badges */}
                {template.techStack && template.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {template.techStack.slice(0, 4).map((tech, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                        <span>{getTechIcon(tech)}</span>
                        {tech}
                      </span>
                    ))}
                    {template.techStack.length > 4 && (
                      <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-xs font-medium">
                        +{template.techStack.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Product Type & Actions */}
                <div className="flex justify-between items-center mt-auto pt-2">
                  <div className="flex items-center gap-2">
                    {purchasedProductIds.includes(template.id) ? (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate('/profile'); }}
                        className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-xs font-bold transition-colors hover:bg-green-200"
                      >
                        ✓ Purchased
                      </button>
                    ) : (
                      <button
                        onClick={(e) => template.productType === 'subscription' ? handleDirectBuy(e, template) : handleAddToCart(e, template)}
                        className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-full text-xs font-bold transition-colors"
                      >
                        {template.productType === 'subscription' ? 'Buy Now' : 'Add to Cart'}
                      </button>
                    )}
                    {template.previewUrl && (
                      <a
                        href={template.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white border border-gray-200 text-black px-4 py-2 rounded-full text-xs font-bold transition-all hover:bg-gray-50 flex items-center gap-1.5"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Live Demo
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-gray-400 font-medium text-xs uppercase tracking-wide">
                      {template.category}
                    </span>
                    {template.numSales > 0 && (
                      <span className="text-gray-500 text-xs">
                        {template.numSales} sales
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

        {limit && (
          <div className="flex justify-center mt-4">
            <Link to="/templates" className="flex items-center gap-2 text-black font-bold text-lg hover:gap-3 transition-all">
              View all templates
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default TemplateGrid;
 ```

## File: src/components/TemplateDetails.jsx
 ```javascript
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TemplateDetails = ({ product }) => {
  const {
    description = 'A premium product designed for developer teams.',
    pages = [],
    features = [],
    techStack = [],
    productType = 'template',
    documentationInfo = {},
    liveDemo = '',
    githubRepo = '',
    rating = 0,
    numReviews = 0,
    snippet = '',
    snippetLanguage = '',
    courseOutline = '',
    duration = '',
  } = product || {};

  return (
    <div className="w-full bg-[#F5F5F7] px-6 py-20 font-sans border-b border-gray-200/50">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-6 flex flex-col gap-10">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-black tracking-tight mb-8">
              Product description
            </h2>

            <div className="text-gray-500 text-lg leading-relaxed flex flex-col gap-6">
              <article className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {description}
                </ReactMarkdown>
              </article>

              <div className="flex flex-wrap gap-4 mt-4">
                {liveDemo && (
                  <a href={liveDemo} target="_blank" rel="noopener noreferrer" className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-blue-600 transition-colors">
                    Live Preview
                  </a>
                )}
                {githubRepo && (
                  <a href={githubRepo} target="_blank" rel="noopener noreferrer" className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>

          {techStack.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-black mb-6">Tech Stack</h3>
              <div className="flex flex-wrap gap-3">
                {techStack.map((tech) => (
                  <span key={tech} className="bg-white px-4 py-2 rounded-xl text-sm font-bold border border-gray-100 shadow-sm text-gray-700">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {snippet && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-black">Code Preview</h3>
                {snippetLanguage && <span className="text-xs font-bold uppercase tracking-wider text-primary">{snippetLanguage}</span>}
              </div>
              <pre className="bg-black text-white rounded-2xl p-6 overflow-x-auto text-sm leading-6 shadow-sm">
                <code>{snippet}</code>
              </pre>
            </div>
          )}

          {courseOutline && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-black">Course Outline</h3>
                {duration && <span className="text-sm font-bold text-gray-500">{duration}</span>}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-gray-600 whitespace-pre-wrap leading-relaxed">
                {courseOutline}
              </div>
            </div>
          )}

          {/* Protocol Updates (Changelog) */}
          {product?.changelog?.length > 0 && (
            <div className="mt-12">
              <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight uppercase text-[10px] tracking-[0.3em]">Protocol Updates</h3>
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100">
                {product.changelog.map((entry, index) => (
                  <div key={index} className="relative flex items-start pl-14 group">
                    {/* Timeline Node */}
                    <div className="absolute left-0 w-10 h-10 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center shadow-sm z-10 group-hover:border-primary transition-colors duration-500">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200 group-hover:bg-primary transition-colors duration-500"></div>
                    </div>
                    
                    {/* Change Card */}
                    <div className="flex-1 bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm group-hover:shadow-xl group-hover:shadow-indigo-900/5 transition-all duration-500">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full">Version {entry.version}</span>
                        <div className="flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.date}</span>
                        </div>
                      </div>
                      <ul className="space-y-3">
                        {entry.changes?.map((change, i) => (
                          <li key={i} className="text-sm text-slate-500 font-medium flex items-start gap-3 leading-relaxed">
                            <span className="mt-2 w-1 h-1 rounded-full bg-primary shrink-0"></span>
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 flex flex-col gap-10">
          {features.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-black mb-6">Features</h2>
              <ul className="flex flex-col gap-4 text-gray-500 font-medium">
                {features.map((feature, index) => (
                  <li key={`${feature}-${index}`} className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-1 flex items-center justify-center text-black shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(documentationInfo?.setup || documentationInfo?.deployment) && (
            <div>
              <h2 className="text-2xl font-bold text-black mb-6">Documentation</h2>
              <div className="flex flex-col gap-3">
                {documentationInfo.setup && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Setup Guide Included
                  </div>
                )}
                {documentationInfo.deployment && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Deployment Guide Included
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 flex flex-col gap-10">
          {pages.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-black mb-6">Pages ({pages.length})</h2>
              <ul className="flex flex-col gap-3 text-gray-500 font-medium">
                {pages.map((page) => (
                  <li key={page} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0"></span>
                    <span className="text-sm">{page}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-black mb-4">Product Info</h3>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium capitalize">{productType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rating</span>
                <span className="font-medium flex items-center gap-1">
                  ⭐ {rating} <span className="text-gray-400">({numReviews})</span>
                </span>
              </div>
              {duration && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium">{duration}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateDetails;
 ```

## File: src/components/auth/LoginModal.jsx
 ```javascript
import React, { useState, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import OAuthButton from '../ui/OAuthButton';
import { getOAuthLoginUrl } from '../../services/api';
import FocusLock from 'react-focus-lock';
const LoginModal = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const { login, register } = useContext(AuthContext);

    if (!isOpen) return null;

    const handleOAuth = (provider) => {
        window.location.href = getOAuthLoginUrl(provider);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        let res;
        if (isLogin) {
            res = await login(email, password);
        } else {
            res = await register(name, email, password);
        }

        if (res.success) {
            onClose();
            // navigate('/profile'); // Optional: redirect or just close
        } else {
            setError(res.error || "Authentication failed");
        }
    };
    return (
        <FocusLock returnFocus>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
                    <button
                        onClick={onClose}
                        aria-label="Close modal"
                        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <h2 id="modal-title" className="text-3xl font-black text-white mb-2 text-center">
                    {isLogin ? 'Welcome Back' : 'Join Us'}
                </h2>
                <p className="text-white/60 text-center mb-8">
                    {isLogin ? 'Sign in to continue' : 'Create your account today'}
                </p>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label htmlFor="name-input" className="sr-only">Full Name</label>
                            <input
                                id="name-input"
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/20 text-white placeholder-white/60 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/60 transition-colors"
                                required
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email-input" className="sr-only">Email Address</label>
                        <input
                            id="email-input"
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/20 text-white placeholder-white/60 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/60 transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password-input" className="sr-only">Password</label>
                        <input
                            id="password-input"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/20 text-white placeholder-white/60 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/60 transition-colors"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all transform hover:scale-[1.02]"
                    >
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="relative my-7">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/20"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 text-white/50 font-medium" style={{ backgroundColor: 'transparent' }}>Or continue with</span>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <OAuthButton 
                        provider="Google" 
                        onClick={() => handleOAuth('google')}
                        icon={
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                        } 
                    />
                    <OAuthButton 
                        provider="GitHub" 
                        onClick={() => handleOAuth('github')}
                        icon={
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
                        } 
                    />
                </div>

                <div className="mt-6 text-center">
                    <p className="text-white/60 text-sm">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className="text-white font-bold hover:underline"
                        >
                            {isLogin ? 'Sign Up' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>
            </div>
        </FocusLock>
    );
};

export default LoginModal;
 ```

## File: src/components/TestimonialsGrid.jsx
 ```javascript
import React from 'react';
import testimonialService from '../services/testimonialService';

const TestimonialsGrid = () => {
  const [testimonials, setTestimonials] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const data = await testimonialService.getApproved();
        setTestimonials(data);
      } catch (error) {
        console.error("Failed to fetch testimonials:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-[#F5F5F7] px-6 py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return null; // Or show a default section
  }

  return (
    <div className="w-full bg-[#F5F5F7] px-6 py-20 font-sans">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {testimonials.map((item) => (
          <div key={item.id} className="bg-white rounded-[2rem] p-8 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-shadow duration-300">

            {/* Top Section: User Info & Content */}
            <div>
              {/* Header: Avatar, Name, Stars */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <img
                    src={item.user?.avatar || `https://ui-avatars.com/api/?name=${item.user?.name || 'User'}&background=random`}
                    alt={item.user?.name || 'User'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-black text-sm leading-tight">
                      {item.user?.name || 'Verified User'}
                    </span>
                    <span className="text-primary text-xs font-medium">
                      @{item.user?.email?.split('@')[0] || 'user'}
                    </span>
                  </div>
                </div>

                {/* Stars based on rating */}
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < item.rating ? 'text-primary' : 'text-gray-200'}`} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <p className="text-gray-800 text-[15px] leading-relaxed font-normal italic">
                "{item.content}"
              </p>
            </div>

            {/* Bottom Section: Date */}
            <div className="mt-8 pt-0 flex items-center gap-2 text-xs font-medium text-black">
              <span>Customer</span>
              <span className="text-gray-300 text-sm">//</span>
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
};

export default TestimonialsGrid; ```

## File: src/components/ErrorBoundary.jsx
 ```javascript
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(_error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4">
                    <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-black mb-2">Oops! Something went wrong</h2>
                        <p className="text-gray-600 mb-6">
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="text-left bg-gray-50 rounded-lg p-4 mb-4">
                                <summary className="font-bold text-sm cursor-pointer text-gray-700 mb-2">
                                    Error Details
                                </summary>
                                <pre className="text-xs text-red-600 overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 bg-primary text-white px-6 py-3 rounded-full font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex-1 bg-gray-100 text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors"
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
 ```

## File: src/components/layout/Footer.jsx
 ```javascript
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="w-full bg-[#1A1A1A] text-white px-6 py-20 font-sans">
            <div className="max-w-[1400px] mx-auto flex flex-col gap-16">

                {/* 1. TOP CTA SECTION */}
                <div className="flex flex-col gap-8">
                    <h2 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight leading-[0.95]">
                        Customize and build a <br className="hidden lg:block" />
                        stunning website today.
                    </h2>

                    {/* Features List */}
                    <div className="flex flex-wrap gap-6 md:gap-8">
                        {['Instant access', 'Responsive design', 'No coding required'].map((item) => (
                            <div key={item} className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-lg font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Separator Line */}
                <div className="w-full h-px border-t border-dashed border-white/20" />

                {/* 2. MIDDLE SECTION: Contact & Newsletter */}
                <div className="flex flex-col lg:flex-row justify-between gap-16 lg:gap-0">

                    {/* Left: Logo & Email */}
                    <div className="flex flex-col gap-10 lg:w-1/3">

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" fill="none" />
                                    <rect x="2" y="11" width="20" height="2" fill="white" />
                                    <path d="M12 12V22" stroke="white" strokeWidth="2" />
                                </svg>
                            </div>
                            <span className="text-white font-bold text-xl tracking-tight">
                                FlowGrid
                            </span>
                        </Link>

                        {/* Email Contact */}
                        <div>
                            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-2">DROP US A LINE</p>
                            <a href="mailto:hello@flowgrid.com" className="text-2xl md:text-3xl font-medium hover:text-primary transition-colors">
                                hello@flowgrid.com
                            </a>
                        </div>
                    </div>

                    {/* Right: Newsletter Form */}
                    <div className="flex flex-col gap-6 lg:w-1/2">
                        <h3 className="text-3xl font-bold tracking-tight">
                            Sign up for our newsletter:
                        </h3>

                        {/* Benefits */}
                        <ul className="flex flex-col gap-2">
                            <li className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                <span className="text-gray-300 font-medium">Be the first to access new template releases</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                <span className="text-gray-300 font-medium">Unlock special discounts</span>
                            </li>
                        </ul>

                        {/* Input Field */}
                        <form className="flex flex-col sm:flex-row gap-4 mt-2">
                            <input
                                type="email"
                                placeholder="Type your email"
                                className="w-full bg-white/10 border border-transparent rounded-full px-6 py-4 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary transition-all"
                            />
                            <button className="bg-[#1C4ED8] hover:bg-primary text-white font-semibold px-8 py-4 rounded-full transition-colors whitespace-nowrap">
                                Submit
                            </button>
                        </form>
                    </div>

                </div>

                {/* Separator Line */}
                <div className="w-full h-px border-t border-dashed border-white/20" />

                {/* 3. BOTTOM SECTION: Socials & Links */}
                <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-8">

                    {/* Social Icons */}
                    <div className="flex gap-4">
                        {/* Twitter/X Icon */}
                        <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        </a>
                        {/* Dribbble/Other Icon */}
                        <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                        </a>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm font-medium text-white/90">
                        {['Changelog', '404', 'LinkedIn', 'Instagram', 'Twitter X', 'Dribbble'].map((link) => (
                            <a key={link} href="#" className="hover:text-primary transition-colors">
                                {link}
                            </a>
                        ))}
                    </nav>

                </div>

            </div>
        </footer>
    );
};

export default Footer; ```

## File: src/components/layout/Navbar.jsx
 ```javascript
import React, { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import CartContext from '../../context/CartContext';
import WishlistContext from '../../context/WishlistContext';
import ConfigContext from '../../context/ConfigContext';
import ConfirmModal from '../ui/ConfirmModal';
import { FEATURES } from '../../config/features';

const AnnouncementCarousel = ({ messages = [] }) => {
    const [index, setIndex] = React.useState(0);

    React.useEffect(() => {
        if (messages.length <= 1) return;
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % messages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [messages.length]);

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {messages.map((msg, i) => (
                <div
                    key={i}
                    className={`absolute inset-0 flex items-center justify-center px-6 transition-all duration-1000 ease-in-out transform ${i === index
                            ? 'translate-y-0 opacity-100'
                            : i < index
                                ? '-translate-y-full opacity-0'
                                : 'translate-y-full opacity-0'
                        }`}
                >
                    <span className="truncate max-w-[90vw]">{msg}</span>
                    {messages.length > 1 && (
                        <div className="ml-4 flex gap-1 items-center opacity-50 shrink-0">
                            {messages.map((_, dotIdx) => (
                                <div
                                    key={dotIdx}
                                    className={`w-1 h-1 rounded-full bg-white transition-all duration-300 ${dotIdx === index ? 'w-3 opacity-100' : 'opacity-40'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const FloatingNavbar = ({ onSearchClick }) => {
    const { user, logout } = useContext(AuthContext);
    const { cartItems } = useContext(CartContext);
    const { wishlistItems } = useContext(WishlistContext);
    const { config } = useContext(ConfigContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            navigate(`/templates?search=${searchQuery}`);
        }
    };

    const navLinks = [
        { name: 'Templates', path: '/templates' },
        ...(config?.features?.docs ? [{ name: 'Docs', path: '/docs' }] : []),
        { name: 'Features', path: '/features' },
        ...(config?.features?.testimonials ? [{ name: 'Testimonials', path: '/testimonials' }] : []),
        ...(config?.features?.subscriptions ? [{ name: 'Memberships', path: '/pricing' }] : []),
        { name: 'FAQ', path: '/faq' },
        { name: 'Contact', path: '/contact' },
        { name: 'Community', path: '/chat' },
    ];

    return (
        <>
            {/* Announcement Bar */}
            {config?.showAnnouncement && config?.announcements?.length > 0 && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-white text-xs font-bold shadow-md tracking-wide h-10 flex items-center justify-center overflow-hidden">
                    <AnnouncementCarousel messages={config.announcements} />
                </div>
            )}

            {/* Navbar */}
            <div className={`fixed left-0 right-0 z-40 flex justify-center px-4 pointer-events-none transition-all duration-300 ${config?.showAnnouncement && config?.announcements?.length > 0 ? 'top-12' : 'top-6'}`}>
                <div className="w-full max-w-[1400px] flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-auto">

                    <nav className="bg-black rounded-full p-2 pl-6 pr-2 flex items-center gap-6 shadow-2xl w-full md:w-auto justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="relative flex items-center justify-center w-8 h-8 bg-primary rounded-full overflow-hidden shrink-0">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" fill="none" />
                                    <rect x="2" y="11" width="20" height="2" fill="white" />
                                    <path d="M12 12V22" stroke="white" strokeWidth="2" />
                                </svg>
                            </div>
                            <span className="text-white font-bold text-xl tracking-tight select-none">
                                CodeStudio
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <ul className="hidden lg:flex items-center gap-2">
                            {navLinks.map((item) => (
                                <li key={item.name}>
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `block text-white text-sm font-medium px-5 py-2.5 rounded-full border transition-all duration-200 ${isActive ? 'bg-white/10 border-white/40' : 'border-white/10 hover:border-white/40 hover:bg-white/5'
                                            }`
                                        }
                                    >
                                        {item.name}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>

                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </nav>

                    {/* User Actions */}
                    <div className="hidden md:flex bg-white rounded-full p-2 pr-2 items-center gap-2 shadow-lg border border-gray-100">
                        {/* Search Trigger */}
                        <button 
                            onClick={onSearchClick}
                            className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-all group border border-transparent hover:border-gray-200"
                        >
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-colors">Search...</span>
                            <div className="flex items-center gap-1">
                                <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-400 shadow-sm">
                                    {(window.navigator.platform?.toUpperCase().indexOf('MAC') >= 0 || window.navigator.userAgent?.toUpperCase().indexOf('MAC') >= 0) ? '⌘' : 'Ctrl'}
                                </span>
                                <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-400 shadow-sm">K</span>
                            </div>
                        </button>

                        {/* Cart & Wishlist */}
                        {config?.features?.wishlist && (
                            <Link to="/wishlist" className="relative hidden md:flex w-10 h-10 items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                                <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                {wishlistItems.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {wishlistItems.length}
                                    </span>
                                )}
                            </Link>
                        )}

                        <Link to="/cart" className="relative hidden md:flex w-10 h-10 items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {cartItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {cartItems.length}
                                </span>
                            )}
                        </Link>

                        {/* User Profile / Login */}
                        <div className="hidden md:flex">
                            {user ? (
                                <div className="relative group">
                                    <div className={`p-[1.5px] rounded-full transition-all duration-500 ${user.subscriptionPlan === 'pro' ? 'bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-600 shadow-[0_0_20px_rgba(251,191,36,0.2)] scale-110' : 'bg-gray-100'}`}>
                                        <button className="w-9 h-9 bg-black rounded-full flex items-center justify-center text-white font-black text-xs border border-white/5 relative overflow-hidden group-hover:scale-95 transition-transform">
                                            {user.name.charAt(0).toUpperCase()}
                                            {user.subscriptionPlan === 'pro' && (
                                                <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/10 to-transparent opacity-50"></div>
                                            )}
                                        </button>
                                    </div>
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                                        <Link to="/profile" className="block px-4 py-3 hover:bg-gray-50 transition-colors text-black font-medium border-b">
                                            Profile
                                        </Link>
                                        {user.role === 'admin' && (
                                            <>
                                                <Link to="/admin" className="block px-4 py-3 hover:bg-gray-50 transition-colors text-primary font-medium border-b">
                                                    🛡️ Admin Panel
                                                </Link>
                                                <Link to="/admin/dashboard" className="block px-4 py-3 hover:bg-gray-50 transition-colors text-black font-medium border-b">
                                                    Products Dashboard
                                                </Link>
                                            </>
                                        )}
                                        <button onClick={() => setIsLogoutModalOpen(true)} className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors text-red-600 font-medium">
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all hover:-translate-y-0.5"
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={logout}
                title="Log Out?"
                message="Are you sure you want to sign out of your account? You will need to log in again to access your downloads and settings."
                confirmText="Log Out"
                type="danger"
            />

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className={`fixed left-4 right-4 bg-black/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-30 pointer-events-auto lg:hidden transition-all duration-300 ${config?.showAnnouncement && config?.announcements?.length > 0 ? 'top-32' : 'top-24'}`}>
                    <div className="p-6 space-y-2">
                        {navLinks.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `block px-4 py-3 rounded-xl font-medium transition-all ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`
                                }
                            >
                                {item.name}
                            </NavLink>
                        ))}
                        <div className="pt-4 border-t border-white/10">
                            <Link
                                to="/contact"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-4 py-3 rounded-xl font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all"
                            >
                                Contact
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};


export default FloatingNavbar;
 ```

## File: src/components/layout/BottomNav.jsx
 ```javascript
import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import CartContext from '../../context/CartContext';
import WishlistContext from '../../context/WishlistContext';

const BottomNav = () => {
    const { user } = useContext(AuthContext);
    const { cartItems } = useContext(CartContext);
    const { wishlistItems } = useContext(WishlistContext);

    return (
        <nav className="fixed bottom-6 left-6 right-6 z-50 md:hidden">
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-2 shadow-2xl flex items-center justify-around relative">
                
                {/* Home */}
                <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
                </NavLink>

                {/* Templates */}
                <NavLink to="/templates" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Browse</span>
                </NavLink>

                {/* Wishlist */}
                <NavLink to="/wishlist" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-2xl transition-all relative ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Saved</span>
                    {wishlistItems.length > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-black">
                            {wishlistItems.length}
                        </span>
                    )}
                </NavLink>

                {/* Cart */}
                <NavLink to="/cart" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-2xl transition-all relative ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Cart</span>
                    {cartItems.length > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-black">
                            {cartItems.length}
                        </span>
                    )}
                </NavLink>

                {/* Profile */}
                <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    <div className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center border ${user ? 'border-primary bg-primary/20' : 'border-gray-500 bg-gray-500/20'}`}>
                        {user ? (
                            <span className="text-[10px] font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Me</span>
                </NavLink>

            </div>
        </nav>
    );
};

export default BottomNav;
 ```

## File: src/components/ProBanner.jsx
 ```javascript
import React from 'react';
import { Link } from 'react-router-dom';

const ProBanner = () => {
    return (
        <section className="bg-[#F5F5F7] py-20 px-6">
            <div className="max-w-[1400px] mx-auto">
                <div className="bg-black rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden group">
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full group-hover:bg-indigo-600/30 transition-all duration-700"></div>
                    <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-slate-400/10 blur-[100px] rounded-full"></div>

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10 mb-8 backdrop-blur-md">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                                <span className="text-xs font-bold tracking-widest text-white/80">Pro Membership Available Now</span>
                            </div>
                            
                            <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1] tracking-tight text-white">
                                One pass. <br />
                                <span className="text-indigo-400 font-black">Everything</span> unlocked.
                            </h2>
                            
                            <p className="text-xl text-slate-400 font-medium mb-12 max-w-lg leading-relaxed">
                                Join the elite tier of developers and creators. Get unlimited access to premium technical guides, AI tools, and zero-commission sales.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <Link 
                                    to="/pricing" 
                                    className="w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 transition-all duration-300 shadow-xl shadow-indigo-600/20 outline-none"
                                >
                                    View Pro Tiers
                                </Link>
                                <span className="text-slate-500 font-bold hidden sm:block">Starting at ₹2,499/mo</span>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="grid grid-cols-2 gap-4">
                                <FeatureCard icon="⚡" title="All-Access Docs" desc="Every guide, now fully unlocked" />
                                <FeatureCard icon="✨" title="AI Roadmap" desc="Personalized curation engine" />
                                <FeatureCard icon="🎨" title="Pro Templates" desc="Source files for core assets" />
                                <FeatureCard icon="🤝" title="0% Commission" desc="Keep 100% of your earnings" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm hover:border-white/20 transition-all hover:bg-white/10 group/card">
        <div className="text-3xl mb-4 group-hover/card:scale-110 transition-transform">{icon}</div>
        <h4 className="text-lg font-black text-white mb-2">{title}</h4>
        <p className="text-sm text-gray-500 font-medium leading-normal">{desc}</p>
    </div>
);

export default ProBanner;
 ```

## File: src/components/ProductHeader.jsx
 ```javascript
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import CartContext from '../context/CartContext';
import WishlistContext from '../context/WishlistContext';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfigContext from '../context/ConfigContext';
import StarRating from './ui/StarRating';
import { normalizeProduct } from '../utils/normalizers';

const ProductHeader = ({ product }) => {
  const normalizedProduct = normalizeProduct(product);
  const { addToCart } = useContext(CartContext);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useContext(WishlistContext);
  const { purchasedProductIds, user } = useContext(AuthContext);
  const { config } = useContext(ConfigContext);
  const navigate = useNavigate();
  const { success } = useToast();

  const handleAddToCart = () => {
    addToCart(product);
    success(`${product.title} added to cart!`);
  };

  const handleBuyNow = () => {
    addToCart(product);
    navigate('/cart');
  };

  const handleWishlist = () => {
    const id = normalizedProduct.id;
    if (isInWishlist(id)) {
      removeFromWishlist(id);
      success('Removed from wishlist');
    } else {
      addToWishlist(product);
      success('Added to wishlist ❤️');
    }
  };

  const {
    title = "Untitled product",
    description = "Explore the full details for this product.",
    formattedPrice: price = "₹0",
    previewUrl = ""
  } = normalizedProduct || {};

  const id = normalizedProduct ? normalizedProduct.id : null;
  const socialProof = config?.socialProof ?? {};
  const avatars = Array.isArray(socialProof.avatarImages) ? socialProof.avatarImages : [];

  return (
    <div className="w-full bg-[#F8FAFC] px-6 py-20 lg:py-32 flex flex-col justify-center font-sans border-b border-gray-100">
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* LEFT SECTOR: LOGIC & ACTION */}
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-6">
              {/* Category Breadcrumb */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{normalizedProduct.productType || 'Template'}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{normalizedProduct.category}</span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-slate-900 tracking-tighter leading-[0.9]">
                {title}
              </h1>
              
              <p className="text-slate-500 text-xl font-medium max-w-xl leading-relaxed">
                {description}
              </p>

              {/* Trust Signal Cluster */}
              <div className="flex items-center gap-8">
                {normalizedProduct && normalizedProduct.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={normalizedProduct.rating} numReviews={normalizedProduct.numReviews} size="md" />
                  </div>
                )}
                {normalizedProduct && normalizedProduct.numSales > 0 && (
                  <div className="flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">⚡ {normalizedProduct.numSales} Deployments</span>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION CENTER */}
            <div className="flex flex-col gap-8">
              <div className="flex flex-wrap items-center gap-5">
                {purchasedProductIds.includes(normalizedProduct.id) ? (
                  <>
                    <button
                      onClick={() => navigate('/profile')}
                      className="bg-emerald-500 text-white px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      ✓ Owned Intelligence
                    </button>
                    {normalizedProduct.fileURL && (
                      <a
                        href={normalizedProduct.fileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-900 text-white px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-slate-900/10 active:scale-95 transition-all flex items-center gap-3"
                      >
                        Source Code 📦
                      </a>
                    )}
                  </>
                ) : user?.subscriptionPlan === 'pro' && (normalizedProduct.requiresSubscription || normalizedProduct.isFree) ? (
                  <>
                    <a
                      href={normalizedProduct.fileURL || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-amber-400 text-black px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-3"
                    >
                      Pro Entitlement — Unlock 🔓
                    </a>
                    <button
                      onClick={handleWishlist}
                      className="bg-white border border-slate-200 text-slate-900 px-8 py-5 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                      Save to Library
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleBuyNow}
                      className="bg-primary hover:bg-blue-600 text-white px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-blue-500/20 active:scale-95 transition-all"
                    >
                      {normalizedProduct.isFree ? 'Get for Free' : `Acquire Now — ${price}`}
                    </button>
                    <button
                      onClick={handleAddToCart}
                      className="bg-white border border-slate-200 text-slate-900 px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                      Add to Cart
                    </button>
                  </>
                )}

                {/* Secondary Actions */}
                <div className="flex items-center gap-3">
                    <button
                      onClick={handleWishlist}
                      className={`p-5 rounded-full transition-all active:scale-90 border ${isInWishlist(id) ? 'bg-red-50 border-red-100 text-red-500 shadow-xl shadow-red-500/10' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-900'}`}
                    >
                      <svg className={`w-6 h-6 ${isInWishlist(id) ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    {previewUrl && (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-5 rounded-full bg-white border border-slate-100 text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                        title="Live Preview"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                </div>
              </div>

              {/* Secure Transaction Link */}
              <div className="flex items-center gap-3 text-slate-400 font-bold uppercase text-[9px] tracking-widest">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm3 12H9v-2h6v2zm0-4H9V8h6v2z" />
                  </svg>
                  Encrypted Transaction
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>Razorpay Gateway</span>
              </div>
            </div>
          </div>

          {/* RIGHT SECTOR: VISUAL ASSET */}
          <div className="relative group lg:block">
            <div className="relative z-10 w-full aspect-[4/3] bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-50 overflow-hidden transform transition-transform duration-700 hover:scale-[1.02]">
                <img 
                    src={normalizedProduct.image} 
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none"></div>
            </div>
            
            {/* Social Verification Cluster */}
            {(avatars.length > 0) && (
              <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-indigo-900/10 border border-slate-50 flex items-center gap-6 z-20 animate-in slide-in-from-right-8 duration-700">
                <div className="flex -space-x-3">
                  {avatars.slice(0, 4).map((src, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm">
                       <img src={src} className="w-full h-full object-cover" alt="User" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                     {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-amber-400 text-xs">★</span>
                     ))}
                  </div>
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest mt-1">12k+ Trusted</span>
                </div>
              </div>
            )}
            
            {/* Asset Node (Floating) */}
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-slate-900 rounded-[2rem] shadow-2xl flex items-center justify-center text-3xl rotate-[-12deg] animate-bounce-slow z-20">💎</div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductHeader;
 ```

## File: src/components/admin/SubscriptionManager.jsx
 ```javascript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const SubscriptionManager = () => {
    const { error: toastError } = useToast();

    const { data: subscribers, isLoading } = useQuery({
        queryKey: ['admin-subscribers'],
        queryFn: async () => {
            const users = await api.get('/admin/users');
            // Filter users who are on the pro plan
            return users.filter(u => u.subscriptionPlan === 'pro');
        }
    });

    if (isLoading) return (
        <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Membership Data...</span>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 rounded-bl-full -translate-y-4 translate-x-4"></div>
                <div className="relative z-10">
                    <h2 className="text-xl font-black text-black tracking-tight leading-none mb-3">Membership Management</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-60">Subscriber Registry & Tier Management</p>
                </div>
                <div className="relative z-10 flex items-center gap-2.5 bg-black text-white px-5 py-2.5 rounded-xl shadow-lg shadow-black/10">
                    <span className="text-base leading-none">💎</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{subscribers?.length || 0} Pro Elite</span>
                </div>
            </div>

            <div className="grid gap-4">
                {subscribers?.map((user) => (
                    <div key={user.id} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full group-hover:bg-amber-100 transition-colors"></div>
                        
                        <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-md">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <h3 className="text-base font-black text-black tracking-tight leading-none">{user.name}</h3>
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase rounded-lg border border-amber-100">Pro Elite</span>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 mb-3">{user.email}</p>
                                
                                <div className="flex flex-wrap gap-3">
                                    <div className="px-3 py-1.5 bg-gray-50 rounded-lg flex items-center gap-2 border border-gray-100">
                                        <span className="text-[8px] font-bold text-gray-400 uppercase">Registry:</span>
                                        <span className="text-[8px] font-black text-black">{new Date(user.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="px-3 py-1.5 bg-gray-50 rounded-lg flex items-center gap-2 border border-gray-100">
                                        <span className="text-[8px] font-bold text-gray-400 uppercase">Status:</span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                                            <span className="text-[8px] font-black text-black uppercase">Authorized</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 pt-4 md:pt-0">
                                <button className="px-5 py-2.5 bg-black text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 shadow-md">
                                    Benefits
                                </button>
                                <button className="w-9 h-9 bg-white border border-gray-100 text-gray-400 rounded-lg hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {(!subscribers || subscribers.length === 0) && (
                    <div className="py-24 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-100">
                        <div className="text-4xl mb-4 grayscale opacity-20">💎</div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">Elite Registry Exhausted</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubscriptionManager;
 ```

## File: src/components/admin/LicenseManager.jsx
 ```javascript
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import licenseService from '../../services/licenseService';
import { useToast } from '../../context/ToastContext';

const LicenseManager = () => {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: licenses, isLoading } = useQuery({
        queryKey: ['admin', 'licenses'],
        queryFn: () => licenseService.getAll(),
    });

    const revokeMutation = useMutation({
        mutationFn: (id) => licenseService.revoke(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'licenses'] });
            success('License access revoked');
        },
    });

    const filteredLicenses = licenses?.filter(l => 
        l.key?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-black tracking-tight">License Keys</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{filteredLicenses.length} active licenses found</p>
                </div>
                <div className="w-full md:w-96 px-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3">
                    <span className="text-lg opacity-40">🔍</span>
                    <input 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search key or owner..." 
                        className="bg-transparent border-none outline-none font-bold text-xs flex-1 text-black placeholder-gray-300" 
                    />
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <th className="px-10 py-6">License Key</th>
                                <th className="px-10 py-6">Customer</th>
                                <th className="px-10 py-6 text-center">Version</th>
                                <th className="px-10 py-6 text-center">Status</th>
                                <th className="px-10 py-6 text-right">Settings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {isLoading ? (
                                <tr><td colSpan="5" className="py-20 text-center text-gray-300 font-bold uppercase text-[10px]">Loading licenses...</td></tr>
                            ) : (
                                filteredLicenses.map(l => (
                                    <tr key={l.id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3 font-mono text-[10px] font-black text-black tracking-widest bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 w-fit">
                                                {l.key?.match(/.{1,4}/g)?.join('-')}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="font-bold text-black">{l.user?.name || 'Anonymous'}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{l.user?.email}</p>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">V{l.version || '1.0'}</span>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${l.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${l.status === 'active' ? 'text-emerald-500' : 'text-red-500'}`}>{l.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button 
                                                onClick={() => revokeMutation.mutate(l.id)} 
                                                disabled={l.status !== 'active'}
                                                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-400 text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-black hover:text-white hover:border-black transition-all disabled:opacity-30 active:scale-95"
                                            >
                                                Revoke
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LicenseManager;
 ```

## File: src/components/admin/OrderList.jsx
 ```javascript
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import orderService from '../../services/orderService';
import { normalizeOrder } from '../../utils/normalizers';
import { useToast } from '../../context/ToastContext';

const OrderList = () => {
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();

    const { data: orderData, isLoading: loading, error } = useQuery({
        queryKey: ['admin-orders', statusFilter],
        queryFn: () => orderService.adminList(statusFilter),
    });

    const updateOrderMutation = useMutation({
        mutationFn: ({ id, data }) => orderService.adminUpdate(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            success('Order updated');
        },
        onError: () => toastError('Update failed'),
    });

    const orders = Array.isArray(orderData) ? orderData.map(normalizeOrder) : [];

    const handleUpdateStatus = (id, field, value) => {
        updateOrderMutation.mutate({ id, data: { [field]: value } });
    };

    if (loading) return (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-20 text-center animate-pulse">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Orders...</p>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-12 text-red-500">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Connection Error</h3>
            <p className="text-sm font-medium">{error.message}</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-700 relative" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            {/* Order Detail Drawer - Densified */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all" onClick={() => setSelectedOrder(null)}></div>
                    <div className="w-full max-w-lg bg-white h-full relative z-10 shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-black tracking-tighter uppercase leading-none">Order Manifest</h3>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1.5 opacity-60">REF-ID: {selectedOrder.id}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm text-xs">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {/* Customer Profile */}
                            <section className="space-y-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-l-3 border-black pl-3">Account</p>
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4 group hover:bg-white hover:shadow-lg transition-all duration-300">
                                    <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center text-lg font-black">{selectedOrder.user?.name?.charAt(0)}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-black text-base tracking-tight truncate leading-none mb-1">{selectedOrder.user?.name || 'Anonymous'}</p>
                                        <p className="text-[10px] text-gray-400 font-bold truncate">{selectedOrder.user?.email}</p>
                                    </div>
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded-lg uppercase">Auth</span>
                                </div>
                            </section>

                            {/* Inventory Breakdown */}
                            <section className="space-y-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-l-3 border-black pl-3">Assets</p>
                                <div className="grid gap-2">
                                    {(selectedOrder.items || []).map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-sm">💎</div>
                                                <div>
                                                    <p className="text-xs font-black text-black tracking-tight leading-none mb-1">{item.product?.title || 'Asset'}</p>
                                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">DS-Inventory</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-black text-black tracking-tighter">₹{item.price}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Financial Summary */}
                            <section className="space-y-4 pt-4 border-t border-gray-100">
                                <div className="bg-black text-white p-8 rounded-3xl shadow-xl flex justify-between items-center relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full -translate-y-2 translate-x-2"></div>
                                    <div className="relative z-10">
                                        <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-2">Net Value</p>
                                        <p className="text-3xl font-black tracking-tighter">{selectedOrder.formattedTotalPrice}</p>
                                    </div>
                                    <div className="relative z-10 text-right">
                                        <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-2">Settlement</p>
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${selectedOrder.paymentStatus === 'paid' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-amber-500 text-white border-amber-400'}`}>
                                            {selectedOrder.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                            </section>
                        </div>
                        <div className="p-8 border-t border-gray-50 flex gap-3 bg-gray-50/50">
                             <button onClick={() => { handleUpdateStatus(selectedOrder.id, 'paymentStatus', 'paid'); setSelectedOrder(p => ({...p, paymentStatus: 'paid'})) }} className="flex-1 py-3.5 bg-black text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg hover:bg-gray-900 transition-all">Settle</button>
                             <button onClick={() => { handleUpdateStatus(selectedOrder.id, 'entitlementStatus', 'revoked'); setSelectedOrder(p => ({...p, entitlementStatus: 'revoked'})) }} className="flex-1 py-3.5 bg-white border border-gray-100 text-red-500 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-red-50 transition-all">Revoke</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm overflow-hidden group relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 rounded-bl-full -translate-y-4 translate-x-4"></div>
                <div className="relative z-10">
                    <h2 className="text-xl font-black text-black tracking-tight leading-none mb-3">Financial Ledger</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{orders.length} Global Entries Recorded</p>
                </div>
                <div className="relative z-10 flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100 shadow-inner">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-3">Registry</span>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-black transition-all shadow-sm"
                    >
                        <option value="all">Comprehensive</option>
                        <option value="paid">Settled</option>
                        <option value="pending">Escrow</option>
                        <option value="failed">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-gray-100">
                                <th className="px-6 py-5">Reference</th>
                                <th className="px-6 py-5">User Account</th>
                                <th className="px-6 py-5 text-center">Net Impact (₹)</th>
                                <th className="px-6 py-5 text-center">Status</th>
                                <th className="px-6 py-5 text-right">Registry</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50/30 transition-all group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-black transition-all"></div>
                                            <span className="text-[10px] font-black text-gray-500 font-mono tracking-tighter uppercase">ID-{String(order.id || '').slice(-8)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="min-w-0">
                                            <p className="font-black text-black text-sm tracking-tight leading-none mb-1">{order.user?.name || 'Guest'}</p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{order.user?.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center font-black text-black text-sm tracking-tighter">
                                        {order.formattedTotalPrice}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                         <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all duration-300 ${order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-500 group-hover:text-white'}`}>
                                            {order.paymentStatus}
                                         </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button 
                                            onClick={() => setSelectedOrder(order)}
                                            className="px-5 py-2.5 bg-white border border-gray-100 text-gray-400 hover:text-black hover:border-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm group-hover:bg-gray-50/50"
                                        >
                                            Examine
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrderList;
 ```

## File: src/components/admin/UserList.jsx
 ```javascript
import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userService from '../../services/userService';
import { normalizeUser } from '../../utils/normalizers';
import { useToast } from '../../context/ToastContext';

const UserList = () => {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();

    const { data: userData, isLoading: loading, error } = useQuery({
        queryKey: ['users'],
        queryFn: () => userService.adminList(),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => userService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            success('User profile updated');
        },
        onError: () => toastError('Failed to update user identity'),
    });

    const users = useMemo(() => 
        Array.isArray(userData) ? userData.map(normalizeUser) : [],
    [userData]);

    const handleUpdate = (id, field, value) => {
        updateMutation.mutate({ id, data: { [field]: value } });
    };

    if (loading) return (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-20 text-center animate-pulse">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Users...</p>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-12 text-red-500">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Connection Error</h3>
            <p className="text-sm font-medium">{error.message}</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-700 relative" style={{ fontFamily: "'Inter', sans-serif" }}>
            
             <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-24 h-24 bg-gray-50/50 rounded-br-full -translate-y-4 -translate-x-4"></div>
                <div className="relative z-10">
                    <h2 className="text-xl font-black text-black tracking-tight leading-none mb-3">Account Registry</h2>
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest">{users.length} Active Profiles</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Live Registry
                        </span>
                    </div>
                </div>
                <div className="relative z-10 flex gap-3">
                    <button onClick={() => success('Exporting CSV...')} className="px-6 py-2.5 bg-gray-50 text-gray-500 hover:text-black hover:bg-white border border-gray-100 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all shadow-sm">Export</button>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-gray-100">
                                <th className="px-6 py-5">Member Identity</th>
                                <th className="px-6 py-5 text-center">Authorization</th>
                                <th className="px-6 py-5 text-center">Subscription</th>
                                <th className="px-6 py-5 text-center">Status</th>
                                <th className="px-6 py-5 text-right">Access</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/30 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-sm text-black uppercase shadow-inner group-hover:scale-105 transition-transform duration-300">
                                                {user.name?.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-black text-sm tracking-tight leading-none mb-1">{user.name}</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <select 
                                            value={user.role} 
                                            onChange={(e) => handleUpdate(user.id, 'role', e.target.value)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all outline-none shadow-sm cursor-pointer appearance-none text-center ${
                                                user.role === 'admin' 
                                                ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                                : user.role === 'contributor'
                                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                : 'bg-gray-100 text-gray-600 border-gray-100'
                                            }`}
                                        >
                                            <option value="user">USER</option>
                                            <option value="contributor">STAFF</option>
                                            <option value="admin">DIRECTOR</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <select 
                                            value={user.subscriptionPlan} 
                                            onChange={(e) => handleUpdate(user.id, 'subscriptionPlan', e.target.value)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all outline-none shadow-sm cursor-pointer appearance-none text-center ${
                                                user.subscriptionPlan === 'enterprise' 
                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                                                : user.subscriptionPlan === 'pro'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-white text-gray-400 border-gray-100'
                                            }`}
                                        >
                                            <option value="free">FREE</option>
                                            <option value="pro">PRO</option>
                                            <option value="enterprise">CORP</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => handleUpdate(user.id, 'suspended', !user.suspended)}
                                            className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${
                                                user.suspended 
                                                ? 'bg-red-50 text-red-600 border-red-100 hover:bg-black hover:text-white' 
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-red-50 hover:text-red-700'
                                            }`}
                                        >
                                            {user.suspended ? 'REVOKED' : 'ACTIVE'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => success(`Tokens refreshed for ${user.email}`)}
                                            className="w-8 h-8 bg-white border border-gray-100 text-gray-400 hover:text-black hover:border-black rounded-lg transition-all shadow-sm flex items-center justify-center group/btn"
                                            title="Reset"
                                        >
                                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserList;
 ```

## File: src/components/admin/ContactManager.jsx
 ```javascript
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { MessageSquare, Mail, Send, CheckCircle, Clock } from 'lucide-react';

const ContactManager = () => {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();
    const [replyText, setReplyText] = useState({});
    const [replyingTo, setReplyingTo] = useState(null);

    const { data: inquiries, isLoading } = useQuery({
        queryKey: ['admin-inquiries'],
        queryFn: () => api.get('/admin/contact/').then(res => Array.isArray(res) ? res : [])
    });

    const replyMutation = useMutation({
        mutationFn: ({ id, reply }) => api.patch(`/admin/contact/${id}/reply`, { reply }),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-inquiries']);
            success('Reply saved successfully');
            setReplyingTo(null);
        },
        onError: () => toastError('Failed to send reply')
    });

    const handleReply = (id) => {
        if (!replyText[id]?.trim()) return;
        replyMutation.mutate({ id, reply: replyText[id] });
    };

    if (isLoading) return <div className="p-10 text-center animate-pulse font-black text-gray-400">Loading inquiries...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-700 relative" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 rounded-bl-full -translate-y-4 translate-x-4"></div>
                <div className="relative z-10">
                    <h2 className="text-xl font-black text-black tracking-tight leading-none mb-3">Communication Hub</h2>
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest">{inquiries?.length || 0} Inquiries</span>
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                            Live Support Stream
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {(inquiries || []).map((inquiry) => (
                    <div key={inquiry.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all group">
                        <div className="flex flex-col lg:flex-row justify-between gap-6 mb-6">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-black shadow-inner group-hover:scale-105 transition-transform">
                                    <Mail size={16} strokeWidth={2.5} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-black text-base text-black tracking-tight leading-none mb-2">{inquiry.subject}</h3>
                                    <div className="flex items-center gap-3">
                                        <p className="text-[10px] font-black text-black uppercase tracking-widest">{inquiry.name}</p>
                                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{inquiry.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* AI Triage */}
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                                    inquiry.priority >= 8 ? 'bg-red-50 text-red-600 border-red-100 ring-4 ring-red-500/10' : 
                                    inquiry.priority >= 5 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                    'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                    <span className="opacity-40">Lv.</span>{inquiry.priority || 1}
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest shadow-sm transition-all duration-500 ${
                                    inquiry.sentiment === 'urgent' ? 'bg-rose-600 text-white border-rose-600' :
                                    inquiry.sentiment === 'frustrated' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                    inquiry.sentiment === 'happy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    inquiry.sentiment === 'confused' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                    'bg-gray-50 text-gray-400 border-gray-100'
                                }`}>
                                    {inquiry.sentiment === 'happy' && '✨'}
                                    {inquiry.sentiment === 'frustrated' && '⚠️'}
                                    {inquiry.sentiment === 'urgent' && '🚨'}
                                    {inquiry.sentiment === 'confused' && '❓'}
                                    {inquiry.sentiment === 'calm' && '🔹'}
                                    {inquiry.sentiment || 'Pending'}
                                </div>

                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all duration-300 ${
                                    inquiry.status === 'replied' 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                    {inquiry.status}
                                </span>
                                <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-300 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    <Clock size={10} strokeWidth={3} />
                                    {new Date(inquiry.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50/50 rounded-xl p-6 mb-6 border border-gray-100 italic relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 text-2xl opacity-5 select-none text-black">"</div>
                            <p className="text-gray-700 leading-relaxed font-bold text-xs">“{inquiry.message}”</p>
                        </div>

                        {inquiry.reply ? (
                            <div className="border-t border-gray-50 pt-6">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shadow-lg">
                                        <Send size={14} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[8px] font-black text-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                                            Admin Response
                                        </p>
                                        <div className="bg-black/5 border border-black/5 p-5 rounded-xl">
                                            <p className="text-gray-600 font-bold text-xs leading-relaxed">{inquiry.reply}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="border-t border-gray-50 pt-6">
                                {replyingTo === inquiry.id ? (
                                    <div className="space-y-4">
                                        <textarea 
                                            value={replyText[inquiry.id] || ''}
                                            onChange={(e) => setReplyText({ ...replyText, [inquiry.id]: e.target.value })}
                                            placeholder="Specify official response..."
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-5 outline-none focus:bg-white focus:ring-4 focus:ring-black/5 focus:border-black transition-all font-bold text-xs min-h-[120px] shadow-inner"
                                        />
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => handleReply(inquiry.id)}
                                                className="bg-black text-white px-6 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20"
                                            >
                                                Send Response
                                            </button>
                                            <button 
                                                onClick={() => setReplyingTo(null)}
                                                className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-all"
                                            >
                                                Abort
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setReplyingTo(inquiry.id)}
                                        className="inline-flex items-center gap-3 bg-black text-white px-5 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest hover:scale-105 transition-all shadow-md"
                                    >
                                        Reply Now <Send size={12} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {inquiries?.length === 0 && (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-100">
                        <div className="text-4xl mb-6 grayscale opacity-20">📭</div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">Inquiry Registry Clean</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactManager;
 ```

## File: src/components/admin/DocsManager.jsx
 ```javascript
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import docService from '../../services/docService';
import { useToast } from '../../context/ToastContext';
import { normalizeDoc } from '../../utils/normalizers';

const DocsManager = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { success, error } = useToast();

    const { data: docData, isLoading: loading } = useQuery({
        queryKey: ['docs'],
        queryFn: () => docService.getAll(),
    });

    const docs = useMemo(() => 
        Array.isArray(docData) ? docData.map(normalizeDoc) : [],
    [docData]);

    const deleteMutation = useMutation({
        mutationFn: (id) => docService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['docs'] });
            success('Documentation asset deleted');
        },
        onError: (err) => error(err.message || 'Failed to delete doc'),
    });

    const handleDelete = (id) => {
        if (!window.confirm('Are you sure you want to delete this documentation?')) return;
        deleteMutation.mutate(id);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-black">Technical Documentation</h2>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Manage your premium guides and setup manuals</p>
                </div>
                <button
                    onClick={() => navigate('/admin/doc/new')}
                    className="bg-black text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10"
                >
                    + Create New Doc
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Synchronizing Docs...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Title</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Section</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tier</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {docs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg">{doc.icon || '📄'}</div>
                                                <span className="text-sm font-bold text-black">{doc.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm text-gray-500 font-medium">
                                            {doc.section || 'General'}
                                        </td>
                                        <td className="px-8 py-6 text-sm font-bold text-black">
                                            {doc.formattedPrice}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${doc.isPremium ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                                {doc.isPremium ? 'Premium' : 'Public'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => navigate(`/admin/doc/${doc.id}/edit`)} 
                                                    className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-black hover:border-black transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(doc.id)} 
                                                    disabled={deleteMutation.isPending}
                                                    className="p-2.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-50"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Index', value: docs.length, color: 'text-black' },
                    { label: 'Monetized', value: docs.filter(d => d.isPremium).length, color: 'text-amber-600' },
                    { label: 'Public Access', value: docs.filter(d => !d.isPremium).length, color: 'text-emerald-600' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DocsManager;
 ```

## File: src/components/admin/ProductList.jsx
 ```javascript
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import productService from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { normalizeProduct } from '../../utils/normalizers';

const ProductList = () => {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();
    const [selectedIds, setSelectedIds] = useState([]);

    const { data: productData, isLoading: loading, error } = useQuery({
        queryKey: ['products'],
        queryFn: () => productService.getAll(),
    });

    const products = useMemo(() => 
        Array.isArray(productData) ? productData.map(normalizeProduct) : [],
    [productData]);

    const deleteMutation = useMutation({
        mutationFn: (id) => productService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            success('Product deleted successfully');
        },
    });

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        setSelectedIds(prev => prev.length === products.length ? [] : products.map(p => p.id));
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedIds.length} items forever?`)) return;
        try {
            await Promise.all(selectedIds.map(id => productService.delete(id)));
            queryClient.invalidateQueries({ queryKey: ['products'] });
            success('Items deleted successfully');
            setSelectedIds([]);
        } catch (err) {
            toastError('Some items could not be deleted');
        }
    };

    if (loading) return (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-20 text-center animate-pulse">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Inventory...</p>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-12 text-red-500">
            <h3 className="text-xs font-bold uppercase tracking-widest">Connection Error</h3>
            <p className="text-sm font-medium">{error.message}</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-700 relative" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            {/* Enterprise Toolbar - Dense */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 rounded-bl-full -translate-y-4 translate-x-4"></div>
                <div className="relative z-10">
                    <h2 className="text-xl font-black text-black tracking-tight leading-none mb-3">Master Inventory</h2>
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest">{products.length} Items</span>
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Registry Synchronized
                        </span>
                    </div>
                </div>
                <button 
                    onClick={() => navigate('/admin/product/new')} 
                    className="relative z-10 px-8 py-3.5 bg-black text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20 flex items-center gap-2"
                >
                    <span>+</span> New Asset
                </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-gray-100">
                                <th className="px-6 py-5 w-8 text-center">
                                    <input type="checkbox" checked={selectedIds.length === products.length && products.length > 0} onChange={toggleSelectAll} className="w-4 h-4 accent-black rounded-lg cursor-pointer" />
                                </th>
                                <th className="px-6 py-5">Template Identity</th>
                                <th className="px-6 py-5">Pricing</th>
                                <th className="px-6 py-5">Classification</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <tr key={product.id} className={`hover:bg-gray-50/30 transition-all group ${selectedIds.includes(product.id) ? 'bg-gray-50/50' : ''}`}>
                                        <td className="px-6 py-4 text-center">
                                            <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleSelect(product.id)} className="w-4 h-4 accent-black rounded-lg cursor-pointer" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-500">
                                                    {product.image ? (
                                                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xl grayscale">📦</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-black text-sm truncate tracking-tight mb-0.5">{product.title}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                                        ID: <span className="font-mono text-gray-400">{String(product.id || '').slice(-8)}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-black tracking-tighter">₹{product.price}</span>
                                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Base Rate</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1.5 bg-gray-50 border border-gray-100 text-black text-[9px] font-black rounded-lg uppercase tracking-widest">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                <span className="text-[9px] font-black text-black uppercase tracking-widest">Active</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <button
                                                    onClick={() => navigate(`/admin/product/${product.id}/edit`)}
                                                    className="w-9 h-9 bg-white border border-gray-100 text-black hover:bg-black hover:text-white rounded-xl transition-all shadow-sm flex items-center justify-center"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if(window.confirm('Erase this template?')) deleteMutation.mutate(product.id);
                                                    }}
                                                    className="w-9 h-9 bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-40 text-center">
                                        <p className="text-[9px] font-black uppercase text-gray-300 tracking-[0.4em]">Inventory Empty</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductList;
 ```

## File: src/components/admin/ImageUpload.jsx
 ```javascript
import React, { useState, useRef } from 'react';
import api from '../../services/api';

const ImageUpload = ({ onUploadSuccess, currentImage, label = "Upload Image" }) => {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleUpload = async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await api.post('/upload', formData);
            if (onUploadSuccess) {
                onUploadSuccess(response.filePath);
            }
        } catch (err) {
            console.error('R2 Transmission Failed:', err);
            alert('Failed to transmit asset to R2 storage.');
        } finally {
            setUploading(false);
        }
    };

    const onFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
            <div 
                className={`relative group h-40 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer ${
                    dragActive ? 'border-primary bg-blue-50/50' : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
            >
                <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    onChange={onFileSelect}
                    accept="image/*"
                />

                {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Transmitting to R2...</p>
                    </div>
                ) : currentImage ? (
                    <div className="relative w-full h-full">
                        <img src={currentImage} className="w-full h-full object-cover rounded-[1.5rem]" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[1.5rem]">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full">Replace Asset</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-xl mb-1">🖼️</div>
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Drag & Drop or Click</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">PNG, JPG, WEBP (Max 10MB)</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageUpload;
 ```

## File: src/components/admin/SiteConfigForm.jsx
 ```javascript
import React, { useState, useContext, useEffect } from 'react';
import ConfigContext from '../../context/ConfigContext';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ImageUpload from './ImageUpload';

const SiteConfigForm = ({ initialSection = 'general' }) => {
    const { config, updateContextConfig } = useContext(ConfigContext);
    const [formData, setFormData] = useState({
        heroTitle: '',
        heroSubtitle: '',
        heroImages: [],
        heroVisualEffect: 'stack',
        announcements: [],
        showAnnouncement: false,
        supportEmail: '',
        faqs: [],
        socialProof: {
            rating: '',
            summary: '',
            creatorsLabel: '',
            trustedCompanies: []
        },
        showcaseItems: [],
        contact: {
            heading: '',
            subheading: '',
            email: '',
            address: '',
            phone: ''
        },
        features: {},
        memberPlans: [],
        maintenanceMode: false,
        maintenanceMessage: ''
    });
    const [loading, setLoading] = useState(false);
    const { success, error: toastError } = useToast();
    const [activeSection, setActiveSection] = useState(initialSection);
    const [previewIndex, setPreviewIndex] = useState(0);

    // Sync active section with prop changes
    useEffect(() => {
        setActiveSection(initialSection);
    }, [initialSection]);

    // Image Preview Rotation
    useEffect(() => {
        const interval = setInterval(() => {
            setPreviewIndex((prev) => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (config) {
// ... rest of useEffect remains
            setFormData({
                heroTitle: config.heroTitle || '',
                heroSubtitle: config.heroSubtitle || '',
                heroImages: Array.isArray(config.heroImages) ? config.heroImages : [],
                heroVisualEffect: config.heroVisualEffect || 'stack',
                announcements: Array.isArray(config.announcements) ? config.announcements : (config.announcementMessage ? [config.announcementMessage] : []),
                showAnnouncement: config.showAnnouncement || false,
                supportEmail: config.supportEmail || '',
                faqs: Array.isArray(config.faqs) ? config.faqs : [],
                socialProof: config.socialProof || { rating: '', summary: '', creatorsLabel: '', trustedCompanies: [] },
                showcaseItems: Array.isArray(config.showcaseItems) ? config.showcaseItems.map(item => ({...item})) : [],
                contact: config.contact || { heading: '', subheading: '', email: '', address: '', phone: '' },
                features: config.features || {},
                memberPlans: Array.isArray(config.memberPlans) ? config.memberPlans.map(p => ({...p, features: Array.isArray(p.features) ? [...p.features] : []})) : [],
                maintenanceMode: config.maintenanceMode || false,
                maintenanceMessage: config.maintenanceMessage || 'We are currently performing a scheduled maintenance. Please check back shortly.'
            });
        }
    }, [config]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleNestedChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleArrayChange = (field, index, subfield, value) => {
        const newArr = [...formData[field]];
        newArr[index] = { ...newArr[index], [subfield]: value };
        setFormData(prev => ({ ...prev, [field]: newArr }));
    };

    const handleArrayChangeRaw = (field, index, value) => {
        const newArr = [...formData[field]];
        newArr[index] = value;
        setFormData(prev => ({ ...prev, [field]: newArr }));
    };

    const addArrayItem = (field, defaultObj) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...formData[field], defaultObj]
        }));
    };

    const removeArrayItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: formData[field].filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const data = await api.put('/config', formData);
            updateContextConfig(data);
            success('Configuration updated successfully');
        } catch (error) {
            toastError('Failed to save changes');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const sections = [
        { id: 'general', label: 'Branding', icon: '🆔' },
        { id: 'hero', label: 'Home Banner', icon: '🎨' },
        { id: 'marketing', label: 'Social Proof', icon: '📢' },
        { id: 'faqs', label: 'FAQs', icon: '❓' },
        { id: 'features', label: 'Site Features', icon: '⚡' },
        { id: 'plans', label: 'Member Plans', icon: '💎' },
        { id: 'security', label: 'Maintenance', icon: '🛡️' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700 relative" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            <div className="bg-white border border-gray-100 rounded-[3.5rem] shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[800px] relative">
                
                {/* Enterprise Config Sidebar */}
                <div className="w-full lg:w-80 bg-gray-50/50 border-r border-gray-100 p-10 flex flex-col relative z-20">
                    <div className="mb-10 px-4">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] mb-3">Settings Hub</p>
                        <div className="h-1 w-12 bg-black rounded-full"></div>
                    </div>
                    
                    <div className="space-y-1 flex-grow">
                        {sections.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setActiveSection(s.id)}
                                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 relative group ${
                                    activeSection === s.id 
                                    ? 'bg-white text-black shadow-xl shadow-black/5 ring-1 ring-gray-100/50' 
                                    : 'text-gray-400 hover:text-black hover:bg-white/80'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`text-lg transition-transform duration-500 ${activeSection === s.id ? 'scale-110' : 'group-hover:scale-110 grayscale'}`}>{s.icon}</span>
                                    <span>{s.label}</span>
                                </div>
                                {activeSection === s.id && (
                                    <div className="w-1 h-4 bg-black rounded-full"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="pt-10 border-t border-gray-100 mt-10 space-y-4">
                         <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full group px-8 py-5 bg-black text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 overflow-hidden relative"
                        >
                            <span className="relative z-10">{loading ? 'Synchronizing...' : 'Save All Configuration'}</span>
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        </button>
                    </div>
                </div>

                {/* Content Panel */}
                <div className="flex-1 p-12 md:p-16 lg:p-20 overflow-y-auto bg-white relative z-10 custom-scrollbar">
                    <form onSubmit={handleSubmit} className="max-w-4xl space-y-12">
                        
                        {activeSection === 'general' && (
                            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-2xl font-bold text-black tracking-tight mb-2">Website Settings</h2>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">General branding and contact information</p>
                                </div>
                                <div className="space-y-6">
                                    <Field label="Hero Section Title">
                                        <input type="text" name="heroTitle" value={formData.heroTitle} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-medium text-sm transition-all" />
                                    </Field>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field label="Support Email Address">
                                            <input type="email" name="supportEmail" value={formData.supportEmail} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-medium text-sm transition-all" />
                                        </Field>
                                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-black uppercase tracking-wider">Announcement Bar</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Visible to all users</p>
                                            </div>
                                            <Toggle checked={formData.showAnnouncement} onChange={(val) => setFormData(prev => ({...prev, showAnnouncement: val}))} />
                                        </div>
                                    </div>
                                    {formData.showAnnouncement && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="flex justify-between items-center px-2">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Carousel Messages</p>
                                                <button 
                                                    type="button" 
                                                    onClick={() => addArrayItem('announcements', '')}
                                                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                                >
                                                    + Add Message
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {formData.announcements.map((msg, idx) => (
                                                    <div key={idx} className="relative group">
                                                        <input 
                                                            type="text" 
                                                            value={msg} 
                                                            onChange={(e) => handleArrayChangeRaw('announcements', idx, e.target.value)}
                                                            placeholder={`Announcement ${idx + 1}...`}
                                                            className="w-full px-5 py-4 bg-black text-white rounded-2xl outline-none font-bold text-[10px] uppercase tracking-widest"
                                                        />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeArrayItem('announcements', idx)}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                                {formData.announcements.length === 0 && (
                                                    <div className="p-10 border-2 border-dashed border-gray-100 rounded-[2rem] text-center">
                                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No messages configured. Carousel will be hidden.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                         {activeSection === 'hero' && (
                            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                <div className="flex justify-between items-end">
                                     <div>
                                        <h2 className="text-2xl font-bold text-black tracking-tight mb-2">Banner Visuals</h2>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Manage the homepage image rotation</p>
                                    </div>
                                    <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
                                         {['stack', 'fade', 'scatter'].map(effect => (
                                             <button
                                                 key={effect}
                                                 type="button"
                                                 onClick={() => setFormData(prev => ({...prev, heroVisualEffect: effect}))}
                                                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.heroVisualEffect === effect ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-black'}`}
                                             >
                                                 {effect}
                                             </button>
                                         ))}
                                    </div>
                                    <button type="button" onClick={() => addArrayItem('heroImages', '')} className="text-[10px] font-bold text-black border-2 border-black px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-black hover:text-white transition-all">+ Add New Image</button>
                                </div>

                                {/* LIVE PREVIEW AREA */}
                                <div className="p-10 bg-gray-950 rounded-[3rem] border border-gray-800 shadow-2xl relative overflow-hidden h-[350px]">
                                     <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
                                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                         <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Live Preview — {formData.heroVisualEffect} animation</span>
                                     </div>

                                     <div className="relative w-full h-full flex items-center justify-center scale-75 lg:scale-90">
                                         {/* Simulation Logic */}
                                         {formData.heroImages.length > 0 ? (
                                             <div className="relative w-[400px] aspect-video">
                                                 {formData.heroVisualEffect === 'stack' && formData.heroImages.map((src, idx) => {
                                                     const position = (idx - previewIndex + 3) % 3;
                                                     const styles = {
                                                         0: "z-30 scale-100 opacity-100 translate-x-[0%] translate-y-[0%] rotate-0 shadow-2xl",
                                                         1: "z-20 scale-[0.9] opacity-40 translate-x-[15%] translate-y-[-10%] rotate-[4deg]",
                                                         2: "z-10 scale-[0.8] opacity-20 translate-x-[30%] translate-y-[-20%] rotate-[8deg]"
                                                     };
                                                     return (
                                                         <div key={idx} className={`absolute inset-0 bg-white rounded-3xl border border-white/10 overflow-hidden transition-all duration-1000 ${styles[position]}`}>
                                                             <img src={src} className="w-full h-full object-cover" alt="Preview"/>
                                                         </div>
                                                     );
                                                 })}

                                                 {formData.heroVisualEffect === 'fade' && formData.heroImages.map((src, idx) => (
                                                     <div key={idx} className={`absolute inset-0 bg-white rounded-3xl overflow-hidden transition-opacity duration-1000 ${idx === previewIndex % formData.heroImages.length ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                                                         <img src={src} className="w-full h-full object-cover" alt="Preview"/>
                                                     </div>
                                                 ))}

                                                 {formData.heroVisualEffect === 'scatter' && formData.heroImages.map((src, idx) => {
                                                     const offsets = [
                                                         { top: '0%', left: '0%', scale: 'scale-100' },
                                                         { top: '20%', left: '30%', scale: 'scale-90' },
                                                         { top: '40%', left: '-10%', scale: 'scale-95' }
                                                     ];
                                                     const pos = offsets[idx % 3];
                                                     return (
                                                         <div key={idx} className={`absolute ${pos.top} ${pos.left} w-[280px] aspect-video bg-white rounded-2xl shadow-xl border border-white/10 overflow-hidden transition-all duration-[2000ms] ${pos.scale}`}>
                                                             <img src={src} className="w-full h-full object-cover" alt="Preview"/>
                                                         </div>
                                                     );
                                                 })}
                                             </div>
                                         ) : (
                                             <div className="text-center space-y-4">
                                                 <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-2xl mx-auto shadow-inner">🎞️</div>
                                                 <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest underline decoration-white/20">Add assets to initialize sandbox</p>
                                             </div>
                                         )}
                                     </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {formData.heroImages?.map((url, idx) => (
                                        <div key={idx} className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 relative group overflow-hidden">
                                            <button type="button" onClick={() => removeArrayItem('heroImages', idx)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors z-10 transition-all">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                            <div className="space-y-4">
                                                <ImageUpload 
                                                    label={`Hero Asset ${idx + 1}`}
                                                    currentImage={url}
                                                    onUploadSuccess={(newUrl) => handleArrayChangeRaw('heroImages', idx, newUrl)}
                                                />
                                                <div className="px-5 py-3 bg-white border border-gray-100 rounded-2xl flex items-center justify-between">
                                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[200px]">{url || 'No R2 URL'}</p>
                                                     <button type="button" onClick={() => handleArrayChangeRaw('heroImages', idx, '')} className="text-[9px] font-bold text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors">Reset</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {formData.heroImages?.length === 0 && (
                                     <div className="p-20 border-2 border-dashed border-gray-100 rounded-[3rem] text-center">
                                         <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">No custom assets configured. Falling back to platform defaults.</p>
                                     </div>
                                )}
                            </div>
                        )}

                        {activeSection === 'security' && (
                            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-2xl font-bold text-red-500 tracking-tight mb-2">Site Maintenance</h2>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Platform control and site visibility</p>
                                </div>
                                <div className="p-10 bg-red-50/50 border border-red-100 rounded-[2.5rem] space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-black text-red-600 uppercase tracking-widest">Maintenance Mode</h3>
                                            <p className="text-xs text-gray-500 mt-1 font-medium">Temporarily disable public access to the platform.</p>
                                        </div>
                                        <Toggle checked={formData.maintenanceMode} onChange={(val) => setFormData(prev => ({...prev, maintenanceMode: val}))} />
                                    </div>
                                    {formData.maintenanceMode && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                                             <Field label="Maintenance Message (Visible to Users)">
                                                <textarea 
                                                    name="maintenanceMessage" 
                                                    value={formData.maintenanceMessage} 
                                                    onChange={handleChange} 
                                                    className="w-full px-8 py-6 bg-white border border-red-100 rounded-[2rem] outline-none focus:border-red-500 font-bold text-xs uppercase tracking-widest leading-loose" 
                                                    rows={4}
                                                />
                                             </Field>
                                             <div className="flex items-center gap-3 text-red-400 bg-white p-4 rounded-2xl border border-red-50">
                                                 <span className="text-lg">⚠️</span>
                                                 <span className="text-[10px] font-bold uppercase tracking-widest">Staff login and Admin panel will remain accessible.</span>
                                             </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeSection === 'marketing' && (
                            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-2xl font-bold text-black tracking-tight mb-2">Social Proof</h2>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Customer ratings and trust indicators</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field label="Platform Rating">
                                        <input value={formData.socialProof.rating} onChange={(e) => handleNestedChange('socialProof', 'rating', e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-medium text-sm" placeholder="4.9/5" />
                                    </Field>
                                    <Field label="User Count Text">
                                        <input value={formData.socialProof.creatorsLabel} onChange={(e) => handleNestedChange('socialProof', 'creatorsLabel', e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-medium text-sm" placeholder="2k+ Users" />
                                    </Field>
                                </div>
                                <Field label="Reviews Summary">
                                    <textarea value={formData.socialProof.summary} onChange={(e) => handleNestedChange('socialProof', 'summary', e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-medium text-sm" rows={4} />
                                </Field>
                            </div>
                        )}

                        {activeSection === 'faqs' && (
                            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h2 className="text-2xl font-bold text-black tracking-tight mb-2">General FAQs</h2>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Manage platform help questions</p>
                                    </div>
                                    <button type="button" onClick={() => addArrayItem('faqs', { question: '', answer: '' })} className="text-[10px] font-bold text-black border-2 border-black px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-black hover:text-white transition-all">+ Add FAQ</button>
                                </div>
                                <div className="space-y-6">
                                    {formData.faqs.map((faq, idx) => (
                                        <div key={idx} className="p-8 bg-gray-50/50 rounded-[2rem] border border-gray-100 relative group">
                                            <button type="button" onClick={() => removeArrayItem('faqs', idx)} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                            <div className="space-y-4">
                                                <input placeholder="Enter Question" value={faq.question} onChange={(e) => handleArrayChange('faqs', idx, 'question', e.target.value)} className="w-full bg-transparent border-none text-lg font-bold text-black placeholder-gray-300 outline-none" />
                                                <textarea placeholder="Answer text..." value={faq.answer} onChange={(e) => handleArrayChange('faqs', idx, 'answer', e.target.value)} className="w-full bg-transparent border-none text-sm font-medium text-gray-500 outline-none resize-none" rows={3} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeSection === 'features' && (
                            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-2xl font-bold text-black tracking-tight mb-2">Site Configuration</h2>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Manage site features seamlessly</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {['payments', 'licenses', 'reviews', 'subscriptions', 'ai', 'wishlist', 'testimonials', 'docs'].map(feature => (
                                        <div key={feature} className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm transition-all group hover:bg-gray-50/50">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[10px] uppercase transition-all ${formData.features[feature] ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                    {feature.substring(0, 2)}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="font-bold text-black text-sm capitalize">{feature}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formData.features[feature] ? 'On' : 'Off'}</p>
                                                </div>
                                            </div>
                                            <Toggle 
                                                checked={!!formData.features[feature]} 
                                                onChange={(val) => setFormData(prev => ({
                                                    ...prev,
                                                    features: { ...prev.features, [feature]: val }
                                                }))} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeSection === 'plans' && (
                            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h2 className="text-2xl font-bold text-black tracking-tight mb-2">Membership Plans</h2>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Define your pricing tiers and perks</p>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => addArrayItem('memberPlans', { name: '', badge: '', price: 0, period: 'month', features: [], buttonText: 'Get Started', isPopular: false, isPrimary: false })} 
                                        className="text-[10px] font-bold text-black border-2 border-black px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                                    >
                                        + Add New Plan
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    {formData.memberPlans.map((plan, idx) => (
                                        <div key={idx} className="p-10 bg-white border border-gray-100 rounded-[3rem] shadow-sm relative group overflow-hidden">
                                            <div className="absolute top-0 left-0 w-2 h-full bg-black group-hover:w-3 transition-all"></div>
                                            <button 
                                                type="button" 
                                                onClick={() => removeArrayItem('memberPlans', idx)} 
                                                className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <Field label="Plan Name">
                                                            <input value={plan.name} onChange={(e) => handleArrayChange('memberPlans', idx, 'name', e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm" placeholder="e.g. Pro Member" />
                                                        </Field>
                                                        <Field label="Badge Text">
                                                            <input value={plan.badge} onChange={(e) => handleArrayChange('memberPlans', idx, 'badge', e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-[10px] uppercase tracking-widest" placeholder="e.g. Most Popular" />
                                                        </Field>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <Field label="Price (INR)">
                                                            <input type="number" value={plan.price} onChange={(e) => handleArrayChange('memberPlans', idx, 'price', parseInt(e.target.value))} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-lg" />
                                                        </Field>
                                                        <Field label="Period">
                                                            <input value={plan.period} onChange={(e) => handleArrayChange('memberPlans', idx, 'period', e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-medium text-sm" placeholder="e.g. month" />
                                                        </Field>
                                                    </div>

                                                    <Field label="Button Text">
                                                        <input value={plan.buttonText} onChange={(e) => handleArrayChange('memberPlans', idx, 'buttonText', e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm uppercase tracking-widest" />
                                                    </Field>

                                                    <div className="flex gap-6 pt-4">
                                                        <div className="flex items-center gap-3">
                                                            <Toggle checked={plan.isPopular} onChange={(val) => handleArrayChange('memberPlans', idx, 'isPopular', val)} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Popular Tag</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Toggle checked={plan.isPrimary} onChange={(val) => handleArrayChange('memberPlans', idx, 'isPrimary', val)} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dark Theme</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="flex justify-between items-center px-1">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan Highlights ({plan.features?.length || 0})</p>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                const newFeatures = [...(plan.features || []), ''];
                                                                handleArrayChange('memberPlans', idx, 'features', newFeatures);
                                                            }}
                                                            className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                                                        >
                                                            + Add Feature
                                                        </button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {plan.features?.map((feat, fIdx) => (
                                                            <div key={fIdx} className="flex items-center gap-3 group/feat">
                                                                <input 
                                                                    value={feat} 
                                                                    onChange={(e) => {
                                                                        const newFeatures = [...plan.features];
                                                                        newFeatures[fIdx] = e.target.value;
                                                                        handleArrayChange('memberPlans', idx, 'features', newFeatures);
                                                                    }} 
                                                                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black text-xs font-medium"
                                                                    placeholder="Enter perk..."
                                                                />
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newFeatures = plan.features.filter((_, i) => i !== fIdx);
                                                                        handleArrayChange('memberPlans', idx, 'features', newFeatures);
                                                                    }}
                                                                    className="p-3 text-gray-300 hover:text-red-500 opacity-0 group-hover/feat:opacity-100 transition-all"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {(!plan.features || plan.features.length === 0) && (
                                                            <div className="p-8 border-2 border-dashed border-gray-50 rounded-2xl text-center">
                                                                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">No perks listed for this plan.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                    </form>
                </div>
            </div>
        </div>
    );
};

const Field = ({ label, children }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">{label}</label>
        {children}
    </div>
);

const Toggle = ({ checked, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-all duration-300 relative ${checked ? 'bg-black' : 'bg-gray-200'}`}
    >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ease-in-out ${checked ? 'left-6' : 'left-1'}`} />
    </button>
);

export default SiteConfigForm;
 ```

## File: src/components/admin/TestimonialManager.jsx
 ```javascript
import React, { useState, useEffect } from 'react';
import testimonialService from '../../services/testimonialService';

const TestimonialManager = () => {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            const data = await testimonialService.adminList();
            setTestimonials(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await testimonialService.approve(id);
            setTestimonials(testimonials.map(t => t.id === id ? { ...t, status: 'approved' } : t));
        } catch (err) {
            console.error(err);
        }
    };

    const handleReject = async (id) => {
        try {
            await testimonialService.reject(id);
            setTestimonials(testimonials.map(t => t.id === id ? { ...t, status: 'rejected' } : t));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanently remove this testimonial?")) return;
        try {
            await testimonialService.delete(id);
            setTestimonials(testimonials.filter(t => t.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'rejected': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-amber-50 text-amber-700 border-amber-100';
        }
    };

    if (loading) return (
         <div className="bg-white border border-gray-100 rounded-[2.5rem] p-20 text-center animate-pulse">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Retrieving Social Proof...</p>
        </div>
    );
    
    if (error) return (
         <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-12 text-red-500">
            <h3 className="text-xs font-bold uppercase tracking-widest">Sync Error</h3>
            <p className="text-sm font-medium">{error}</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-black tracking-tight leading-none">Testimonial List</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{testimonials.length} reviews in queue</p>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <th className="px-10 py-6">Customer Context</th>
                                <th className="px-10 py-6">Message Content</th>
                                <th className="px-10 py-6 text-center">Verification</th>
                                <th className="px-10 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {testimonials.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50/50 transition-all group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-100 overflow-hidden flex items-center justify-center font-bold text-gray-400 uppercase text-xs">
                                                {t.user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-black text-sm truncate">{t.user?.name || 'Anonymous'}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t.user?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <p className="text-sm text-gray-500 font-medium line-clamp-2 max-w-sm leading-relaxed">{t.content}</p>
                                        <div className="flex text-amber-400 text-xs mt-2">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={i < t.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${getStatusStyles(t.status)}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {t.status !== 'approved' && (
                                                <button onClick={() => handleApprove(t.id)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all border border-emerald-50" title="Approve">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                </button>
                                            )}
                                            {t.status !== 'rejected' && (
                                                <button onClick={() => handleReject(t.id)} className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all border border-amber-50" title="Reject">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(t.id)} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-gray-100" title="Delete">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TestimonialManager;
 ```

## File: src/components/admin/ShowcaseManager.jsx
 ```javascript
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ShowcaseManager = () => {
    const { success, error: toastError } = useToast();
    const queryClient = useQueryClient();

    const { data: showcases, isLoading } = useQuery({
        queryKey: ['admin-showcases'],
        queryFn: async () => {
            return await api.get('/admin/showcases');
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            return await api.patch(`/admin/showcases/${id}/status`, { status });
        },
        onSuccess: (data) => {
            success(`Status updated to ${data.status.toUpperCase()} successfully.`);
            queryClient.invalidateQueries(['admin-showcases']);
        },
        onError: () => {
            toastError("Failed to update submission status.");
        }
    });

    if (isLoading) return <div className="p-20 text-center text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Loading submissions...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-black text-black tracking-tight">Product Showcase</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Manage customer submissions & rewards</p>
                </div>
            </div>

            <div className="grid gap-6">
                {showcases?.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-gray-100 transition-all duration-500 flex flex-col lg:flex-row items-center gap-8 relative overflow-hidden group">
                        
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-4 mb-4">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    item.status === 'approved' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' :
                                    item.status === 'rejected' ? 'bg-red-50 text-red-500 border border-red-100' :
                                    'bg-gray-50 text-gray-400 border border-gray-100'
                                }`}>
                                    {item.status}
                                </span>
                                {item.rewardPaid && <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">💰 Reward Paid</span>}
                            </div>
                            
                            <h3 className="text-xl font-black text-black tracking-tight mb-2 truncate">Product: {item.product?.title || 'Unknown Product'}</h3>
                            <a 
                                href={item.liveUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-sm font-bold text-primary hover:underline flex items-center gap-2 mb-6"
                            >
                                🔗 {item.liveUrl}
                            </a>
                            
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs font-black shadow-sm">ID</div>
                                    <p className="text-[10px] font-black text-black uppercase tracking-widest">User ID: {item.userId}</p>
                                </div>
                                <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Submitted: {new Date(item.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                            {item.status === 'pending' && (
                                <>
                                    <button 
                                        onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'approved' })}
                                        disabled={updateStatusMutation.isLoading}
                                        className="px-10 py-5 bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/10 hover:bg-emerald-500 transition-all active:scale-95"
                                    >
                                        Approve & Reward
                                    </button>
                                    <button 
                                        onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'rejected' })}
                                        disabled={updateStatusMutation.isLoading}
                                        className="px-10 py-5 bg-white border border-gray-100 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-50 transition-all active:scale-95"
                                    >
                                        Reject Submission
                                    </button>
                                </>
                            )}
                            {item.status !== 'pending' && (
                                <button className="px-10 py-5 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest cursor-not-allowed">
                                    Processed
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {(!showcases || showcases.length === 0) && (
                    <div className="p-40 text-center border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/20">
                        <div className="text-4xl mb-6 grayscale">📡</div>
                        <h3 className="text-xl font-black text-black mb-1">No submissions yet</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No submissions found at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShowcaseManager;
 ```

## File: src/components/admin/AdminSearchPalette.jsx
 ```javascript
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import userService from '../../services/userService';
import orderService from '../../services/orderService';
import productService from '../../services/productService';
import docService from '../../services/docService';

const AdminSearchPalette = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    const { data: results, isLoading } = useQuery({
        queryKey: ['admin-search', query],
        queryFn: async () => {
            if (query.length < 2) return { users: [], orders: [], products: [], docs: [] };
            const [users, orders, products, docs] = await Promise.all([
                userService.adminList(), // We'll filter client-side for simplicity if no search endpoint
                orderService.adminList('all'),
                productService.getAll(),
                docService.getAll()
            ]);

            const q = query.toLowerCase();
            return {
                users: (users || []).filter(u => u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q)).slice(0, 5),
                orders: (orders || []).filter(o => String(o.id).toLowerCase().includes(q)).slice(0, 5),
                products: (products || []).filter(p => p.title?.toLowerCase().includes(q)).slice(0, 5),
                docs: (docs || []).filter(d => d.title?.toLowerCase().includes(q)).slice(0, 5),
            };
        },
        enabled: isOpen && query.length > 1
    });

    const flatResults = [
        ...(results?.users || []).map(u => ({ ...u, type: 'user', icon: '👤', label: u.name, sub: u.email })),
        ...(results?.orders || []).map(o => ({ ...o, type: 'order', icon: '💳', label: `Order #${String(o.id).slice(-8)}`, sub: `Value: ₹${o.totalPrice}` })),
        ...(results?.products || []).map(p => ({ ...p, type: 'product', icon: '💎', label: p.title, sub: `Product Template` })),
        ...(results?.docs || []).map(d => ({ ...d, type: 'doc', icon: '📚', label: d.title, sub: `Documentation` })),
    ];

    useEffect(() => {
        const handleKeys = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                onClose();
            }
            if (isOpen) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1));
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
                    e.preventDefault();
                    handleSelect(flatResults[selectedIndex]);
                } else if (e.key === 'Escape') {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [isOpen, flatResults, selectedIndex, onClose]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setSelectedIndex(0);
        } else {
            setQuery('');
        }
    }, [isOpen]);

    const handleSelect = (item) => {
        onClose();
        const routes = {
            user: '/admin/users',
            order: '/admin/orders',
            product: `/admin/product/${item.id}/edit`,
            doc: `/admin/doc/${item.id}/edit`,
        };
        navigate(routes[item.type]);
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl transition-all" onClick={onClose} />
            <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-4 px-8 py-6 border-b border-gray-50 bg-gray-50/50">
                    <span className="text-xl grayscale opacity-40">🔍</span>
                    <input
                        ref={inputRef}
                        className="flex-grow bg-transparent border-none outline-none text-lg font-black text-black placeholder-gray-300 tracking-tight"
                        placeholder="Jump to User, Order, or Asset..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-2" onClick={onClose}>
                        <kbd className="flex items-center justify-center p-1.5 min-w-[2rem] bg-white border border-gray-100 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-widest shadow-sm hover:bg-black hover:text-white transition-all cursor-pointer">esc</kbd>
                    </div>
                </div>

                <div className="max-h-[50vh] overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {query.length < 2 ? (
                        <div className="py-16 text-center space-y-6">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-3xl border border-gray-100/50 shadow-inner">⌨️</div>
                            <div>
                                <h3 className="text-sm font-black text-black tracking-widest uppercase mb-1">Command Hub</h3>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">Universal Intelligence Interface</p>
                            </div>
                        </div>
                    ) : isLoading ? (
                        <div className="p-16 text-center animate-pulse space-y-3">
                            <div className="w-6 h-6 border-3 border-gray-100 border-t-black rounded-full mx-auto animate-spin"></div>
                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">Indexing stream...</p>
                        </div>
                    ) : flatResults.length > 0 ? (
                        flatResults.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSelect(item)}
                                className={`w-full flex items-center gap-5 p-5 rounded-xl transition-all duration-300 text-left group relative overflow-hidden ${
                                    idx === selectedIndex 
                                    ? 'bg-black text-white shadow-xl scale-[1.01] z-10' 
                                    : 'hover:bg-gray-50/80 active:scale-95'
                                }`}
                            >
                                {idx === selectedIndex && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full -translate-y-4 translate-x-4"></div>
                                )}
                                <span className={`text-2xl transition-transform duration-500 ${idx === selectedIndex ? 'scale-110 grayscale-0' : 'grayscale opacity-30 group-hover:opacity-100 group-hover:grayscale-0'}`}>
                                    {item.icon}
                                </span>
                                <div className="flex-1 min-w-0 relative z-10">
                                    <p className={`font-black tracking-tight text-sm leading-none mb-1.5 ${idx === selectedIndex ? 'text-white' : 'text-black'}`}>{item.label}</p>
                                    <p className={`text-[9px] font-bold uppercase tracking-widest ${idx === selectedIndex ? 'text-white/40' : 'text-gray-400'}`}>{item.sub}</p>
                                </div>
                                <span className={`relative z-10 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-all duration-500 ${
                                    idx === selectedIndex 
                                    ? 'bg-white/10 text-white' 
                                    : 'bg-gray-100 text-gray-400 group-hover:bg-black group-hover:text-white'
                                }`}>
                                    {item.type}
                                </span>
                            </button>
                        ))
                    ) : (
                        <div className="p-24 text-center space-y-4">
                            <div className="text-3xl opacity-20 grayscale">🛰️</div>
                            <p className="text-gray-300 font-black uppercase text-[9px] tracking-[0.3em]">No entities found in registry</p>
                        </div>
                    )}
                </div>

                <div className="px-8 py-5 bg-gray-50/50 flex justify-between items-center border-t border-gray-100/50">
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2.5 opacity-40">
                            <kbd className="px-1.5 py-0.5 bg-white border border-gray-100 rounded text-[9px] font-black shadow-sm">ENT</kbd>
                            <span className="text-[8px] font-black uppercase tracking-widest">Open</span>
                        </div>
                        <div className="flex items-center gap-2.5 opacity-40">
                            <kbd className="px-1.5 py-0.5 bg-white border border-gray-100 rounded text-[9px] font-black shadow-sm">↑↓</kbd>
                            <span className="text-[8px] font-black uppercase tracking-widest">Navigate</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSearchPalette;
 ```

## File: src/components/ContactSection.jsx
 ```javascript
import React, { useContext, useState } from 'react';
import ConfigContext from '../context/ConfigContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const ContactSection = () => {
  const { config } = useContext(ConfigContext);
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  
  const contact = config?.contact ?? {};
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toastError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/contact', {
        name: form.name,
        email: form.email,
        subject: form.subject || 'New Marketplace Enquiry',
        message: form.message
      });
      success("Inquiry sent! We'll stay in touch.");
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toastError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#F5F5F7] px-6 py-20 font-sans">
      <div className="max-w-[1400px] mx-auto bg-white rounded-[3rem] p-8 md:p-16 flex flex-col lg:flex-row gap-16 lg:gap-24 shadow-sm">
        <div className="w-full lg:w-1/2 flex flex-col gap-10">
          <div>
            <h2 className="text-5xl md:text-7xl font-black text-black tracking-tight mb-6">
              {contact.heading || 'Contact us'}
            </h2>
            <p className="text-gray-500 text-lg font-medium">
              {contact.subheading || 'Send us a message and we will get back to you.'}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <InfoCard label="Email" value={contact.email || config?.supportEmail} />
            <InfoCard label="Address" value={contact.address} />
            <InfoCard label="Phone" value={contact.phone} />
          </div>
        </div>

        <div className="w-full lg:w-1/2">
          <div className="border border-gray-100 rounded-[2.5rem] p-8 md:p-10 h-full flex flex-col justify-between">
            <h3 className="text-3xl md:text-4xl font-bold text-black tracking-tight mb-8">
              Send an enquiry
            </h3>

            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <Field label="Full Name">
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-700 placeholder-gray-400"
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-700 placeholder-gray-400"
                />
              </Field>

              <Field label="Subject">
                <input
                  type="text"
                  placeholder="What is this regarding?"
                  value={form.subject}
                  onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-700 placeholder-gray-400"
                />
              </Field>

              <Field label="Message">
                <textarea
                  placeholder="Type your message here..."
                  rows="4"
                  value={form.message}
                  onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-700 placeholder-gray-400 resize-none"
                />
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full bg-[#86A1FF] hover:bg-blue-600 text-white font-bold text-lg py-4 rounded-full transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-2">
    <label className="text-gray-900 font-medium">{label}</label>
    {children}
  </div>
);

const InfoCard = ({ label, value }) => {
  if (!value) {
    return null;
  }

  return (
    <div className="bg-[#F9FAFB] rounded-2xl p-6 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
          </svg>
        </div>
        <span className="font-bold text-black">{label}</span>
      </div>
      <p className="text-gray-600 pl-9 font-medium">{value}</p>
    </div>
  );
};

export default ContactSection;
 ```

## File: src/components/growth/FlashBanner.jsx
 ```javascript
import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import { formatCurrency } from '../../utils/normalizers';

const FlashBanner = () => {
    const { user } = useContext(AuthContext);
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!user || !user.flashSaleExpiresAt) return;

        const updateTimer = () => {
            const expiry = new Date(user.flashSaleExpiresAt).getTime();
            const now = new Date().getTime();
            const diff = expiry - now;

            if (diff <= 0) {
                setTimeLeft(null);
            } else {
                setTimeLeft(diff);
            }
        };

        const interval = setInterval(updateTimer, 1000);
        updateTimer();

        return () => clearInterval(interval);
    }, [user]);

    if (!timeLeft) return null;

    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-black text-white p-6 rounded-[2.5rem] shadow-2xl shadow-black/30 border border-white/10 relative overflow-hidden group">
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                
                <div className="relative z-10 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500 text-black rounded-2xl flex items-center justify-center text-xl animate-pulse">⚡</div>
                        <div>
                            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Limited Time Offer</h4>
                            <p className="text-sm font-bold tracking-tight">Enjoy <span className="text-emerald-400">40% OFF</span> your first purchase.</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="flex gap-1 font-mono text-2xl font-black text-white tracking-tighter">
                            <span>{String(minutes).padStart(2, '0')}</span>
                            <span className="opacity-30">:</span>
                            <span>{String(seconds).padStart(2, '0')}</span>
                        </div>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Offer Ends</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlashBanner;
 ```

## File: src/components/ProductReviews.jsx
 ```javascript
import React, { useCallback, useContext, useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import productService from '../services/productService';

const ProductReviews = ({ productId }) => {
    const { user } = useContext(AuthContext);
    const { success, error } = useToast();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const fetchReviews = useCallback(async () => {
        try {
            const data = await productService.getReviews(productId);
            setReviews(Array.isArray(data) ? data : []);
        } catch (err) {
            error(err.message || 'Failed to load reviews');
        } finally {
            setLoading(false);
        }
    }, [error, productId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);

        try {
            await productService.createReview(productId, { rating, comment });
            setComment('');
            setRating(5);
            success('Review added successfully');
            fetchReviews();
        } catch (err) {
            error(err.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="w-full bg-[#F5F5F7] px-6 pb-20 font-sans">
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6 gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-black">Reviews</h2>
                            <p className="text-gray-500 mt-2">What buyers are saying about this product.</p>
                        </div>
                        <div className="text-sm font-bold text-gray-500">
                            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-gray-500">Loading reviews...</p>
                    ) : reviews.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-500">
                            No reviews yet. Be the first to share feedback.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="rounded-2xl border border-gray-100 p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-black">{review.user?.name || 'Verified buyer'}</h3>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}
                                            </p>
                                        </div>
                                        <div className="text-primary font-bold">{'★'.repeat(review.rating)}</div>
                                    </div>
                                    {review.comment && (
                                        <p className="text-gray-600 leading-relaxed mt-4">{review.comment}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm h-fit">
                    <h3 className="text-xl font-black text-black mb-2">Leave a review</h3>
                    <p className="text-gray-500 text-sm mb-6">Share a quick rating and note for other buyers.</p>

                    {!user ? (
                        <div className="rounded-2xl bg-gray-50 p-5 text-sm text-gray-600">
                            Sign in to leave a review after purchase.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Rating</label>
                                <select
                                    value={rating}
                                    onChange={(event) => setRating(Number(event.target.value))}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                >
                                    {[5, 4, 3, 2, 1].map((value) => (
                                        <option key={value} value={value}>
                                            {value} star{value > 1 ? 's' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Comment</label>
                                <textarea
                                    value={comment}
                                    onChange={(event) => setComment(event.target.value)}
                                    rows={5}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                    placeholder="What worked well? Any setup notes for other buyers?"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ProductReviews;
 ```

## File: src/components/common/TestimonialForm.jsx
 ```javascript
import React, { useState, useContext } from 'react';
import testimonialService from '../../services/testimonialService';
import AuthContext from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Star, Send } from 'lucide-react';

const TestimonialForm = ({ onSuccess }) => {
    const { user } = useContext(AuthContext);
    const { addToast } = useToast();
    const [content, setContent] = useState('');
    const [rating, setRating] = useState(5);
    const [submitting, setSubmitting] = useState(false);

    if (!user) {
        return (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-3xl p-8 text-center">
                <p className="text-gray-600 mb-4">Please log in to share your testimonial.</p>
                <a href="/login" className="inline-block bg-black text-white px-6 py-2 rounded-full font-bold">Login</a>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) {
            addToast('Please enter your feedback', 'error');
            return;
        }

        try {
            setSubmitting(true);
            await testimonialService.create({ content, rating });
            addToast('Testimonial submitted! It will appear after admin approval.', 'success');
            setContent('');
            setRating(5);
            if (onSuccess) onSuccess();
        } catch (err) {
            addToast(err.message || 'Failed to submit testimonial', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 max-w-2xl mx-auto my-12">
            <h3 className="text-2xl font-black text-black mb-2">Share your experience</h3>
            <p className="text-gray-500 mb-6 text-sm">Your feedback helps us grow and improve for everyone.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">How would you rate us?</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => setRating(num)}
                                className={`p-2 transition-all ${rating >= num ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                            >
                                <Star size={32} fill={rating >= num ? "currentColor" : "none"} />
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Your Testimonial</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What did you like about our templates? How was your experience?"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 min-h-[120px] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                    ></textarea>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <Send size={18} />
                            Submit Testimonial
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default TestimonialForm;
 ```

## File: src/components/common/Button.jsx
 ```javascript
import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({
    children,
    to,
    onClick,
    variant = 'primary', // primary, secondary, outline, ghost
    className = '',
    type = 'button',
    ...props
}) => {

    const baseStyles = "inline-flex items-center justify-center px-6 py-3 rounded-full font-bold transition-all duration-200 active:scale-95";

    const variants = {
        primary: "bg-primary hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20",
        secondary: "bg-black hover:bg-gray-800 text-white shadow-lg",
        outline: "bg-transparent border-2 border-white/20 hover:bg-white/10 text-white",
        ghost: "bg-transparent hover:bg-gray-100 text-gray-900",
        white: "bg-white text-black hover:bg-gray-50 shadow-lg"
    };

    const combinedClasses = `${baseStyles} ${variants[variant] || variants.primary} ${className}`;

    if (to) {
        return (
            <Link to={to} className={combinedClasses} {...props}>
                {children}
            </Link>
        );
    }

    return (
        <button type={type} onClick={onClick} className={combinedClasses} {...props}>
            {children}
        </button>
    );
};

export default Button;
 ```

## File: src/components/common/ProtectedRoute.jsx
 ```javascript
import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export const AdminRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};
 ```

## File: src/components/common/ScrollToTop.jsx
 ```javascript
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Immediate teleportation to the top
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
 ```

## File: src/components/BrowseTemplatesCTA.jsx
 ```javascript
import React from 'react';
import { Link } from 'react-router-dom';

const BrowseTemplatesCTA = () => {
  return (
    <div className="w-full bg-[#F5F5F7] px-6 py-20 font-sans">

      {/* Main White Card Container */}
      <div className="max-w-[1400px] mx-auto bg-white rounded-[3rem] p-8 md:p-12 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 relative overflow-hidden shadow-sm">

        {/* 1. LEFT SIDE: Image Collage */}
        <div className="w-full lg:w-1/2 h-[500px] grid grid-cols-2 gap-4 z-10">

          {/* Column 1 (Stacked Images) */}
          <div className="flex flex-col gap-4 h-full">

            {/* Top Image: Portfolio/Music */}
            <div className="h-1/2 w-full rounded-2xl overflow-hidden relative group">
              <img
                src="https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=800"
                alt="Portfolio Template"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute top-4 left-4 text-white font-bold tracking-widest uppercase text-sm drop-shadow-md">William</div>
            </div>

            {/* Bottom Image: Purple UI Card */}
            <div className="h-1/2 w-full bg-[#5D5FEF] rounded-2xl overflow-hidden relative flex items-center justify-center group p-4">
              {/* Abstract UI Elements representing the image content */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#5D5FEF] to-[#8688FF]"></div>
              <div className="relative z-10 grid grid-cols-2 gap-2 w-full max-w-[150px]">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg h-16 w-full"></div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg h-16 w-full"></div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg h-16 w-full"></div>
                <div className="col-span-1 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-white/50 flex items-center justify-center text-white text-xs">+3</div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 text-white font-bold text-xl">Pro</div>
            </div>

          </div>

          {/* Column 2 (Tall Image: SaaS/Dark Mode) */}
          <div className="h-full w-full rounded-2xl overflow-hidden relative group">
            <img
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800"
              alt="SaaS Template"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Overlay to simulate the dark UI look in screenshot */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>

            {/* Mock Text Content Overlay */}
            <div className="absolute top-10 left-6 right-6 text-white">
              <div className="w-8 h-8 rounded-full bg-blue-500 mb-4"></div>
              <h3 className="text-xl font-bold leading-tight mb-2">Transform custom engagement</h3>
              <p className="text-xs text-gray-300">Seamlessly integrate advanced chatbot technology.</p>
            </div>
          </div>

        </div>


        {/* 2. RIGHT SIDE: Content */}
        <div className="w-full lg:w-1/2 flex flex-col items-start gap-8 relative z-10">

          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>

          {/* Text Content */}
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-black tracking-tight leading-[1.1] mb-4">
              Browse from our quality templates
            </h2>
            <p className="text-gray-500 text-lg md:text-xl font-medium">
              Unlock brilliance—build your website the smart way.
            </p>
          </div>

          {/* CTA Button */}
          <Link to="/templates" className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-xl shadow-blue-500/20">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Browse Templates
          </Link>
        </div>


        {/* 3. DECORATION (Bottom Right Background Shapes) */}
        <div className="absolute -bottom-10 -right-10 z-0">
          {/* Outer lighter shape */}
          <div className="w-80 h-80 bg-gray-50 rounded-[3rem] transform rotate-3"></div>
          {/* Inner darker shape */}
          <div className="absolute top-10 left-10 w-64 h-64 bg-[#EBEBEB] rounded-[2.5rem] transform -rotate-6 opacity-50"></div>
        </div>

      </div>
    </div>
  );
};

export default BrowseTemplatesCTA; ```

## File: src/components/FAQSection.jsx
 ```javascript
import React, { useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfigContext from '../context/ConfigContext';

const FAQItem = ({ question, answer, isOpen, onClick }) => {
    return (
        <div
            className="bg-white rounded-3xl p-6 md:p-8 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl border border-gray-100 group"
            onClick={onClick}
        >
            <div className="flex justify-between items-start gap-4">
                <h3 className="text-lg md:text-xl font-black text-black leading-tight select-none group-hover:text-primary transition-colors">
                    {question}
                </h3>

                <button type="button" className={`mt-1 transition-all duration-500 ${isOpen ? 'rotate-45 text-primary' : 'text-gray-400'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}`}
            >
                <p className="text-gray-500 font-medium leading-relaxed border-t border-gray-50 pt-6">
                    {answer}
                </p>
            </div>
        </div>
    );
};

const FAQSection = () => {
    const { config } = useContext(ConfigContext);
    const faqData = useMemo(() => Array.isArray(config?.faqs) ? config.faqs : [], [config?.faqs]);
    const [openItems, setOpenItems] = useState({ 0: true });

    const toggleItem = (index) => {
        setOpenItems((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    if (!faqData.length) return null;

    const midpoint = Math.ceil(faqData.length / 2);
    const col1 = faqData.slice(0, midpoint);
    const col2 = faqData.slice(midpoint);

    return (
        <div className="w-full bg-[#F5F5F7] px-6 py-32 font-sans overflow-hidden">
            <div className="max-w-[1400px] mx-auto">
                <div className="text-center mb-20 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 blur-[100px] -z-10"></div>
                    <h2 className="text-4xl md:text-6xl font-black text-black mb-6 tracking-tight">Got Questions?</h2>
                    <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium">
                        Everything you need to know about our templates, licensing, and technical support in one place.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="flex flex-col gap-6">
                        {col1.map((item, index) => (
                            <FAQItem
                                key={`${item.question}-${index}`}
                                question={item.question}
                                answer={item.answer}
                                isOpen={openItems[index]}
                                onClick={() => toggleItem(index)}
                            />
                        ))}
                    </div>

                    <div className="flex flex-col gap-6">
                        {col2.map((item, index) => {
                            const actualIndex = index + midpoint;
                            return (
                                <FAQItem
                                    key={`${item.question}-${actualIndex}`}
                                    question={item.question}
                                    answer={item.answer}
                                    isOpen={openItems[actualIndex]}
                                    onClick={() => toggleItem(actualIndex)}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className="mt-24 text-center">
                    <div className="inline-block bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100">
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-4">Still have doubts?</p>
                        <Link to="/contact" className="inline-flex items-center gap-2 text-primary font-black hover:opacity-80 transition-all group text-xl">
                            Contact our support team
                            <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQSection;
 ```

## File: src/components/TemplateCarousel.jsx
 ```javascript
import React, { useMemo, useRef } from 'react';

const TemplateCarousel = ({ product }) => {
  const scrollRef = useRef(null);
  
  const mediaItems = useMemo(() => {
    const items = Array.isArray(product?.previewImages)
      ? product.previewImages
          .filter((item) => item?.url)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((item) => ({ ...item, type: 'image' }))
      : [];

    if (product?.videoUrl) {
      items.unshift({
        url: product.videoUrl,
        alt: `${product.title} video preview`,
        caption: 'Video walkthrough',
        sortOrder: -1,
        type: 'video',
      });
    }

    return items;
  }, [product]);

  if (!mediaItems.length) return null;

  return (
    <div className="w-full bg-[#F5F5F7] py-20 font-sans border-b border-gray-200/50">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4 uppercase text-[10px] tracking-[0.3em] lg:normal-case lg:text-[4rem]">
              Visual <span className="text-primary">Showcase</span>
            </h2>
            <p className="text-gray-500 font-medium text-lg max-w-xl">
              Take a deep dive into the interface and user experience of this template. High-fidelity previews of every core view.
            </p>
          </div>
          <div className="hidden md:flex gap-2">
            <button 
              onClick={() => scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors shadow-sm"
            >
              ←
            </button>
            <button 
              onClick={() => scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors shadow-sm"
            >
              →
            </button>
          </div>
        </div>

        {/* Play Store Style Horizontal Scroll */}
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {mediaItems.map((item, index) => (
            <div 
              key={index}
              className="flex-shrink-0 w-[300px] md:w-[600px] snap-center"
            >
              {/* Browser Window Frame */}
              <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-200 shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="ml-4 flex-grow bg-white rounded-lg border border-gray-200 py-1.5 px-4 text-[10px] text-gray-400 font-mono truncate">
                    https://digitalstudio.io/templates/{product.slug}/preview-{index + 1}
                  </div>
                </div>
                
                <div className="relative aspect-[4/3] md:aspect-video bg-gray-100">
                  {item.type === 'video' ? (
                    <video 
                      src={item.url} 
                      controls 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img 
                      src={item.url} 
                      alt={item.alt || product.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  {item.type === 'video' ? 'Interactable Video' : `View ${index + 1}`}
                </span>
                <h4 className="text-xl font-bold text-black">
                  {item.caption || (item.type === 'video' ? 'Product Walkthrough' : 'Interface Screenshot')}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
};

export default TemplateCarousel;
 ```

## File: src/components/FeaturesGrid.jsx
 ```javascript
import React from 'react';

const FeaturesGrid = () => {
  return (
    <div className="w-full bg-[#F5F5F7] px-6 py-20 font-sans">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-16">

        {/* 1. HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">

          {/* Left: Huge Title */}
          <h2 className="max-w-4xl text-5xl md:text-7xl font-black text-black tracking-tight leading-[0.95]">
            Fully <span className="text-primary">responsive</span> and customizable
          </h2>

          {/* Right: Description Text */}
          <p className="max-w-xs text-gray-500 text-lg font-medium leading-relaxed pb-2">
            No more website woes—just powerful solutions at your fingertips
          </p>
        </div>

        {/* 2. CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* CARD 1: White Card (Bottom-Right Decoration) */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden min-h-[450px] h-auto group hover:shadow-xl transition-all duration-300">

            {/* Content */}
            <div className="relative z-10 flex flex-col items-start gap-6">
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              </div>

              {/* Text */}
              <div>
                <h3 className="text-4xl font-bold text-black tracking-tight leading-tight mb-4">
                  Built with global standards
                </h3>
                <p className="text-gray-500 text-lg font-medium">
                  We follow elite-tier coding practices to ensure your site is secure, fast, and SEO-optimized out of the box.
                </p>
              </div>

              {/* Button */}
              <button className="mt-4 flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-full font-semibold transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                Browse Templates
              </button>
            </div>

            {/* Decoration Shape (Bottom Right) */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-gray-50 rounded-[3rem] transform rotate-12 opacity-80 z-0 group-hover:scale-105 transition-transform duration-500" />
          </div>


          {/* CARD 2: White Card (Top-Right Decoration) */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 flex flex-col relative overflow-hidden min-h-[450px] h-auto group hover:shadow-xl transition-all duration-300">

            {/* Decoration Shape (Top Right) */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-gray-50 rounded-[3rem] transform -rotate-12 opacity-80 z-0 group-hover:scale-105 transition-transform duration-500" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-start gap-6 mt-4">
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>

              {/* Text */}
              <div className="mt-6 md:mt-10">
                <h3 className="text-4xl font-bold text-black tracking-tight leading-tight mb-4">
                  Scale up 2x faster
                </h3>
                <p className="text-gray-500 text-lg font-medium">
                  Stop reinventing the wheel. Use our pre-built components to launch products in days, not months.
                </p>
              </div>
            </div>
          </div>


          {/* CARD 3: Blue Card (Checklist) */}
          <div className="bg-primary rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden min-h-[450px] h-auto group hover:shadow-xl transition-all duration-300 shadow-lg shadow-blue-500/20">

            {/* Subtle Gradient Overlay */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            {/* Top Section */}
            <div className="relative z-10 flex flex-col items-start gap-6">
              {/* Icon (White) */}
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-primary">
                {/* Framer 'F' Logo */}
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
                  <path d="M4 0h16v8h-8zM4 8h8l8 8h-16zM4 16h8v8z" />
                </svg>
              </div>

              {/* Text */}
              <div className="mt-4">
                <h3 className="text-4xl font-bold text-white tracking-tight leading-tight mb-4">
                  Next-Gen Stacks
                </h3>
                <p className="text-blue-100 text-lg font-medium">
                  Always up-to-date with React, Next.js, and modern CSS frameworks.
                </p>
              </div>
            </div>

            {/* Bottom Section: Checklist */}
            <div className="relative z-10 flex flex-col gap-4 mt-8">

              {/* Item 1: Checked */}
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white font-medium text-lg">Pick a template</span>
              </div>

              {/* Item 2: Empty */}
              <div className="flex items-center gap-3 opacity-60">
                <div className="w-6 h-6 rounded-full border-2 border-white/50"></div>
                <span className="text-white font-medium text-lg">Customize it</span>
              </div>

              {/* Item 3: Empty */}
              <div className="flex items-center gap-3 opacity-60">
                <div className="w-6 h-6 rounded-full border-2 border-white/50"></div>
                <span className="text-white font-medium text-lg">Launch</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FeaturesGrid; ```

## File: src/components/BuildSitesHeader.jsx
 ```javascript
import React from 'react';

const BuildSitesHeader = ({
  title = "Easily build sites with our",
  highlight = "templates",
  description = "No more website woes—just powerful solutions at your fingertips"
}) => {
  return (
    <div className="w-full bg-[#F5F5F7] px-6 py-12 md:py-20 font-sans">
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-10">

        {/* Left: Heading */}
        <h2 className="max-w-4xl text-5xl md:text-6xl lg:text-[4.5rem] font-bold text-black tracking-tight leading-[0.95]">
          {title} <br className="hidden md:block" />
          <span className="text-primary">{highlight}</span>
        </h2>

        {/* Right: Description */}
        <p className="max-w-xs text-gray-500 text-lg md:text-l font-medium leading-relaxed pb-2">
          {description}
        </p>

      </div>
    </div>
  );
};

export default BuildSitesHeader; ```

## File: src/components/FeaturedHeader.jsx
 ```javascript
import React, { useContext } from 'react';
import ConfigContext from '../context/ConfigContext';

const FeaturedHeader = () => {
    const { config } = useContext(ConfigContext);
    const socialProof = config?.socialProof ?? {};
    const avatars = socialProof.avatarImages ?? [];

    return (
        <div className="w-full bg-[#F5F5F7] px-6 py-12 md:py-20 pl-6 font-sans">
            <div className="max-w-[1400px] mx-auto flex flex-col items-start gap-6">
                <h2 className="text-5xl md:text-6xl lg:text-[4.5rem] font-black text-black tracking-tight leading-[1.1]">
                    Featured marketplace products
                </h2>

                {(avatars.length > 0 || socialProof.rating || socialProof.creatorsLabel) && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-2">
                        {avatars.length > 0 && (
                            <div className="flex items-center pl-3">
                                {avatars.map((src, index) => (
                                    <div
                                        key={index}
                                        className="relative w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-[#F5F5F7] -ml-3 overflow-hidden shrink-0 first:ml-0 z-0 hover:z-10 hover:scale-110 transition-transform duration-200"
                                    >
                                        <img
                                            src={src}
                                            alt={`Customer ${index + 1}`}
                                            className="w-full h-full object-cover grayscale"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                {socialProof.rating && <span className="text-lg font-bold text-gray-700">{socialProof.rating}</span>}
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <svg
                                            key={i}
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            className="w-5 h-5 text-primary"
                                        >
                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                        </svg>
                                    ))}
                                </div>
                            </div>

                            <p className="text-gray-500 font-medium text-base">
                                {socialProof.creatorsLabel || socialProof.summary}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeaturedHeader;
 ```

## File: src/components/ResponsiveShowcase.jsx
 ```javascript
import React, { useContext, useMemo } from 'react';
import ConfigContext from '../context/ConfigContext';

const ResponsiveShowcase = ({ products = [] }) => {
  const { config } = useContext(ConfigContext);

  const showcaseItems = useMemo(() => {
    if (Array.isArray(config?.showcaseItems) && config.showcaseItems.length > 0) {
      return config.showcaseItems;
    }

    return products.slice(0, 3).map((product, index) => ({
      title: product.title,
      subtitle: product.category,
      description: product.description,
      image: product.previewImages?.[0]?.url || product.image,
      footer: ['Desktop', 'Tablet', 'Mobile'][index] || 'Preview',
    }));
  }, [config?.showcaseItems, products]);

  if (!showcaseItems.length) {
    return null;
  }

  return (
    <div className="w-full bg-[#F5F5F7] px-6 py-20 font-sans">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {showcaseItems.map((item) => (
          <div key={`${item.title}-${item.footer}`} className="flex flex-col gap-4 group">
            <div className="w-full aspect-[4/3.5] bg-white rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-500 ease-out group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] group-hover:-translate-y-2 relative border border-gray-100/50">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 via-white to-slate-200" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-xs uppercase tracking-[0.25em] text-white/70 mb-2">{item.footer}</p>
                <h3 className="text-2xl font-black tracking-tight">{item.title}</h3>
                {item.subtitle && <p className="text-sm text-white/80 mt-2">{item.subtitle}</p>}
                {item.description && <p className="text-sm text-white/75 mt-3 line-clamp-3">{item.description}</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm group-hover:shadow-md transition-shadow">
              <div>
                <div className="text-lg font-bold text-black">{item.footer}</div>
                {item.subtitle && <div className="text-sm text-gray-500">{item.subtitle}</div>}
              </div>
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" /></svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveShowcase;
 ```

## File: src/hooks/useLocalStorageState.js
 ```javascript
import { useState, useEffect } from 'react';

export function useLocalStorageState(key, defaultValue) {
    const [state, setState] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item !== null) {
                return JSON.parse(item);
            }
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
        }
        return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error writing localStorage key "${key}":`, error);
        }
    }, [key, state]);

    // Handle cross-tab synchronization
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === key && e.newValue !== null) {
                try {
                    setState(JSON.parse(e.newValue));
                } catch (error) {
                    console.error(`Error parsing new localStorage key "${key}":`, error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [state, setState];
}
 ```

## File: src/main.jsx
 ```javascript
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css"; // Tailwind styles

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
 ```

## File: src/App.jsx
 ```javascript
import React, { Suspense, lazy, useContext, useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components
import Navbar from "./components/layout/Navbar";
import BottomNav from "./components/layout/BottomNav";
import Footer from "./components/layout/Footer";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ToastProvider } from "./context/ToastContext";
import ConfigContext, { ConfigProvider } from './context/ConfigContext';
import ErrorBoundary from './components/ErrorBoundary';
import MaintenancePage from "./pages/MaintenancePage";
import ScrollToTop from "./components/common/ScrollToTop";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

import { ProtectedRoute, AdminRoute } from "./components/common/ProtectedRoute";

// Lazy Load Pages
const Home = lazy(() => import("./pages/Home"));
const Templates = lazy(() => import("./pages/Templates"));
const Features = lazy(() => import("./pages/Features"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TemplatesDetails = lazy(() => import("./pages/TemplatesDetails"));
const Login = lazy(() => import("./pages/Auth/Login"));
const Register = lazy(() => import("./pages/Auth/Register"));
const OAuthCallback = lazy(() => import("./pages/Auth/OAuthCallback"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const ProductEdit = lazy(() => import("./pages/admin/ProductEdit"));
const DocEdit = lazy(() => import("./pages/admin/DocEdit"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Profile = lazy(() => import("./pages/Profile"));
const Docs = lazy(() => import('./pages/Docs'));
const DocViewer = lazy(() => import('./pages/DocViewer'));
const DevChat = lazy(() => import('./pages/DevChat'));
const Pricing = lazy(() => import('./pages/PricingPlan'));
const SubscriptionCheckout = lazy(() => import('./pages/SubscriptionCheckout'));
import SearchPalette from "./components/ui/SearchPalette";
import FlashBanner from "./components/growth/FlashBanner";

const AppShell = () => {
  const { config, loading } = useContext(ConfigContext);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [platformDown, setPlatformDown] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const features = config?.features ?? {};

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      // '/' key (only if not in an input)
      if (e.key === '/') {
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Referral captured
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      sessionStorage.setItem('ds_partner_ref', ref);
      console.log('Referral captured:', ref);
    }

    const handleMaintenance = (e) => {
      setPlatformDown(true);
      setMaintenanceMsg(e.detail);
    };

    window.addEventListener('platform_maintenance', handleMaintenance);
    return () => window.removeEventListener('platform_maintenance', handleMaintenance);
  }, [location.search]);

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-[#F5F5F7] text-black font-bold">Starting DigitalStudio...</div>;
  }

  // Allow access to admin and auth paths during maintenance
  const isAuthPath = location.pathname.startsWith('/login') || location.pathname.startsWith('/register') || location.pathname.startsWith('/auth');
  const isBypassPath = isAdminPath || isAuthPath;

  const isMaintenance = (platformDown || config?.maintenanceMode) && !isBypassPath;

  if (isMaintenance) {
    return <MaintenancePage message={maintenanceMsg || config?.maintenanceMessage} />;
  }

  const isChatPath = location.pathname.startsWith('/chat');
  const hideLayout = isAdminPath || isChatPath;

  const mainPadding = hideLayout
    ? 'pt-0' 
    : (config?.showAnnouncement && config?.announcements?.length > 0 ? 'pt-32 md:pt-40' : 'pt-24 md:pt-32');

  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#F5F5F7] text-black font-bold">Loading Marketplace...</div>}>
      <ErrorBoundary>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen bg-[#F5F5F7]">
          {!hideLayout && <Navbar onSearchClick={() => setIsSearchOpen(true)} />}
          <SearchPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
          {!hideLayout && <FlashBanner />}
          {!hideLayout && <BottomNav />}
          <main className={`flex-grow transition-all duration-300 ${!hideLayout ? 'pb-32 md:pb-0' : ''} ${mainPadding}`}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/templates/:id" element={<TemplatesDetails />} />
              <Route path="/features" element={<Features />} />
              {features.testimonials && <Route path="/testimonials" element={<Testimonials />} />}
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/chat" element={<ProtectedRoute><DevChat /></ProtectedRoute>} />

              {features.docs && (
                <>
                  <Route path="/docs" element={<Docs />} />
                  <Route path="/docs/:id" element={<DocViewer />} />
                </>
              )}

              <Route path="/pricing" element={<Pricing />} />
              <Route path="/subscription-checkout" element={<ProtectedRoute><SubscriptionCheckout /></ProtectedRoute>} />

              {features.payments && (
                <>
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                </>
              )}

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/wishlist" element={<Wishlist />} />

               {/* Robust Admin Routes - Fixes 404 issues */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard defaultTab="analytics" /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><AdminDashboard defaultTab="analytics" /></AdminRoute>} />
              <Route path="/admin/inventory" element={<AdminRoute><AdminDashboard defaultTab="inventory" /></AdminRoute>} />
              <Route path="/admin/docs" element={<AdminRoute><AdminDashboard defaultTab="docs" /></AdminRoute>} />
              <Route path="/admin/config" element={<AdminRoute><AdminDashboard defaultTab="config" /></AdminRoute>} />
              <Route path="/admin/maintenance" element={<AdminRoute><AdminDashboard defaultTab="maintenance" /></AdminRoute>} />
              <Route path="/admin/orders" element={<AdminRoute><AdminDashboard defaultTab="orders" /></AdminRoute>} />
              <Route path="/admin/licenses" element={<AdminRoute><AdminDashboard defaultTab="licenses" /></AdminRoute>} />
              <Route path="/admin/subscriptions" element={<AdminRoute><AdminDashboard defaultTab="subscriptions" /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminDashboard defaultTab="users" /></AdminRoute>} />
              <Route path="/admin/marketing" element={<AdminRoute><AdminDashboard defaultTab="marketing" /></AdminRoute>} />
              <Route path="/admin/testimonials" element={<AdminRoute><AdminDashboard defaultTab="testimonials" /></AdminRoute>} />
              <Route path="/admin/showcase" element={<AdminRoute><AdminDashboard defaultTab="showcase" /></AdminRoute>} />
              <Route path="/admin/messages" element={<AdminRoute><AdminDashboard defaultTab="messages" /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminDashboard defaultTab="settings" /></AdminRoute>} />
              
              {/* Specialized Admin Pages */}
              <Route path="/admin/product/new" element={<AdminRoute><ProductEdit /></AdminRoute>} />
              <Route path="/admin/product/:id/edit" element={<AdminRoute><ProductEdit /></AdminRoute>} />
              <Route path="/admin/doc/new" element={<AdminRoute><DocEdit /></AdminRoute>} />
              <Route path="/admin/doc/:id/edit" element={<AdminRoute><DocEdit /></AdminRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          {!hideLayout && <Footer />}
        </div>
      </ErrorBoundary>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <QueryClientProvider client={queryClient}>
                <AppShell />
              </QueryClientProvider>
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </ConfigProvider>
    </AuthProvider>
  );
};

export default App;
 ```

## File: src/pages/Profile.jsx
 ```javascript
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AuthContext from '../context/AuthContext';
import ConfigContext from '../context/ConfigContext';
import orderService from '../services/orderService';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { normalizeOrder, formatCurrency } from '../utils/normalizers';
import api from '../services/api';
import WishlistContext from '../context/WishlistContext';
import aiService from '../services/aiService';

const Profile = () => {
    const { user, logout } = useContext(AuthContext);
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);
    const { wishlistItems } = useContext(WishlistContext);
    const { data: rawOrders, isLoading: loading } = useQuery({
        queryKey: ['orders', 'my'],
        queryFn: () => orderService.getMyOrders(),
        enabled: !!user,
        select: (data) => (Array.isArray(data) ? data.map(normalizeOrder) : []),
    });

    const { data: inquiries, isLoading: loadingInquiries } = useQuery({
        queryKey: ['inquiries', 'my'],
        queryFn: () => api.get('/my-inquiries').then(res => Array.isArray(res) ? res : []),
        enabled: !!user,
    });

    const orders = rawOrders || [];

    const { data: roadmapData, isLoading: loadingRoadmap } = useQuery({
        queryKey: ['ai-roadmap', user?.id],
        queryFn: () => aiService.getUserRoadmap((wishlistItems || []).map(i => i.id)),
        enabled: !!user && activeTab === 'overview',
        staleTime: 1000 * 60 * 60,
    });

    const { data: aiOffer, isLoading: loadingOffer } = useQuery({
        queryKey: ['ai-offer', user?.id],
        queryFn: () => api.post('/marketing/personalized-offers', { wishlistIds: (wishlistItems || []).map(i => i.id) }),
        enabled: !!user && activeTab === 'overview',
        staleTime: 1000 * 60 * 30,
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    const handleLogout = () => {
        logout();
        success("Successfully logged out");
        navigate('/');
    };

    const handleCopyRef = () => {
        const url = `${window.location.origin}/register?ref=${user.partnerCode}`;
        navigator.clipboard.writeText(url);
        success("Referral link copied to clipboard");
    };

    const handleSecureDownload = async (productId, title) => {
        setDownloadingId(productId);
        try {
            const res = await api.get(`/products/${productId}/download`);
            const link = document.createElement('a');
            link.href = res.downloadUrl;
            link.setAttribute('download', `${title.replace(/\s+/g, '_')}_DigitalStudio_Premium.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            success(`Preparing download for ${title}`);
        } catch (err) {
            toastError("Download error: Purchase required or link expired");
        } finally {
            setDownloadingId(null);
        }
    };

    if (!user) return null;

    const { config } = useContext(ConfigContext);
    const tabs = [
        { id: 'overview', label: 'Profile', icon: '👤' },
        { id: 'orders', label: 'Downloads', icon: '📚' },
        { id: 'partner', label: 'Referral Program', icon: '🤝' },
        { id: 'inquiries', label: 'My Enquiries', icon: '✉️' },
        ...(config?.features?.subscriptions ? [{ id: 'subscription', label: 'My Subscription', icon: '💎' }] : []),
        { id: 'settings', label: 'Account Settings', icon: '⚙️' },
    ];

    return (
        <div className="min-h-screen bg-white pt-32 pb-20 px-4 md:px-8 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12">

                {/* Left Navigation */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl shadow-gray-100/50 sticky top-32">
                        <div className="flex flex-col items-center mb-10">
                            <div className={`p-[3px] rounded-[2.2rem] transition-all duration-700 ${user.subscriptionPlan === 'pro' ? 'bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-600 shadow-[0_20px_40px_rgba(251,191,36,0.15)] scale-105' : 'bg-gray-100'}`}>
                                <div className="w-24 h-24 bg-black rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-xl ring-2 ring-white/5 uppercase relative overflow-hidden">
                                    {user.name.charAt(0)}
                                    {user.subscriptionPlan === 'pro' && (
                                        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/10 to-transparent"></div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-8 text-center">
                                <h2 className="text-xl font-black text-black tracking-tight">{user.name}</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{user.email}</p>
                            </div>
                        </div>

                        <nav className="space-y-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all font-bold text-xs uppercase tracking-widest ${activeTab === tab.id
                                            ? 'bg-black text-white shadow-xl translate-x-1'
                                            : 'text-gray-400 hover:text-black hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-lg opacity-80">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                            <div className="h-px bg-gray-50 my-6 mx-4"></div>
                            <button
                                onClick={() => setIsLogoutModalOpen(true)}
                                className="w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all font-bold text-xs uppercase tracking-widest text-red-500 hover:bg-red-50"
                            >
                                <span className="text-lg">🚪</span>
                                Logout
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm min-h-[700px] relative overflow-hidden">
                        
                        {/* Status Accents */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/50 rounded-bl-full -translate-y-4 translate-x-4"></div>

                        <div className="relative z-10">
                            <div className="mb-12">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-2">User Dashboard</p>
                                <h1 className="text-4xl font-black text-black tracking-tighter capitalize">{activeTab.replace('-', ' ')}</h1>
                            </div>

                            {activeTab === 'overview' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <StatCard label="Orders" value={orders.length} sub="Total Purchases" />
                                        <StatCard label="Joined" value={new Date(user.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} sub="Member Since" />
                                        <StatCard 
                                            label="Account Plan" 
                                            value={user.subscriptionPlan === 'pro' ? 'Elite Insight' : 'Standard'} 
                                            sub="Subscription Tier" 
                                            isPro={user.subscriptionPlan === 'pro'}
                                        />
                                    </div>
                                    
                                    <div className={`p-10 rounded-[2.5rem] relative overflow-hidden group ${user.subscriptionPlan === 'pro' ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100' : 'bg-black text-white'}`}>
                                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                                            <div className="max-w-md">
                                                <h3 className="text-2xl font-black mb-3">{user.subscriptionPlan === 'pro' ? '✨ Pro Plan Active' : 'Upgrade to Pro Account'}</h3>
                                                <p className={`text-sm font-medium leading-relaxed ${user.subscriptionPlan === 'pro' ? 'text-emerald-700' : 'text-gray-400'}`}>
                                                    {user.subscriptionPlan === 'pro' 
                                                        ? `Your Pro subscription is active. You have full access to all templates, documentation, and priority features.` 
                                                        : 'Unlock the full power of DigitalStudio. Unlimited downloads, AI-tools, and premium support.'}
                                                </p>
                                            </div>
                                            {user.subscriptionPlan !== 'pro' && (
                                                <button onClick={() => navigate('/pricing')} className="px-10 py-5 bg-white text-black rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20">
                                                    Upgrade Now
                                                </button>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full group-hover:scale-110 transition-all duration-700"></div>
                                    </div>

                                    {user.subscriptionPlan === 'pro' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="p-8 border border-amber-100 bg-amber-50/30 rounded-[2.5rem]">
                                                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4">Pro Perk</h4>
                                                <h5 className="text-xl font-bold text-black mb-2">Unlimited Template Unlocks</h5>
                                                <p className="text-xs text-gray-500 leading-relaxed">As a Pro member, any template marked with a diamond icon is yours to unlock for free.</p>
                                            </div>
                                            <div className="p-8 border border-blue-100 bg-blue-50/30 rounded-[2.5rem]">
                                                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Priority Support</h4>
                                                <h5 className="text-xl font-bold text-black mb-2">Technical Guidance</h5>
                                                <p className="text-xs text-gray-500 leading-relaxed">Direct access to our engineering team for roadmap help and technical implementation questions.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* AI Negotiated Deal */}
                                    {aiOffer && (
                                        <div className="p-10 rounded-[3rem] bg-gradient-to-br from-amber-500 to-amber-700 text-white relative overflow-hidden group shadow-2xl shadow-amber-500/20">
                                            <div className="absolute top-0 right-0 p-8 text-4xl opacity-10 blur-sm group-hover:scale-125 transition-transform duration-1000">🤝</div>
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-8">
                                                    <div>
                                                        <span className="px-3 py-1 bg-white/20 text-[9px] font-black rounded-lg uppercase tracking-widest backdrop-blur-md">Negotiated by AI</span>
                                                        <h3 className="text-3xl font-black mt-4 tracking-tight">{aiOffer.offerTitle}</h3>
                                                        <p className="text-xs font-bold text-amber-100 opacity-90 mt-2 italic">“{aiOffer.pitch}”</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-5xl font-black tracking-tighter">{aiOffer.discount}%<span className="text-lg opacity-60 ml-1">OFF</span></div>
                                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Limited Opportunity</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col md:flex-row gap-6 items-center">
                                                    <div className="flex-1 w-full bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl flex justify-between items-center px-8 group/code cursor-copy active:scale-95 transition-all" onClick={() => {
                                                        navigator.clipboard.writeText(aiOffer.code);
                                                        success(`Promo code ${aiOffer.code} copied!`);
                                                    }}>
                                                        <div>
                                                            <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Exclusive Voucher Code</p>
                                                            <p className="text-2xl font-black tracking-widest font-mono">{aiOffer.code}</p>
                                                        </div>
                                                        <div className="text-xl group-hover/code:translate-x-1 transition-transform">📋</div>
                                                    </div>
                                                    
                                                    <div className="shrink-0 text-center md:text-left">
                                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">Expires In</p>
                                                        <div className="flex gap-3 text-xl font-black tabular-nums">
                                                            <div className="bg-black/20 px-3 py-2 rounded-xl border border-white/10">{aiOffer.expiryHours}h</div>
                                                            <div className="bg-black/20 px-3 py-2 rounded-xl border border-white/10">00m</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Decorative Animation */}
                                            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-[60px] group-hover:scale-150 transition-all duration-1000"></div>
                                        </div>
                                    )}

                                    {/* AI Strategic Trajectory */}
                                    <div className="p-10 rounded-[3rem] border border-gray-100 bg-white shadow-2xl shadow-emerald-500/5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 grayscale group-hover:grayscale-0 group-hover:opacity-10 transition-all duration-700">🧠</div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-6">
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-lg uppercase tracking-widest">AI Strategic Trajectory</span>
                                                <div className="flex gap-1">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></div>
                                                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse delay-75"></div>
                                                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse delay-150"></div>
                                                </div>
                                            </div>
                                            
                                            {loadingRoadmap ? (
                                                <div className="space-y-4">
                                                    <div className="h-4 bg-gray-50 rounded-full w-3/4 animate-pulse"></div>
                                                    <div className="h-4 bg-gray-50 rounded-full w-full animate-pulse"></div>
                                                    <div className="h-4 bg-gray-50 rounded-full w-2/3 animate-pulse"></div>
                                                </div>
                                            ) : roadmapData?.roadmap ? (
                                                <div className="prose prose-sm max-w-none">
                                                    <p className="text-sm font-bold text-gray-800 leading-relaxed whitespace-pre-wrap italic">
                                                        "{roadmapData.roadmap}"
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Analyzing behavioral vectors to generate roadmap...</p>
                                            )}

                                            <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">
                                                <span>Proprietary Intel</span>
                                                <span className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span>
                                                    Live Analysis
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'partner' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-12 bg-black text-white rounded-[3rem] relative overflow-hidden group">
                                            <div className="relative z-10">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 text-emerald-500">Partner Earnings</p>
                                                <h2 className="text-6xl font-black tracking-tighter mb-2">{formatCurrency(user.partnerBalance || 0)}</h2>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available Credits</p>
                                            </div>
                                            <div className="absolute top-0 right-0 p-10 opacity-10 blur-xl group-hover:opacity-20 transition-all">💰</div>
                                        </div>
                                        <div className="p-12 bg-gray-50/50 border border-gray-100 rounded-[3rem] flex flex-col justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Unique Partner Code</p>
                                                <h3 className="text-3xl font-black text-black tracking-tighter font-mono">{user.partnerCode || 'STUDIO-XXX'}</h3>
                                            </div>
                                            <button 
                                                onClick={handleCopyRef}
                                                className="w-full mt-8 py-5 bg-white border border-gray-100 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                                            >
                                                <span>🔗</span> Clone Partner Link
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-12 border border-gray-100 rounded-[3rem] bg-white">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-xl">✨</div>
                                            <div>
                                                <h4 className="text-xl font-black text-black tracking-tight">Referral Program</h4>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">How our affiliate system works</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                            <div className="space-y-4">
                                                <div className="text-2xl">📡</div>
                                                <h5 className="font-black text-black text-sm uppercase">Share Link</h5>
                                                <p className="text-xs text-gray-400 font-medium leading-relaxed italic">Share your unique link with other creators and designers.</p>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="text-2xl">👤</div>
                                                <h5 className="font-black text-black text-sm uppercase">Referrals</h5>
                                                <p className="text-xs text-gray-400 font-medium leading-relaxed italic">When someone signs up using your link, they become your referral.</p>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="text-2xl">💸</div>
                                                <h5 className="font-black text-black text-sm uppercase">Earn Credits</h5>
                                                <p className="text-xs text-gray-400 font-medium leading-relaxed italic">Get ₹100 for every purchase your referrals make, forever.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'orders' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                    {loading ? (
                                        <div className="p-20 text-center animate-pulse text-[10px] font-bold text-gray-400 uppercase tracking-widest">Accessing downloads...</div>
                                    ) : orders.length === 0 && !user.isPro ? (
                                        <div className="text-center py-40 border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/30">
                                            <div className="text-5xl mb-6 grayscale">📦</div>
                                            <h3 className="text-2xl font-black text-black mb-2 tracking-tight">No downloads yet</h3>
                                            <p className="text-sm text-gray-400 font-medium mb-10 uppercase tracking-widest">Your purchased products will appear here</p>
                                            <button onClick={() => navigate('/templates')} className="px-12 py-5 bg-black text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/10 hover:bg-gray-800 transition-all">
                                                Browse Marketplace
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid gap-6">
                                            {orders.map(order => {
                                                const items = order.orderItems || [];
                                                return items.map(item => {
                                                    const product = item.product;
                                                    const isDownloading = downloadingId === product?.id;
                                                    return (
                                                        <div key={`${order.id}-${product?.id}`} className="group bg-white border border-gray-50 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-gray-100 hover:-translate-y-1 transition-all duration-500 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                                                            <div className="w-32 h-32 rounded-[2rem] border border-gray-50 overflow-hidden shadow-sm shrink-0 bg-gray-50 group-hover:scale-105 transition-transform duration-500">
                                                                {product?.image && <img src={product.image} alt="" className="w-full h-full object-cover" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0 text-center md:text-left">
                                                                <h4 className="text-xl font-black text-black tracking-tight mb-2 truncate">{product?.title || 'Unknown Product'}</h4>
                                                                <div className="flex flex-wrap justify-center md:justify-start gap-4 items-center">
                                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Order ID: {order.id}</span>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Verified Purchase</span>
                                                                    <span className="px-2.5 py-1 bg-gray-100 text-[8px] font-black text-gray-500 rounded uppercase">{product?.category}</span>
                                                                </div>
                                                                
                                                                {/* License Details */}
                                                                <div className="mt-6 flex flex-col gap-2">
                                                                     <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Serial Key</p>
                                                                     <div className="bg-gray-50/50 border border-gray-100 px-6 py-3 rounded-2xl font-mono text-[10px] font-bold text-black border-dashed break-all select-all hover:bg-gray-100 transition-colors">
                                                                         DS-{order.id}-{String(product?.id).padStart(4, '0')}-KEY
                                                                     </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                                                                <button 
                                                                    onClick={() => handleSecureDownload(product?.id, product?.title)}
                                                                    disabled={isDownloading}
                                                                    className={`px-8 py-4 bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/10 transition-all active:scale-95 ${isDownloading ? 'bg-gray-300 cursor-wait' : 'hover:bg-gray-800'}`}
                                                                >
                                                                    {isDownloading ? 'Downloading...' : 'Download Files'}
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        const url = prompt("Share your site: Please provide your live deployment URL for ₹50 reward:");
                                                                        if (url) {
                                                                            api.post('/showcase', { productId: product.id, liveUrl: url })
                                                                                .then(() => success("Link received! Thank you for sharing your work."))
                                                                                .catch(() => toastError("Failed to send link"));
                                                                        }
                                                                    }}
                                                                    className="px-8 py-4 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                                                                >
                                                                    Submit for Reward ✨
                                                                </button>
                                                                <button className="px-8 py-4 bg-gray-50 text-gray-400 hover:text-black border border-gray-100 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">
                                                                    Receipt 🧾
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'subscription' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="bg-black text-white p-12 rounded-[3.5rem] relative overflow-hidden">
                                        <div className="relative z-10">
                                            <h3 className="text-3xl font-black mb-6 tracking-tight">Subscription Plan</h3>
                                            <div className="flex items-baseline gap-4 mb-10">
                                                <span className="text-7xl font-black tracking-tighter capitalize">{user.subscriptionPlan}</span>
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Plan</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Benefit</p>
                                                    <p className="text-sm font-bold">Lifetime Commercial License</p>
                                                </div>
                                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Status</p>
                                                    <p className="text-sm font-bold text-emerald-400">Active</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-10 border border-gray-100 rounded-[3rem] bg-gray-50/20">
                                            <h4 className="font-bold text-black mb-6 uppercase tracking-widest text-xs">Account Details</h4>
                                            <div className="space-y-4">
                                                <MetadataRow label="User ID" value={user.id} />
                                                <MetadataRow label="Provider" value={user.provider || 'DigitalStudio'} />
                                                <MetadataRow label="Expires" value={user.proExpiresAt ? new Date(user.proExpiresAt).toDateString() : 'Never'} />
                                            </div>
                                        </div>
                                        <div className="p-10 border border-gray-100 rounded-[3rem] bg-gray-50/20">
                                            <h4 className="font-bold text-black mb-6 uppercase tracking-widest text-xs">Billing</h4>
                                            <p className="text-xs text-gray-400 font-medium leading-loose">
                                                Your subscription is managed through our secure billing system. For billing inquiries or support, please contact our help team.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'inquiries' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                    {loadingInquiries ? (
                                        <div className="p-20 text-center animate-pulse text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading conversations...</div>
                                    ) : (inquiries || []).length === 0 ? (
                                        <div className="text-center py-40 border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/30">
                                            <div className="text-5xl mb-6 grayscale">✉️</div>
                                            <h3 className="text-2xl font-black text-black mb-2 tracking-tight">No enquiries yet</h3>
                                            <p className="text-sm text-gray-400 font-medium mb-10 uppercase tracking-widest">Need help? Send us a message through the contact page.</p>
                                            <button onClick={() => navigate('/contact')} className="px-12 py-5 bg-black text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/10 hover:bg-gray-800 transition-all">
                                                Contact Support
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid gap-6">
                                            {inquiries.map(inq => (
                                                <div key={inq.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-10 hover:shadow-xl transition-all">
                                                    <div className="flex justify-between items-start gap-4 mb-6">
                                                        <div>
                                                            <h4 className="text-xl font-black text-black tracking-tight mb-2">{inq.subject}</h4>
                                                            <div className="flex items-center gap-3">
                                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                                    inq.status === 'replied' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                                                                }`}>
                                                                    {inq.status}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                                                    {new Date(inq.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50/50 p-6 rounded-2xl mb-6">
                                                        <p className="text-sm text-gray-600 font-medium leading-relaxed">{inq.message}</p>
                                                    </div>
                                                    {inq.reply && (
                                                        <div className="border-t border-gray-100 pt-6">
                                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                <span className="w-5 h-5 bg-primary text-white rounded-lg flex items-center justify-center text-[10px]">✨</span>
                                                                Official Support Response
                                                            </p>
                                                            <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl">
                                                                <p className="text-sm text-gray-600 font-bold leading-relaxed">{inq.reply}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="max-w-xl animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="space-y-10">
                                        <Field label="Full Name">
                                            <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-8 py-5 outline-none focus:border-black font-bold text-sm tracking-tight" defaultValue={user.name} />
                                        </Field>
                                        <Field label="Registered Email">
                                            <input type="email" className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-8 py-5 outline-none font-bold text-sm text-gray-400" defaultValue={user.email} disabled />
                                        </Field>
                                        <div className="pt-8 border-t border-gray-50">
                                            <button className="px-12 py-5 bg-black text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/10 active:scale-95 transition-all">Save Changes</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
            
            <ConfirmModal 
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogout}
                title="Logout?"
                message="Are you sure you want to log out? You will need to log in again to access your downloads and settings."
                confirmText="Logout"
                type="danger"
            />
        </div>
    );
};

const StatCard = ({ label, value, sub, isPro }) => (
    <div className={`p-10 rounded-[2.5rem] border border-gray-100 bg-gray-50/30 group hover:shadow-2xl transition-all duration-500 relative overflow-hidden ${isPro ? 'bg-white shadow-xl shadow-yellow-500/5 ring-1 ring-yellow-400/20' : 'hover:bg-white'}`}>
        {isPro && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-bl-full -translate-y-4 translate-x-4"></div>
        )}
        <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4 group-hover:text-black transition-colors">{label}</div>
        <div className={`text-4xl font-black tracking-tight mb-2 ${isPro ? 'bg-gradient-to-r from-yellow-600 to-amber-400 bg-clip-text text-transparent' : 'text-black'}`}>{value}</div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sub}</div>
    </div>
);

const MetadataRow = ({ label, value }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-black text-black">{value}</span>
    </div>
);

const Field = ({ label, children }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2">{label}</label>
        {children}
    </div>
);

export default Profile;
 ```

## File: src/pages/Docs.jsx
 ```javascript
import React, { useEffect, useMemo, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import docService from '../services/docService';
import { useToast } from '../context/ToastContext';
import { normalizeDoc } from '../utils/normalizers';
import ConfigContext from '../context/ConfigContext';

const Docs = () => {
    const { config } = useContext(ConfigContext);
    const { error } = useToast();
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const navigate = useNavigate();

    // Feature Enforcement
    useEffect(() => {
        if (config && config.features && config.features.docs === false) {
            navigate('/');
        }
    }, [config, navigate]);

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const data = await docService.getAll();
                setDocs(Array.isArray(data) ? data.map(normalizeDoc) : []);
            } catch (err) {
                error(err.message || 'Failed to load docs');
            } finally {
                setLoading(false);
            }
        };

        fetchDocs();
    }, [error]);

    const categories = useMemo(() => ['all', ...new Set(docs.map((doc) => doc.category).filter(Boolean))], [docs]);
    
    const filteredDocs = useMemo(() => {
        return docs.filter((doc) => {
            const matchesFilter = filter === 'all' || doc.category === filter;
            const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesFilter && matchesSearch;
        });
    }, [docs, filter, searchQuery]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] px-4 md:px-6 lg:px-8 py-24 md:py-32 font-sans">
            <div className="max-w-[1400px] mx-auto">
                {/* Search & Filter Bar */}
                <div className="bg-white rounded-3xl p-4 shadow-xl shadow-gray-200/50 mb-12 border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input 
                            type="text" 
                            placeholder="Search guides, tags, or topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-black placeholder:text-gray-400"
                        />
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 px-2 border-r border-gray-100 pr-4">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setFilter(category)}
                                    className={`px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${filter === category
                                        ? 'bg-black text-white shadow-lg'
                                        : 'bg-white text-gray-500 hover:bg-gray-50 border border-transparent'
                                        }`}
                                >
                                    {category === 'all' ? 'All Guides' : category}
                                </button>
                            ))}
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-2xl">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                        {filteredDocs.map((doc) => (
                            <Link 
                                to={`/docs/${doc.id}`} 
                                key={doc.id} 
                                className="group flex flex-col bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden h-full"
                            >
                                {/* Thumbnail Image */}
                                <div className="relative h-48 overflow-hidden">
                                    {doc.image ? (
                                        <img 
                                            src={doc.image} 
                                            alt={doc.title} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-4xl">
                                            {doc.icon || '📄'}
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                                        {doc.isPremium ? (
                                            <span className="px-4 py-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/20">Premium</span>
                                        ) : (
                                            <span className="px-4 py-1.5 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-green-500/20">Free</span>
                                        )}
                                    </div>
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur shadow-sm px-3 py-1 rounded-full text-[10px] font-bold text-gray-900 uppercase tracking-wider">
                                        {doc.category}
                                    </div>
                                </div>

                                <div className="p-8 flex flex-col flex-1 relative">
                                    <h3 className="text-2xl font-black text-black mb-3 leading-tight group-hover:text-primary transition-colors line-clamp-2">{doc.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2 flex-1">{doc.description || doc.previewContent}</p>
                                    
                                    <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Pass Required</p>
                                            <div className="text-sm font-black text-black">
                                                {doc.isPremium ? '💎 DigitalStudio Pro' : '✅ Free Content'}
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all shadow-lg">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 mb-16">
                        {filteredDocs.map((doc) => (
                            <Link 
                                to={`/docs/${doc.id}`} 
                                key={doc.id} 
                                className="group flex items-center bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all gap-6"
                            >
                                <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 relative shadow-inner">
                                    {doc.image ? (
                                        <img src={doc.image} alt={doc.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-3xl">
                                            {doc.icon || '📄'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-xl font-black text-black group-hover:text-primary transition-colors">{doc.title}</h3>
                                        <span className="px-3 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-black uppercase rounded-full">
                                            {doc.category}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-sm line-clamp-1">{doc.description || doc.previewContent}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                        {doc.isPremium ? (
                                            <span className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1">
                                                <span className="text-xs">💎</span> Pro Membership
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-black text-green-500 uppercase flex items-center gap-1">
                                                <span className="text-xs">✅</span> Free Access
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all mr-4">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-8 md:p-12 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-black mb-4">Need More Premium Access?</h2>
                    <p className="text-lg mb-6 opacity-90">
                        Unlock premium guides and tutorials with a DigitalStudio Pro membership. Access exclusive resources to boost your workflow.
                    </p>
                    <Link
                        to="/profile"
                        className="inline-block bg-white text-primary px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
                    >
                        View Account
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Docs;
 ```

## File: src/pages/Testimonials.jsx
 ```javascript
import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TestimonialsGrid from '../components/TestimonialsGrid';
import BuildSitesHeader from '../components/BuildSitesHeader';
import TestimonialForm from '../components/common/TestimonialForm';
import ConfigContext from '../context/ConfigContext';

const Testimonials = () => {
    const { config } = useContext(ConfigContext);
    const navigate = useNavigate();

    // Feature Enforcement
    useEffect(() => {
        if (config && config.features && config.features.testimonials === false) {
            navigate('/');
        }
    }, [config, navigate]);
    return (
        <div className="bg-[#F5F5F7]">
            <BuildSitesHeader
                title="Loved by thousands of"
                highlight="users"
                description="See what others are saying about our templates."
            />
            <TestimonialsGrid />
            <div className="max-w-[1400px] mx-auto pb-20 px-6">
                <TestimonialForm />
            </div>
        </div>
    );
};

export default Testimonials;
 ```

## File: src/pages/Auth/OAuthCallback.jsx
 ```javascript
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const decodeUserParam = (value) => {
    if (!value) return null;

    try {
        const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
        return JSON.parse(window.atob(padded));
    } catch (error) {
        console.error('Failed to decode OAuth user payload', error);
        return null;
    }
};

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { completeOAuth } = useContext(AuthContext);
    const [error, setError] = useState('');

    useEffect(() => {
        const finishOAuth = async () => {
            const token = searchParams.get('token');
            const user = decodeUserParam(searchParams.get('user'));
            const result = await completeOAuth({ token, user });

            if (result.success) {
                navigate('/profile', { replace: true });
            } else {
                setError(result.error || 'OAuth login failed');
            }
        };

        finishOAuth();
    }, [completeOAuth, navigate, searchParams]);

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-6">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 md:p-12 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 text-center">
                {error ? (
                    <>
                        <h1 className="text-2xl font-black text-black mb-3">OAuth Sign-In Failed</h1>
                        <p className="text-gray-500 mb-6">{error}</p>
                        <button
                            onClick={() => navigate('/login', { replace: true })}
                            className="bg-primary text-white px-6 py-3 rounded-full font-bold hover:bg-blue-600 transition-colors"
                        >
                            Back to Login
                        </button>
                    </>
                ) : (
                    <>
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
                        <h1 className="text-2xl font-black text-black mb-3">Signing you in</h1>
                        <p className="text-gray-500">Finalizing your OAuth session and loading your account.</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default OAuthCallback;
 ```

## File: src/pages/Auth/Login.jsx
 ```javascript
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import OAuthButton from '../../components/ui/OAuthButton';
import { getOAuthLoginUrl } from '../../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await login(email, password);
        if (res.success) {
            // Check if user is admin to redirect accordingly
            if (res.user?.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } else {
            setError(res.error);
        }
    };

    const handleOAuth = (provider) => {
        window.location.href = getOAuthLoginUrl(provider);
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-6">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 md:p-12 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100">

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black text-black mb-2">Welcome Back</h1>
                    <p className="text-gray-500">Sign in to access your templates and orders.</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                        <input
                            type="email"
                            className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="mt-4 w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all shadow-[0_10px_20px_-5px_rgba(0,85,255,0.3)] hover:shadow-lg hover:-translate-y-1"
                    >
                        Sign In
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-400 font-medium">Or</span>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <OAuthButton 
                        provider="Google" 
                        onClick={() => handleOAuth('google')}
                        icon={
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                        } 
                    />
                    <OAuthButton 
                        provider="GitHub" 
                        onClick={() => handleOAuth('github')}
                        icon={
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
                        } 
                    />
                </div>

                <p className="mt-8 text-center text-sm text-gray-500">
                    Don't have an account? <Link to="/register" className="text-primary font-bold hover:underline">Create one</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
 ```

## File: src/pages/Auth/Register.jsx
 ```javascript
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const referrerCode = sessionStorage.getItem('ds_partner_ref');
        const res = await register(name, email, password, referrerCode);
        if (res.success) {
            sessionStorage.removeItem('ds_partner_ref'); // Clear after successful registration
            navigate('/');
        } else {
            setError(res.error);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-6">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 md:p-12 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100">

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black text-black mb-2">Create Account</h1>
                    <p className="text-gray-500">Join thousands of creators using our templates.</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                        <input
                            type="email"
                            className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="mt-4 w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all shadow-[0_10px_20px_-5px_rgba(0,85,255,0.3)] hover:shadow-lg hover:-translate-y-1"
                    >
                        Sign Up
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-500">
                    Already have an account? <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
 ```

## File: src/pages/NotFound.jsx
 ```javascript
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#F5F5F7] px-6 text-center">
            <h1 className="text-9xl font-black text-black mb-4">404</h1>
            <p className="text-2xl text-gray-500 mb-8">Page not found</p>
            <Link
                to="/"
                className="bg-primary text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-600 transition-colors"
            >
                Go Back Home
            </Link>
        </div>
    );
};

export default NotFound;
 ```

## File: src/pages/FAQ.jsx
 ```javascript
import React from 'react';
import FAQSection from '../components/FAQSection';

const FAQ = () => {
    return (
        <div className="pt-20">
            <FAQSection />
        </div>
    );
};

export default FAQ;
 ```

## File: src/pages/admin/ProductEdit.jsx
 ```javascript
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import productService from '../../services/productService';
import aiService from '../../services/aiService';
import { useToast } from '../../context/ToastContext';
import { normalizeProduct } from '../../utils/normalizers';

const emptyForm = {
    title: '',
    price: '',
    image: '',
    category: '',
    description: '',
    longDescription: '',
    productType: 'template',
    techStack: '',
    liveDemo: '',
    githubRepo: '',
    hasBackend: false,
    hasFrontend: false,
    fileURL: '',
    version: '1.0.0',
    requiresSubscription: false,
    previewImages: [],
    // SEO Fields
    seoTitle: '',
    seoDescription: '',
    ogImage: '',
};

const ProductEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { success, error } = useToast();
    const isCreateMode = !id;

    const [loading, setLoading] = useState(!isCreateMode);
    const [uploading, setUploading] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [formData, setFormData] = useState(emptyForm);
    const [activeTab, setActiveTab] = useState('general'); // general, gallery, seo, preview
    const [previewDevice, setPreviewDevice] = useState('desktop'); // desktop, mobile

    const pageTitle = useMemo(() => (isCreateMode ? 'Add New Template' : 'Edit Template'), [isCreateMode]);

    useEffect(() => {
        if (isCreateMode) {
            setLoading(false);
            return;
        }

        const fetchProduct = async () => {
            try {
                const data = await productService.getById(id);
                const product = normalizeProduct(data);
                setFormData({
                    ...product,
                    price: String(product.price || ''),
                    techStack: product.techStack?.join(', ') || '',
                    previewImages: product.previewImages?.length > 0 ? product.previewImages : [{ url: '' }],
                    seoTitle: product.seoTitle || product.title,
                    seoDescription: product.seoDescription || product.description,
                    ogImage: product.ogImage || product.image,
                });
            } catch (err) {
                error(err.message || 'Error fetching template details');
                navigate('/admin/inventory');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [error, id, isCreateMode, navigate]);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleGenerateAI = async () => {
        if (!formData.title) return error('Specify a title first!');
        setAiGenerating(true);
        try {
            const result = await aiService.generateDescription(formData.title, formData.techStack);
            setFormData(prev => ({ ...prev, longDescription: result.description }));
            success('AI Content Generated');
        } catch (err) {
            error('AI Service Error');
        } finally {
            setAiGenerating(false);
        }
    };

    const handleUpload = async (event, callback) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const body = new FormData();
        body.append('file', file);
        setUploading(true);
        try {
            const response = await api.post('/upload', body);
            callback(response.filePath || '');
            success('Image uploaded successfully');
        } catch (err) {
            error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (event) => {
        if (event) event.preventDefault();
        const payload = {
            ...formData,
            price: Number(formData.price || 0),
            techStack: formData.techStack.split(',').map((item) => item.trim()).filter(Boolean),
            previewImages: formData.previewImages.filter(img => img.url),
            documentation: [
                formData.hasFrontend ? 'Frontend Guide' : '',
                formData.hasBackend ? 'Backend Guide' : '',
            ].filter(Boolean),
        };

        try {
            if (isCreateMode) {
                await productService.create(payload);
                success('Template created successfully');
            } else {
                await productService.update(id, payload);
                success('Template updated');
            }
            navigate('/admin/inventory');
        } catch (err) {
            error('Failed to save template');
        }
    };

    if (loading) return <div className="p-20 text-center font-bold text-gray-400">Loading details...</div>;

    const tabs = [
        { id: 'general', label: 'Meta', icon: '📝' },
        { id: 'gallery', label: 'Gallery', icon: '🖼️' },
        { id: 'seo', label: 'SEO', icon: '🔍' },
        { id: 'preview', label: 'Mockup', icon: '📱' },
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB] p-8 md:p-14 lg:p-20 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-2">Template Master</p>
                        <h1 className="text-4xl font-bold text-black tracking-tight">{pageTitle}</h1>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => navigate('/admin/inventory')} className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-all">Cancel</button>
                        <button onClick={handleSubmit} className="px-10 py-4 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-95">Save Changes</button>
                    </div>
                </div>

                {/* Main Workspace */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex min-h-[700px]">
                    {/* Tab Selection */}
                    <aside className="w-24 bg-gray-50 border-r border-gray-100 flex flex-col items-center py-10 gap-8">
                        {tabs.map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setActiveTab(t.id)} 
                                className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all ${activeTab === t.id ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:bg-white hover:text-black'}`}
                            >
                                <span className="text-xl">{t.icon}</span>
                                <span className="text-[8px] font-bold uppercase mt-1">{t.label}</span>
                            </button>
                        ))}
                    </aside>

                    {/* Content Panel */}
                    <main className="flex-1 p-12 md:p-16 overflow-y-auto">
                        {activeTab === 'general' && (
                            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                <div className="grid grid-cols-2 gap-8">
                                    <Field label="Template Title">
                                        <input name="title" value={formData.title} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm" placeholder="e.g. Next.js SaaS Boilerplate" />
                                    </Field>
                                    <Field label="Industrial Category">
                                        <input name="category" value={formData.category} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm" placeholder="e.g. Dashboard, SaaS" />
                                    </Field>
                                </div>
                                
                                <Field label="Long Description (MARKDOWN)">
                                    <div className="relative">
                                        <textarea name="longDescription" value={formData.longDescription} onChange={handleChange} rows={12} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-medium text-sm leading-relaxed" />
                                        <button onClick={handleGenerateAI} disabled={aiGenerating} className="absolute top-4 right-4 bg-black text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50">
                                            {aiGenerating ? 'Syncing...' : '✨ Magic Write'}
                                        </button>
                                    </div>
                                </Field>

                                <div className="grid grid-cols-3 gap-8 border-t border-gray-50 pt-10">
                                    <Field label="Price (₹)">
                                        <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm" />
                                    </Field>
                                    <Field label="Tech Stack">
                                        <input name="techStack" value={formData.techStack} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm" placeholder="React, Go, R2" />
                                    </Field>
                                    <Field label="Version">
                                        <input name="version" value={formData.version} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm" placeholder="1.0.0" />
                                    </Field>
                                </div>
                            </div>
                        )}

                        {activeTab === 'gallery' && (
                            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                <Field label="Primary Cover Image">
                                    <div className="flex gap-6 items-center">
                                        <img src={formData.image || 'https://via.placeholder.com/150'} className="w-32 h-32 rounded-3xl object-cover border border-gray-100 bg-gray-50" />
                                        <div className="flex-1 space-y-3">
                                            <input name="image" value={formData.image} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-xs" placeholder="URL or Upload..." />
                                            <label className="inline-block px-6 py-2 border-2 border-black rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-black hover:text-white transition-all">
                                                Upload cover to R2
                                                <input type="file" className="hidden" onChange={(e) => handleUpload(e, (u) => setFormData(p => ({ ...p, image: u })))} />
                                            </label>
                                        </div>
                                    </div>
                                </Field>

                                <div className="space-y-6 pt-10 border-t border-gray-50">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Additional Media Slots</h3>
                                    {(formData.previewImages || []).map((img, idx) => (
                                        <div key={idx} className="flex gap-4 items-center">
                                            <input value={img.url} onChange={(e) => {
                                                const n = [...formData.previewImages];
                                                n[idx] = { ...n[idx], url: e.target.value };
                                                setFormData(p => ({ ...p, previewImages: n }));
                                            }} className="flex-1 px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-xs" placeholder="Slide URL..." />
                                            <label className="shrink-0 p-4 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer hover:bg-black hover:text-white transition-all">
                                                🌩️
                                                <input type="file" className="hidden" onChange={(e) => handleUpload(e, (u) => {
                                                     const n = [...formData.previewImages];
                                                     n[idx] = { ...n[idx], url: u };
                                                     setFormData(p => ({ ...p, previewImages: n }));
                                                })} />
                                            </label>
                                        </div>
                                    ))}
                                    <button onClick={() => setFormData(p => ({ ...p, previewImages: [...(p.previewImages || []), { url: '' }] }))} className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:border-black hover:text-black transition-all">+ Add Visual Frame</button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'seo' && (
                            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                <div>
                                    <h2 className="text-2xl font-bold text-black tracking-tight mb-2">Search Optimization</h2>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Configure metadata for high-fidelity social previews</p>
                                </div>
                                <Field label="Meta Title (SEO)">
                                    <input name="seoTitle" value={formData.seoTitle} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm" />
                                </Field>
                                <Field label="Meta Description">
                                    <textarea name="seoDescription" value={formData.seoDescription} onChange={handleChange} rows={4} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-medium text-sm" />
                                </Field>
                                <Field label="OpenGraph Image (1200x630)">
                                    <div className="flex gap-4 items-center">
                                        <input name="ogImage" value={formData.ogImage} onChange={handleChange} className="flex-1 px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-xs" />
                                        <button onClick={() => setFormData(p => ({...p, ogImage: p.image}))} className="px-4 py-4 bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest">Clone Cover</button>
                                    </div>
                                </Field>
                            </div>
                        )}

                        {activeTab === 'preview' && (
                            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-bold text-black tracking-tight mb-2">Device Mockup Preview</h2>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Verify visual balance across frames</p>
                                    </div>
                                    <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-2 shadow-inner">
                                        <button onClick={() => setPreviewDevice('desktop')} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${previewDevice === 'desktop' ? 'bg-black text-white' : 'text-gray-400'}`}>MacBook</button>
                                        <button onClick={() => setPreviewDevice('mobile')} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${previewDevice === 'mobile' ? 'bg-black text-white' : 'text-gray-400'}`}>iPhone</button>
                                    </div>
                                </div>

                                <div className="flex justify-center py-20 bg-gray-50/50 border border-gray-100 rounded-[2.5rem] relative overflow-hidden min-h-[600px]">
                                    {previewDevice === 'desktop' ? (
                                        <div className="w-[800px] aspect-video bg-white rounded-lg border-8 border-black shadow-2xl relative overflow-hidden transform scale-90 md:scale-100 origin-center transition-all">
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-black rounded-b-md"></div>
                                            <img src={formData.image || 'https://via.placeholder.com/800x450'} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-[300px] h-[600px] bg-white rounded-[3rem] border-8 border-black shadow-2xl relative overflow-hidden transform transition-all">
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-black rounded-b-3xl z-10"></div>
                                            <img src={formData.image || 'https://via.placeholder.com/300x600'} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

const Field = ({ label, children }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2">{label}</label>
        {children}
    </div>
);

export default ProductEdit;
 ```

## File: src/pages/admin/Analytics.jsx
 ```javascript
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import analyticsService from '../../services/analyticsService';
import { normalizeProduct, normalizeSalesSummary } from '../../utils/normalizers';

const Analytics = () => {
    const { data: salesData, isLoading: salesLoading, error: salesError } = useQuery({
        queryKey: ['analytics', 'sales'],
        queryFn: () => analyticsService.getSales(),
    });

    const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
        queryKey: ['analytics', 'top-products'],
        queryFn: () => analyticsService.getTopProducts(),
    });

    const sales = useMemo(() => 
        Array.isArray(salesData) ? salesData.map(normalizeSalesSummary) : [],
    [salesData]);

    const topProducts = useMemo(() => 
        Array.isArray(productsData) ? productsData.map(normalizeProduct) : [],
    [productsData]);

    const loading = salesLoading || productsLoading;
    const error = salesError?.message || productsError?.message;

    const stats = useMemo(() => {
        const totalRevenue = sales.reduce((sum, entry) => sum + entry.revenue, 0);
        const totalSold = sales.reduce((sum, entry) => sum + entry.totalSold, 0);

        return [
            { label: 'Market Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: '💰', trend: '+12%', color: 'from-emerald-500 to-teal-400' },
            { label: 'Global Units', value: totalSold, icon: '📦', trend: '+5%', color: 'from-blue-500 to-cyan-400' },
            { label: 'Active Catalog', value: sales.length, icon: '🏷️', trend: 'Stable', color: 'from-indigo-500 to-purple-400' },
            { label: 'Top Performers', value: topProducts.length, icon: '🏆', trend: '+2', color: 'from-amber-500 to-orange-400' },
        ];
    }, [sales, topProducts]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
                {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-3xl"></div>)}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-100 p-8 rounded-[2rem] text-red-500 flex items-center gap-4">
               <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               </div>
               <div>
                    <h3 className="font-black uppercase text-xs tracking-widest mb-1">Telemetry Interrupted</h3>
                    <p className="text-sm font-medium opacity-80">{error}</p>
               </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-[0.03] rounded-bl-full group-hover:opacity-[0.08] transition-opacity`}></div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                {stat.icon}
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                {stat.trend}
                            </span>
                        </div>
                        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{stat.label}</h3>
                        <p className="text-3xl font-black text-black tracking-tight">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Breakdown */}
                <div className="bg-white border border-gray-100 p-10 rounded-[3rem] shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black text-black tracking-tight">Revenue Matrix</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Per-product performance</p>
                        </div>
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                    </div>
                    
                    <div className="space-y-8">
                        {sales.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                <p className="text-gray-400 text-sm font-black uppercase tracking-widest">Awaiting First Transaction</p>
                            </div>
                        ) : (
                            sales.map((entry) => {
                                const percentage = Math.min(100, entry.revenue > 0 ? (entry.revenue / Math.max(...sales.map((item) => item.revenue), 1)) * 100 : 0);
                                return (
                                    <div key={entry.productId} className="group">
                                        <div className="flex justify-between items-end mb-3">
                                            <div className="min-w-0">
                                                <p className="font-black text-black truncate">{entry.title}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{entry.totalSold} Units Sold</p>
                                            </div>
                                            <span className="font-black text-primary text-sm whitespace-nowrap ml-4">{entry.formattedRevenue}</span>
                                        </div>
                                        <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary via-blue-500 to-cyan-400 rounded-full transition-all duration-1000 ease-out group-hover:brightness-110"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-white border border-gray-100 p-10 rounded-[3rem] shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black text-black tracking-tight">Market Leaders</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">High conversion assets</p>
                        </div>
                        <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" /></svg>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {topProducts.length === 0 ? (
                             <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                <p className="text-gray-400 text-sm font-black uppercase tracking-widest">Catalog Empty</p>
                            </div>
                        ) : (
                            topProducts.map((product, idx) => (
                                <div key={product.id} className="flex items-center gap-6 p-6 rounded-3xl border border-gray-50 hover:border-gray-200 hover:bg-gray-50 transition-all group">
                                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                                        <img src={product.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-primary uppercase">Rank #{idx+1}</span>
                                            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                            <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{product.category}</span>
                                        </div>
                                        <h4 className="font-black text-black truncate">{product.title}</h4>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-black text-black">{product.formattedPrice}</p>
                                        <p className="text-[10px] text-emerald-500 font-bold uppercase">{product.numSales} Sold</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
 ```

## File: src/pages/admin/Marketing.jsx
 ```javascript
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import marketingService from '../../services/marketingService';
import { useToast } from '../../context/ToastContext';

const Marketing = () => {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();
    const [isCreating, setIsCreating] = useState(false);
    const [couponForm, setCouponForm] = useState({
        code: '',
        discountType: 'percentage', // percentage, flat
        discountValue: 0,
        minPurchase: 0,
        expiresAt: '',
    });

    const { data: coupons, isLoading } = useQuery({
        queryKey: ['marketing', 'coupons'],
        queryFn: () => marketingService.getCoupons(),
    });

    const createMutation = useMutation({
        mutationFn: (data) => marketingService.createCoupon(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketing', 'coupons'] });
            success('Coupon code activated');
            setIsCreating(false);
            setCouponForm({ code: '', discountType: 'percentage', discountValue: 0, minPurchase: 0, expiresAt: '' });
        },
        onError: () => toastError('Failed to generate coupon'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => marketingService.deleteCoupon(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketing', 'coupons'] });
            success('Coupon deactivated');
        },
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Coupon Engine - Densified */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 rounded-bl-full -translate-y-4 translate-x-4"></div>
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div>
                        <h2 className="text-xl font-black text-black tracking-tight leading-none mb-3">Promotional Engine</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-60">Revenue Modifiers & Price Offsets</p>
                    </div>
                    <button 
                        onClick={() => setIsCreating(true)} 
                        className="px-6 py-3 bg-black text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/20"
                    >
                        + Generate Modifier
                    </button>
                </div>

                {isCreating && (
                    <div className="mb-8 p-6 bg-gray-50 border border-gray-100 rounded-2xl animate-in slide-in-from-top-4 duration-500">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <Field label="Key Code">
                                <input value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-lg outline-none focus:border-black font-black text-[11px] uppercase tracking-widest" placeholder="SALE50" />
                            </Field>
                            <Field label="Type">
                                <select value={couponForm.discountType} onChange={e => setCouponForm({...couponForm, discountType: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-lg outline-none focus:border-black font-black text-[11px] uppercase tracking-widest">
                                    <option value="percentage">Relief %</option>
                                    <option value="flat">Fixed ₹</option>
                                </select>
                            </Field>
                            <Field label="Impact Value">
                                <input type="number" value={couponForm.discountValue} onChange={e => setCouponForm({...couponForm, discountValue: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-lg outline-none focus:border-black font-black text-[11px]" />
                            </Field>
                            <div className="flex items-end gap-2">
                                <button onClick={() => createMutation.mutate(couponForm)} className="flex-1 py-2.5 bg-black text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-gray-800 transition-all">Enable</button>
                                <button onClick={() => setIsCreating(false)} className="px-5 py-2.5 bg-white border border-gray-100 text-gray-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:text-black">Abort</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {isLoading ? (
                         <div className="col-span-full py-16 text-center text-gray-300 font-black text-[10px] uppercase tracking-widest italic">Synchronizing Offer Feed...</div>
                    ) : (
                        coupons?.map(coupon => (
                            <div key={coupon.id} className="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl group relative overflow-hidden transition-all hover:-translate-y-1">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-gray-50 rounded-bl-full group-hover:bg-black/5 transition-colors"></div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-black text-[10px]">₹</div>
                                    <div className="min-w-0">
                                        <p className="font-black text-black text-[12px] tracking-widest truncate">{coupon.code}</p>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Modifier Active</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xl font-black text-black tracking-tighter leading-none mb-1">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</p>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Offset Value</p>
                                    </div>
                                    <button onClick={() => deleteMutation.mutate(coupon.id)} className="px-3 py-1.5 bg-red-50 text-red-500 text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">Revoke</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const Field = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
        {children}
    </div>
);

export default Marketing;
 ```

## File: src/pages/admin/Dashboard.jsx
 ```javascript
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import analyticsService from '../../services/analyticsService';
import { formatCurrency } from '../../utils/normalizers';

// Specialized Sub-Components
import ProductList from '../../components/admin/ProductList';
import OrderList from '../../components/admin/OrderList';
import DocsManager from '../../components/admin/DocsManager';
import UserList from '../../components/admin/UserList';
import SiteConfigForm from '../../components/admin/SiteConfigForm';
import TestimonialManager from '../../components/admin/TestimonialManager';
import Marketing from './Marketing';
import ShowcaseManager from '../../components/admin/ShowcaseManager';
import LicenseManager from '../../components/admin/LicenseManager';
import SubscriptionManager from '../../components/admin/SubscriptionManager';
import AdminSearchPalette from '../../components/admin/AdminSearchPalette';
import ContactManager from '../../components/admin/ContactManager';

const Dashboard = ({ defaultTab }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isNotifyOpen, setIsNotifyOpen] = useState(false);

    // Map URL path to active tab
    const currentTab = useMemo(() => {
        if (defaultTab) return defaultTab;
        const path = location.pathname;
        if (path.includes('/admin/analytics')) return 'analytics';
        if (path.includes('/admin/inventory')) return 'inventory';
        if (path.includes('/admin/orders')) return 'orders';
        if (path.includes('/admin/licenses')) return 'licenses';
        if (path.includes('/admin/docs')) return 'docs';
        if (path.includes('/admin/marketing')) return 'marketing';
        if (path.includes('/admin/testimonials')) return 'testimonials';
        if (path.includes('/admin/showcase')) return 'showcase';
        if (path.includes('/admin/settings')) return 'settings';
        if (path.includes('/admin/config')) return 'config';
        if (path.includes('/admin/maintenance')) return 'maintenance';
        if (path.includes('/admin/users')) return 'users';
        if (path.includes('/admin/subscriptions')) return 'subscriptions';
        if (path.includes('/admin/messages')) return 'messages';
        return 'analytics';
    }, [location.pathname, defaultTab]);

    const setActiveTab = (tabId) => {
        const routes = {
            analytics: '/admin/analytics',
            inventory: '/admin/inventory',
            orders: '/admin/orders',
            licenses: '/admin/licenses',
            docs: '/admin/docs',
            users: '/admin/users',
            marketing: '/admin/marketing',
            testimonials: '/admin/testimonials',
            showcase: '/admin/showcase',
            settings: '/admin/settings',
            config: '/admin/config',
            maintenance: '/admin/maintenance',
            subscriptions: '/admin/subscriptions',
            messages: '/admin/messages'
        };
        navigate(routes[tabId] || '/admin/analytics');
    };

    // Analytics Query
    const { data: analytics } = useQuery({
        queryKey: ['admin-analytics-metrics'],
        queryFn: () => analyticsService.getAnalyticsData(),
        refetchInterval: 30000, // Sync every 30s
    });

    const stats = useMemo(() => [
        { label: 'Revenue Trend', value: formatCurrency(analytics?.revenueVelocity?.reduce((acc, curr) => acc + curr.revenue, 0) || 0), change: '7D Trend', icon: '💰' },
        { label: 'Sales Pulse', value: `${(analytics?.conversionRate || 0).toFixed(1)}%`, change: 'Current', icon: '⚡' },
        { label: 'Total Users', value: analytics?.totalUsers || 0, change: 'Lifetime', icon: '👥' },
    ], [analytics]);

    // Graph Calculation
    const graphData = useMemo(() => {
        if (!analytics?.revenueVelocity || analytics.revenueVelocity.length === 0) return "M0,80 Q50,70 100,50 T200,60 T300,30 T400,10";
        
        const points = analytics.revenueVelocity;
        const maxRev = Math.max(...points.map(p => p.revenue), 10);
        const width = 400;
        const height = 100;
        
        let pathStr = `M0,${height - (points[0].revenue / maxRev * height)}`;
        points.forEach((p, i) => {
            const x = (i / (points.length - 1)) * width;
            const y = height - (p.revenue / maxRev * height);
            pathStr += ` L${x},${y}`;
        });
        return pathStr;
    }, [analytics]);

    const menuItems = [
        { id: 'analytics', label: 'Overview', icon: '📊' },
        { id: 'inventory', label: 'Product List', icon: '⚡' },
        { id: 'orders', label: 'Sales History', icon: '💳' },
        { id: 'licenses', label: 'Licenses', icon: '🔑' },
        { id: 'marketing', label: 'Marketing', icon: '📢' },
        { id: 'config', label: 'Site Features', icon: '⚡' },
        { id: 'docs', label: 'Documentation', icon: '📚' },
        { id: 'testimonials', label: 'Reviews', icon: '⭐️' },
        { id: 'showcase', label: 'Showcase', icon: '✨' },
        { id: 'users', label: 'User Directory', icon: '👥' },
        { id: 'subscriptions', label: 'Subscribers', icon: '💎' },
        { id: 'messages', label: 'Messages', icon: '✉️' },
        { id: 'maintenance', label: 'Maintenance', icon: '🛡️' },
        { id: 'settings', label: 'General Settings', icon: '⚙️' },
    ];

    useEffect(() => {
        const handleKeys = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, []);

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-black selection:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            <AdminSearchPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            <div className="flex h-screen overflow-hidden">
                
                {/* Enterprise Sidebar - Densified */}
                <aside className="w-72 bg-[#F8F9FA] border-r border-gray-100 flex flex-col p-6">
                    <div className="space-y-8 overflow-y-auto pr-1 custom-scrollbar">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center font-black text-white text-base shadow-lg shadow-black/10">D</div>
                            <div>
                                <h1 className="text-sm font-black tracking-tighter text-black uppercase">DigitalStudio</h1>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest -mt-0.5">Control Panel</p>
                            </div>
                        </div>

                        <nav className="space-y-0.5">
                            {menuItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl font-bold text-[10px] transition-all duration-300 group relative ${
                                        currentTab === item.id 
                                        ? 'bg-white text-black shadow-lg shadow-black/5 ring-1 ring-gray-100' 
                                        : 'text-gray-500 hover:text-black hover:bg-gray-100/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-base transition-all duration-500 ${currentTab === item.id ? 'scale-110' : 'group-hover:scale-110 opacity-70 grayscale'}`}>{item.icon}</span>
                                        <span className="uppercase tracking-widest text-inherit">{item.label}</span>
                                    </div>
                                    {currentTab === item.id && (
                                        <div className="w-1 h-1 bg-black rounded-full"></div>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="pt-6 border-t border-gray-100 mt-auto space-y-4">
                        {/* Server Status Monitor */}
                        <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Metrics</p>
                            <div className="space-y-2">
                                <HealthRow label="Core API" status="online" />
                                <HealthRow label="Security" status="online" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 rounded-full bg-black border-2 border-white shadow-md flex items-center justify-center font-black text-white text-xs shrink-0">P</div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black text-black truncate leading-none mb-0.5">Administrator</p>
                                <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-widest">Master Key</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Content Area - Densified */}
                <main className="flex-1 bg-white overflow-y-auto p-6 lg:p-8 relative custom-scrollbar">
                    
                    {/* Glassmorphism Header */}
                    <div className="sticky top-0 right-0 flex justify-end items-center gap-4 z-50 py-2 bg-white/90 backdrop-blur-xl border-b border-gray-100/50 px-6 -mx-8 -mt-8 mb-8">
                         <div className="mr-6">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Environment</p>
                             <div className="flex items-center gap-2 mt-0.5">
                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                                 <span className="text-[9px] font-mono font-black text-black uppercase">Live_Node:PRD-01</span>
                             </div>
                         </div>
                         <button onClick={() => setIsSearchOpen(true)} className="flex items-center gap-3 px-5 py-2.5 bg-gray-50/50 border border-gray-100 rounded-2xl hover:bg-white transition-all group">
                             <span className="text-xs">🔍</span>
                             <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Search</span>
                             <span className="ml-4 px-2 py-0.5 bg-white border border-gray-100 rounded-lg text-[8px] font-black text-gray-300">⌘K</span>
                         </button>
                         <button onClick={() => setIsNotifyOpen(!isNotifyOpen)} className="w-10 h-10 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-center relative group hover:shadow-md transition-all">
                             <span className="text-base">🔔</span>
                             <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
                             {isNotifyOpen && (
                                 <div className="absolute top-14 right-0 w-80 bg-white border border-gray-100 rounded-3xl shadow-2xl p-6 z-[100] animate-in fade-in zoom-in-95 duration-300">
                                     <div className="flex justify-between items-center mb-6">
                                        <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Intelligent Alerts</h4>
                                        <button className="text-[8px] font-black text-primary uppercase">Purge</button>
                                     </div>
                                      <div className="space-y-4">
                                         <NotifyItem icon="📦" title="Order Alert" sub={`New pulse: ${analytics?.recentSales || 0} units`} time="Now" />
                                         <NotifyItem icon="💰" title="Capital Inflow" sub="₹4,999 Processed" time="3m" />
                                      </div>
                                 </div>
                             )}
                         </button>
                    </div>

                    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
                        {/* Summary Statistics */}
                        {currentTab === 'analytics' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {stats.map((stat, i) => (
                                    <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/50 rounded-bl-full -translate-y-4 translate-x-4"></div>
                                        <div className="relative z-10">
                                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-all shadow-inner">
                                                {stat.icon}
                                            </div>
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">{stat.label}</p>
                                            <div className="flex items-baseline gap-3 mt-2">
                                                <h3 className="text-3xl font-black text-black tracking-tighter">{stat.value}</h3>
                                                <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest">Active</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Layout Content */}
                        <div className="min-h-[400px]">
                            {currentTab === 'analytics' && <div className="space-y-8">
                                <div className="animate-in slide-in-from-bottom-6 duration-700">
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                        {/* Revenue Graph (SVG) */}
                                        <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-[450px]">
                                            <div>
                                                <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-8">Financial Pulse (7D)</h3>
                                                <div className="relative h-40 w-full group/graph mt-8">
                                                    <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                                                        <defs>
                                                            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                                                <stop offset="0%" style={{stopColor:'rgb(0,0,0)', stopOpacity:0.04}} />
                                                                <stop offset="100%" style={{stopColor:'rgb(0,0,0)', stopOpacity:0}} />
                                                            </linearGradient>
                                                        </defs>
                                                        <path d={`${graphData} V100 H0 Z`} fill="url(#grad)" />
                                                        <path d={graphData} fill="none" stroke="black" strokeWidth="2.5" />
                                                        <circle cx="400" cy="10" r="3" fill="black" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-black tracking-tighter">Synchronized Engine</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Real-time revenue monitoring active</p>
                                            </div>
                                        </div>

                                        {/* Categories Performance */}
                                        <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[450px]">
                                            <div className="flex justify-between items-center mb-8">
                                                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Segment Allocation</h3>
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            </div>
                                            <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                                                {analytics?.topCategories?.map((cat, idx) => (
                                                    <div key={idx} className="flex justify-between items-center group">
                                                        <div>
                                                            <p className="text-xs font-black text-black uppercase tracking-tight">{cat.category}</p>
                                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{cat.count} Units</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs font-black text-black">{formatCurrency(cat.revenue)}</p>
                                                            <div className="w-20 h-1 bg-gray-50 rounded-full mt-1.5 overflow-hidden border border-gray-100">
                                                                <div className="h-full bg-black transition-all duration-1000" style={{ width: `${(cat.revenue / (analytics.topCategories[0].revenue || 1) * 100)}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>}
                            {currentTab === 'inventory' && <ProductList />}
                            {currentTab === 'orders' && <OrderList />}
                            {currentTab === 'licenses' && <LicenseManager />}
                            {currentTab === 'marketing' && <Marketing />}
                            {currentTab === 'docs' && <DocsManager />}
                            {currentTab === 'users' && <UserList />}
                            {currentTab === 'testimonials' && <TestimonialManager />}
                            {currentTab === 'showcase' && <ShowcaseManager />}
                            {currentTab === 'subscriptions' && <SubscriptionManager />}
                            {currentTab === 'messages' && <ContactManager />}
                            {(currentTab === 'settings' || currentTab === 'config' || currentTab === 'maintenance') && (
                                <SiteConfigForm 
                                    initialSection={
                                        currentTab === 'config' ? 'features' : 
                                        currentTab === 'maintenance' ? 'security' : 
                                        'general'
                                    } 
                                />
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

const ActivityItem = ({ time, event, detail, code }) => (
    <div className="flex gap-6 group">
        <div className="w-px bg-gray-100 h-auto relative">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-black transition-colors"></div>
        </div>
        <div>
            <div className="flex items-center gap-3 mb-1">
                <span className="text-[9px] font-black text-black uppercase tracking-widest">{event}</span>
                <span className="text-[9px] font-black text-gray-300 font-mono tracking-tighter">[{code}]</span>
            </div>
            <p className="text-xs text-gray-500 font-bold leading-relaxed">{detail}</p>
            <p className="text-[9px] text-gray-300 font-bold uppercase mt-1 tracking-widest">{time}</p>
        </div>
    </div>
);

const NotifyItem = ({ icon, title, sub, time }) => (
    <div className="flex items-center gap-4 group cursor-pointer hover:translate-x-1 transition-all">
        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-base grayscale group-hover:grayscale-0 transition-all">{icon}</div>
        <div className="flex-1 min-w-0">
            <h5 className="text-[10px] font-black text-black uppercase tracking-wide">{title}</h5>
            <p className="text-[9px] text-gray-400 font-bold truncate">{sub}</p>
        </div>
        <span className="text-[8px] font-black text-gray-300 uppercase shrink-0">{time}</span>
    </div>
);

const HealthRow = ({ label, status, ping }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className={`w-1 h-1 rounded-full ${status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{label}</span>
        </div>
        {ping && <span className="text-[8px] font-mono font-bold text-gray-300">{ping}</span>}
    </div>
);

export default Dashboard;
 ```

## File: src/pages/admin/DocEdit.jsx
 ```javascript
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import docService from '../../services/docService';
import aiService from '../../services/aiService';
import { useToast } from '../../context/ToastContext';
import { normalizeDoc } from '../../utils/normalizers';

const DocEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { success, error } = useToast();
    const isCreateMode = !id;

    const [loading, setLoading] = useState(!isCreateMode);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        price: '0',
        section: 'General',
        content: '# Getting Started\n\nWrite your documentation here using Markdown. Use headers (H1, H2, H3) to automatically generate the **ScrollSpy** table of contents.\n\n## Example Section\nThis section will appear in the sidebar automatically.',
        isPremium: false,
        order: 0,
        // SEO Fields
        seoTitle: '',
        seoDescription: '',
    });

    const [activeTab, setActiveTab] = useState('editor'); // editor, seo, help
    const [previewMode, setPreviewMode] = useState('split'); 

    useEffect(() => {
        if (isCreateMode) {
            setLoading(false);
            return;
        }

        const fetchDoc = async () => {
            try {
                const data = await docService.getById(id);
                const doc = normalizeDoc(data);
                setFormData({
                    title: doc.title || '',
                    price: String(doc.price || 0),
                    section: doc.section || 'General',
                    content: doc.content || '',
                    isPremium: doc.isPremium || false,
                    order: doc.order || 0,
                    seoTitle: doc.seoTitle || doc.title,
                    seoDescription: doc.seoDescription || '',
                });
            } catch (err) {
                error(err.message || 'Error fetching document');
                navigate('/admin/docs');
            } finally {
                setLoading(false);
            }
        };

        fetchDoc();
    }, [id, isCreateMode, error, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleGenerateAI = async () => {
        if (!formData.title) return error('Specify an asset title first!');
        setAiGenerating(true);
        try {
            const result = await aiService.generateDescription(formData.title, 'Technical Documentation');
            setFormData(prev => ({ ...prev, content: prev.content + '\n\n' + result.description }));
            success('AI Draft Generated');
        } catch (err) {
            error('AI Service Error');
        } finally {
            setAiGenerating(false);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const payload = {
            ...formData,
            price: Number(formData.price),
            order: Number(formData.order),
        };

        try {
            if (isCreateMode) {
                await docService.create(payload);
                success('Documentation created');
            } else {
                await docService.update(id, payload);
                success('Documentation updated');
            }
            navigate('/admin/docs');
        } catch (err) {
            error(err.message || 'Failed to save document');
        }
    };

    const insertText = (before, after = '') => {
        const textarea = document.getElementById('markdown-editor');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selected = text.substring(start, end);
        const newText = text.substring(0, start) + before + selected + after + text.substring(end);
        setFormData(prev => ({ ...prev, content: newText }));
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    const tocHeaders = useMemo(() => {
        const lines = formData.content.split('\n');
        return lines
            .filter(line => line.startsWith('#'))
            .map(line => {
                const level = line.match(/^#+/)?.[0].length || 1;
                const text = line.replace(/^#+\s*/, '');
                return { level, text };
            });
    }, [formData.content]);

    if (loading) return <div className="p-20 text-center font-bold text-gray-400">Loading...</div>;

    const tabs = [
        { id: 'editor', label: 'Editor', icon: '📝' },
        { id: 'seo', label: 'SEO', icon: '🔍' },
        { id: 'help', label: 'Guide', icon: '📖' },
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans selection:bg-black selection:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Enterprise Header */}
            <header className="bg-white border-b border-gray-100 px-10 py-5 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/admin/docs')} className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-xl hover:bg-black hover:text-white transition-all group">
                        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-black tracking-tight">{isCreateMode ? 'Draft Documentation' : formData.title}</h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Document Editor</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="bg-gray-50 p-1.5 rounded-2xl border border-gray-100 flex gap-1">
                        {['split', 'editor', 'preview'].map(m => (
                            <button
                                key={m}
                                onClick={() => setPreviewMode(m)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase transition-all tracking-widest ${previewMode === m ? 'bg-white text-black shadow-sm ring-1 ring-gray-100' : 'text-gray-400 hover:text-black'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleSubmit} className="px-8 py-3.5 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-95">
                        Save Document
                    </button>
                </div>
            </header>

            <div className="flex-grow flex overflow-hidden">
                {/* Secondary Sidebar Navigation */}
                <aside className="w-20 bg-white border-r border-gray-100 flex flex-col items-center py-10 gap-8 shrink-0">
                    {tabs.map(t => (
                        <button 
                            key={t.id} 
                            onClick={() => setActiveTab(t.id)} 
                            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${activeTab === t.id ? 'bg-black text-white' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
                        >
                            <span className="text-xl">{t.icon}</span>
                            <span className="text-[7px] font-bold uppercase mt-1">{t.label}</span>
                        </button>
                    ))}
                </aside>

                <div className={`flex-grow flex overflow-hidden ${previewMode === 'split' ? 'divide-x divide-gray-100' : ''}`}>
                    
                    {/* Workspace Central */}
                    {(previewMode === 'split' || previewMode === 'editor') && (
                        <div className={`${previewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col bg-white overflow-hidden`}>
                            <div className="p-10 space-y-8 overflow-y-auto flex-grow max-w-4xl mx-auto w-full">
                                
                                {activeTab === 'editor' && (
                                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                        <div className="grid grid-cols-2 gap-8">
                                            <FormGroup label="Document Title">
                                                <input name="title" value={formData.title} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm" placeholder="e.g. Setup Guide" />
                                            </FormGroup>
                                            <FormGroup label="Category">
                                                <input name="section" value={formData.section} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm" placeholder="e.g. Technical" />
                                            </FormGroup>
                                        </div>

                                        <div className="grid grid-cols-3 gap-8 items-end border-b border-gray-50 pb-8">
                                            <FormGroup label="Price (₹)">
                                                <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm" />
                                            </FormGroup>
                                            <FormGroup label="Index Order">
                                                <input type="number" name="order" value={formData.order} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm" />
                                            </FormGroup>
                                            <div className="pb-4 flex items-center justify-end h-full">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input type="checkbox" name="isPremium" checked={formData.isPremium} onChange={handleChange} className="w-5 h-5 accent-black" />
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Premium Document</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex gap-2">
                                                    <ToolbarBtn onClick={() => insertText('## ', '')}>H2</ToolbarBtn>
                                                    <ToolbarBtn onClick={() => insertText('### ', '')}>H3</ToolbarBtn>
                                                    <div className="w-px bg-gray-100 h-6 mx-2"></div>
                                                    <ToolbarBtn onClick={() => insertText('<a id="', '"></a>')}>Anchor</ToolbarBtn>
                                                </div>
                                                <button onClick={handleGenerateAI} disabled={aiGenerating} className="px-4 py-2 bg-black text-white rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 hover:opacity-80 disabled:opacity-50">
                                                    {aiGenerating ? 'AI ASSIST...' : '✨ Magic Write'}
                                                </button>
                                            </div>
                                            <textarea
                                                id="markdown-editor"
                                                name="content"
                                                value={formData.content}
                                                onChange={handleChange}
                                                className="w-full min-h-[700px] p-10 bg-gray-50 border border-gray-100 rounded-[2.5rem] outline-none focus:bg-white focus:border-black transition-all font-mono text-sm leading-relaxed"
                                                placeholder="Write documentation here..."
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'seo' && (
                                    <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                        <div className="p-10 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                                            <h2 className="text-2xl font-bold text-black tracking-tight mb-2">Search Optimization</h2>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Metadata settings for technical guides</p>
                                        </div>
                                        <FormGroup label="SEO Page Title">
                                            <input name="seoTitle" value={formData.seoTitle} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm" />
                                        </FormGroup>
                                        <FormGroup label="Search Description">
                                            <textarea name="seoDescription" value={formData.seoDescription} onChange={handleChange} rows={6} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-medium text-sm" />
                                        </FormGroup>
                                    </div>
                                )}

                                {activeTab === 'help' && (
                                    <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                        <div className="p-10 bg-black text-white rounded-[2.5rem] shadow-xl shadow-black/10">
                                            <h2 className="text-2xl font-bold tracking-tight mb-4">Navigation Guide</h2>
                                            <p className="opacity-60 leading-relaxed font-medium">Your documentation uses an automated system to generate sidebars.</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100">
                                                <p className="text-[10px] font-bold text-black uppercase tracking-widest mb-4">Tip 01</p>
                                                <h3 className="font-bold mb-2">H2/H3 Headers</h3>
                                                <p className="text-xs text-gray-500 leading-relaxed">Headers are automatically used as section links.</p>
                                            </div>
                                            <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100">
                                                <p className="text-[10px] font-bold text-black uppercase tracking-widest mb-4">Tip 02</p>
                                                <h3 className="font-bold mb-2">Manual Anchors</h3>
                                                <p className="text-xs text-gray-500 leading-relaxed">Use the Anchor tool to insert manual section markers anywhere.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Live Preview Console */}
                    {(previewMode === 'split' || previewMode === 'preview') && (
                        <div className={`${previewMode === 'split' ? 'w-1/2' : 'w-full'} bg-[#F8F9FA] overflow-y-auto p-12 md:p-20`}>
                            <div className="max-w-3xl mx-auto flex gap-12">
                                <div className="hidden xl:block w-52 shrink-0 space-y-6">
                                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest ml-4">Section List</p>
                                    <div className="space-y-4 border-l-2 border-gray-100">
                                        {tocHeaders.map((h, i) => (
                                            <div key={i} className={`text-[10px] font-bold uppercase tracking-widest pl-4 transition-all opacity-40 hover:opacity-100 cursor-pointer ${i === 0 ? 'opacity-100 border-l-2 border-black -ml-[2px]' : ''}`} style={{ marginLeft: `${(h.level - 2) * 10}px` }}>
                                                {h.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1 bg-white p-14 md:p-20 rounded-[3rem] shadow-sm border border-gray-100 min-h-screen">
                                    <div className="mb-14 pb-14 border-b border-gray-50">
                                        <span className="px-3 py-1 bg-black text-white text-[9px] font-bold rounded-full uppercase tracking-widest">{formData.section}</span>
                                        <h1 className="text-5xl font-bold text-black tracking-tighter mt-6 leading-tight">{formData.title || 'Untitled Document'}</h1>
                                    </div>
                                    <article className="prose prose-sm max-w-none text-gray-600 font-sans leading-relaxed">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
                                            {formData.content}
                                        </ReactMarkdown>
                                    </article>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const FormGroup = ({ label, children }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2">{label}</label>
        {children}
    </div>
);

const ToolbarBtn = ({ onClick, children }) => (
    <button type="button" onClick={onClick} className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-[9px] font-bold text-gray-400 hover:text-black hover:border-black transition-all uppercase tracking-widest">
        {children}
    </button>
);

export default DocEdit;
 ```

## File: src/pages/PricingPlan.jsx
 ```javascript
import React, { useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import AuthContext from '../context/AuthContext';
import ConfigContext from '../context/ConfigContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/normalizers';

const PricingPlan = () => {
    const { config } = useContext(ConfigContext);
    const { user } = useContext(AuthContext);
    const { addToCart, clearCart } = useCart();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();

    // Feature Enforcement
    useEffect(() => {
        if (config && config.features && config.features.subscriptions === false) {
            navigate('/');
        }
    }, [config, navigate]);

    const { data: products } = useQuery({
        queryKey: ['products', 'subscription'],
        queryFn: () => productService.getAll({ type: 'subscription' }),
    });

    const proPlan = products?.find(p => p.slug === 'pro-membership');

    const handleSubscribe = () => {
        if (!user) {
            toastError('Please login to subscribe');
            navigate('/login');
            return;
        }
        if (proPlan) {
            clearCart();
            addToCart(proPlan);
            success('Membership initiated');
            navigate('/subscription-checkout', { state: { plan: proPlan } });
        }
    };

    const plans = Array.isArray(config?.memberPlans) && config.memberPlans.length > 0 ? config.memberPlans : [
        {
            name: "Standard",
            badge: "Community",
            price: 0,
            period: "forever",
            features: ["Browse Marketplace", "Access Free Docs"],
            buttonText: "Explore Assets",
            isPopular: false,
            isPrimary: false
        },
        {
            name: "Pro Membership",
            badge: "Most Popular",
            price: proPlan?.price || 29,
            period: "month",
            features: ["Unlimited Premium Documentation", "Unlimited AI Recommendations", "Early Access to Drops", "Private Slack Community", "Priority Technical Support", "ZERO Commission on Seller Sales"],
            buttonText: "Get All-Access Now",
            isPopular: true,
            isPrimary: true
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h1 className="text-5xl md:text-7xl font-black text-black mb-6 tracking-tight">Membership & <span className="text-primary">Subscriptions</span></h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium">
                        Choose the plan that's right for you. Get individual templates or unlock everything with our Pro Membership.
                    </p>
                </div>

                <div className={`grid grid-cols-1 ${plans.length === 2 ? 'md:grid-cols-2' : plans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-8 max-w-6xl mx-auto`}>
                    {plans.map((plan, index) => (
                        <div 
                            key={index} 
                            className={`${plan.isPrimary ? 'bg-black border-black shadow-2xl text-white' : 'bg-white border-gray-100 shadow-sm text-black'} rounded-[2.5rem] p-10 border flex flex-col hover:shadow-xl transition-all duration-500 relative overflow-hidden group`}
                        >
                            {plan.isPrimary && <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px]"></div>}
                            
                            <div className="mb-8 relative z-10">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full ${plan.isPrimary ? 'bg-primary text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>
                                    {plan.badge}
                                </span>
                                <h2 className={`text-3xl font-black mt-4 ${plan.isPrimary ? 'text-white' : 'text-black'}`}>{plan.name}</h2>
                            </div>

                            <div className="mb-8 flex items-baseline gap-1 relative z-10">
                                <span className="text-5xl font-black">{formatCurrency(plan.price)}</span>
                                <span className={`${plan.isPrimary ? 'text-gray-500' : 'text-gray-400'} font-bold`}>/ {plan.period}</span>
                            </div>

                            <ul className="space-y-4 mb-10 flex-1 relative z-10">
                                {(plan.features || []).map((feature, fIdx) => (
                                    <li key={fIdx} className={`flex items-center gap-3 font-medium ${plan.isPrimary ? 'text-gray-300' : 'text-gray-600'}`}>
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${plan.isPrimary ? 'bg-primary/20 text-primary' : 'bg-green-100 text-green-600'}`}>
                                            ✓
                                        </span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {plan.isPrimary ? (
                                <button 
                                    onClick={handleSubscribe}
                                    disabled={user?.subscriptionPlan === 'pro'}
                                    className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-white hover:text-black transition-all duration-300 relative z-10 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    {user?.subscriptionPlan === 'pro' ? 'Current Plan' : plan.buttonText}
                                </button>
                            ) : (
                                <Link to="/templates" className="w-full py-4 text-center bg-gray-50 text-black font-black rounded-2xl hover:bg-gray-100 transition-colors relative z-10">
                                    {plan.buttonText}
                                </Link>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-32 text-center">
                    <h3 className="text-3xl font-black text-black mb-12">Frequently Asked Questions</h3>
                    <div className="max-w-3xl mx-auto space-y-6 text-left">
                        {(config?.faqs?.slice(0, 3) || []).map((faq, idx) => (
                             <div key={idx} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                <h4 className="font-black text-black mb-2">{faq.question}</h4>
                                <p className="text-gray-500 font-medium">{faq.answer}</p>
                            </div>
                        ))}
                        {(!config?.faqs || config.faqs.length === 0) && (
                            <>
                                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                    <h4 className="font-black text-black mb-2">Can I cancel anytime?</h4>
                                    <p className="text-gray-500 font-medium">Yes, your subscription can be cancelled at any time through your account profile.</p>
                                </div>
                                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                    <h4 className="font-black text-black mb-2">Do I get template source files?</h4>
                                    <p className="text-gray-500 font-medium">Premium documentation is included. Templates still require separate licenses unless stated.</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPlan;
 ```

## File: src/pages/Features.jsx
 ```javascript
import React from 'react';
import BuildSitesHeader from '../components/BuildSitesHeader';
import FeaturesGrid from '../components/FeaturesGrid';
import { Link } from 'react-router-dom';

const Features = () => {
    return (
        <div className="bg-[#F5F5F7]">
            <BuildSitesHeader
                title="Supercharging your"
                highlight="development workflow"
                description="DigitalStudio is more than just a marketplace. We provide the tools, support, and community you need to scale from zero to production."
            />
            
            {/* Context Section: Why wait? */}
            <div className="px-6 py-12">
                <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <div className="text-3xl mb-6">🎯</div>
                        <h3 className="text-2xl font-black text-black mb-4">The Purpose</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            We bridge the gap between "buying a template" and "shipping a product." Every feature is designed to reduce your friction and increase your speed.
                        </p>
                    </div>
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <div className="text-3xl mb-6">🚀</div>
                        <h3 className="text-2xl font-black text-black mb-4">The Strategy</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            Leverage AI-driven roadmaps to choose the right stack, and follow our Pro Documentation to customize your site in minutes, not days.
                        </p>
                    </div>
                    <div className="bg-black p-10 rounded-[2.5rem] text-white shadow-2xl">
                        <div className="text-3xl mb-6">💎</div>
                        <h3 className="text-2xl font-black mb-4">The Value</h3>
                        <p className="text-gray-400 font-medium leading-relaxed mb-8">
                            Join the Pro Membership to eliminate all purchase barriers and keep 100% of your earnings when selling on our platform.
                        </p>
                        <Link to="/pricing" className="text-primary font-black hover:underline group flex items-center gap-2">
                            Explore Pro Tiers <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                    </div>
                </div>
            </div>

            <FeaturesGrid />

            {/* Call to action */}
            <div className="py-32 px-6 text-center">
                <h2 className="text-5xl md:text-7xl font-black text-black mb-8 tracking-tight">Ready to build <br/> something <span className="text-primary">epic?</span></h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Link to="/templates" className="px-10 py-5 bg-black text-white font-black rounded-2xl hover:bg-primary transition-all">
                        Browse the Marketplace
                    </Link>
                    <Link to="/pricing" className="px-10 py-5 bg-white text-black font-black border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all">
                        Compare Memberships
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Features;
 ```

## File: src/pages/Wishlist.jsx
 ```javascript
import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WishlistContext from '../context/WishlistContext';
import CartContext from '../context/CartContext';
import ConfigContext from '../context/ConfigContext';
import api from '../services/api';

const Wishlist = () => {
    const { config } = useContext(ConfigContext);
    const { wishlistItems, removeFromWishlist } = useContext(WishlistContext);
    const { addToCart } = useContext(CartContext);
    const [deals, setDeals] = useState({});
    const navigate = useNavigate();

    // Feature Enforcement
    useEffect(() => {
        if (config && config.features && config.features.wishlist === false) {
            navigate('/');
        }
    }, [config, navigate]);

    useEffect(() => {
        if (wishlistItems.length > 0) {
            const fetchDeals = async () => {
                try {
                    const reqItems = wishlistItems.map(i => ({ id: i.id, addedAt: i.addedAt }));
                    const res = await api.post('/marketing/wishlist-deals', { items: reqItems });
                    const dealMap = {};
                    res.forEach(d => {
                        dealMap[d.productId] = d;
                    });
                    setDeals(dealMap);
                } catch (err) {
                    console.error("Newsletter deal sync failed", err);
                }
            };
            fetchDeals();
        }
    }, [wishlistItems]);

    if (wishlistItems.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 bg-[#F5F5F7]">
                <h2 className="text-3xl font-bold mb-4 text-black">Your wishlist is empty</h2>
                <p className="text-gray-500 mb-8">Save items you love to revisit later.</p>
                <Link to="/templates" className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition-opacity">
                    Explore Templates
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] px-6 py-20">
            <div className="max-w-[1200px] mx-auto">
                <h1 className="text-4xl font-black text-black mb-10">Your Wishlist</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {wishlistItems.map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative group">
                            <button
                                onClick={() => removeFromWishlist(item.id)}
                                className="absolute top-4 right-4 bg-gray-100 hover:bg-red-50 p-2 rounded-full transition-colors z-10"
                                title="Remove from wishlist"
                            >
                                <svg className="w-5 h-5 text-gray-500 hover:text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>

                            <Link to={`/templates/${item.id}`} className="block">
                                <div className="aspect-w-16 aspect-h-12 mb-4 rounded-xl overflow-hidden bg-gray-100 relative">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    {deals[item.id] && (
                                        <div className="absolute bottom-4 left-4 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/20 animate-pulse z-20">
                                            {deals[item.id].reason}
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-black mb-1">{item.title}</h3>
                                <div className="flex items-center gap-3 mb-4">
                                     {deals[item.id] ? (
                                         <>
                                             <p className="text-emerald-500 font-black text-xl">₹{(item.price * 0.85).toFixed(2)}</p>
                                             <p className="text-gray-300 font-bold text-sm line-through uppercase">MRP: {item.formattedPrice}</p>
                                         </>
                                     ) : (
                                         <p className="text-primary font-bold text-lg">{item.formattedPrice}</p>
                                     )}
                                </div>
                            </Link>

                            <button
                                onClick={() => addToCart(item)}
                                className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                Add to Cart
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Wishlist;
 ```

## File: src/pages/SubscriptionCheckout.jsx
 ```javascript
import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ConfigContext from '../context/ConfigContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/normalizers';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const SubscriptionCheckout = () => {
    const { config } = useContext(ConfigContext);
    const { user } = useContext(AuthContext);
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(location.state?.plan || null);

    useEffect(() => {
        if (!user) {
            navigate('/login?redirect=subscription-checkout', { state: { plan } });
            return;
        }
        
        // If no plan in state, try to find the Pro plan from the config
        if (!plan) {
            const pro = config?.memberPlans?.find(p => p.isPrimary || p.name.toLowerCase().includes('pro'));
            if (pro) {
                setPlan(pro);
            } else {
                toastError('No subscription plan selected');
                navigate('/pricing');
            }
        }
    }, [user, plan, config, navigate, toastError]);

    const handlePayment = async () => {
        setLoading(true);
        const scriptLoaded = await loadRazorpayScript();
        
        if (!scriptLoaded) {
            toastError('Razorpay SDK failed to load');
            setLoading(false);
            return;
        }

        try {
            // We find the 'pro-membership' product in the DB for the payment
            // In a real app, you'd match the plan Name to a product ID
            const res = await api.get('/products');
            const proProduct = res.find(p => p.slug === 'pro-membership');

            if (!proProduct) {
                throw new Error('Subscription product not found in marketplace');
            }

            const orderRes = await api.post('/payments/create-order', {
                items: [{ productId: proProduct.id, quantity: 1 }]
            });

            const { orderId, amount, currency, keyId } = orderRes;

            const options = {
                key: keyId,
                amount,
                currency,
                name: "DigitalStudio Pro",
                description: `Upgrade to ${plan.name} Membership`,
                order_id: orderId,
                prefill: {
                    name: user.name,
                    email: user.email,
                },
                theme: { color: "#F59E0B" }, // Gold Theme for Pro
                handler: async function (response) {
                    try {
                        await api.post('/payments/verify', {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });
                        success('Welcome to Pro Elite! 💎');
                        navigate('/profile');
                    } catch (err) {
                        toastError('Verification failed but payment was made. Contact support.');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            toastError(err.message || 'Failed to initiate subscription');
        } finally {
            setLoading(false);
        }
    };

    if (!plan) return null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pt-32 pb-20 px-6 font-sans selection:bg-amber-100 italic:selection:bg-amber-200">
            <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                    
                    {/* Visual/Social Proof Side */}
                    <div className="lg:col-span-7 space-y-12">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-xs shadow-lg shadow-amber-500/20 text-white">💎</span>
                                <span className="text-amber-600 font-bold uppercase text-[10px] tracking-[0.4em] block">Secure Intelligence Upgrade</span>
                            </div>
                            <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.95] mb-8">
                                Refine your <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700">Production.</span>
                            </h1>
                            <p className="text-slate-500 text-xl font-medium leading-relaxed max-w-xl">
                                You're one step away from joining our exclusive circle of high-performance engineers. 
                                Unlock every document, every template, and every AI recommendation instantly.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {(plan.features || []).slice(0, 4).map((feature, i) => (
                                <div key={i} className="flex items-start gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                                        <span className="text-amber-600 text-sm">✓</span>
                                    </div>
                                    <div>
                                        <p className="text-slate-900 font-bold text-sm leading-tight">{feature}</p>
                                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1">Included</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-10 border-t border-slate-200">
                             <div className="flex items-center gap-6">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-12 h-12 rounded-full border-4 border-[#F8FAFC] bg-slate-200 overflow-hidden shadow-sm">
                                            <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <p className="text-slate-900 font-black text-sm tracking-tight">Trusted by 12,000+ Scalers</p>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Join the elite development community</p>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Checkout Card */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-[4rem] p-12 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] border border-slate-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-50/50 rounded-bl-full translate-x-12 -translate-y-12 transition-transform group-hover:scale-110"></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{plan.name}</h2>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                            Priority Access Tier
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6 mb-12 py-8 border-y border-slate-50">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subscription Period</span>
                                        <span className="text-slate-900 font-black uppercase text-xs tracking-widest">{plan.period}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-slate-900 font-black text-xs uppercase tracking-tighter">Total Due Today</p>
                                            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">Automatic Billing cycle</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-5xl font-black text-slate-900 tracking-tighter">{formatCurrency(plan.price)}</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={loading}
                                    className="w-full py-7 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[12px] tracking-[0.25em] shadow-2xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:grayscale"
                                >
                                    {loading ? 'Processing...' : 'Activate Lifetime Pro'}
                                    {!loading && <span className="text-xl">⚡</span>}
                                </button>

                                <div className="mt-10 flex flex-col items-center gap-4">
                                    <div className="flex items-center gap-4 grayscale opacity-40">
                                        <img src="https://img.icons8.com/color/48/000000/visa.png" className="h-6 object-contain" alt="Visa" />
                                        <img src="https://img.icons8.com/color/48/000000/mastercard.png" className="h-6 object-contain" alt="Mastercard" />
                                        <img src="https://img.icons8.com/color/48/000000/razorpay.png" className="h-6 object-contain" alt="Razorpay" />
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[9px] tracking-widest">
                                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm3 12H9v-2h6v2zm0-4H9V8h6v2z" />
                                        </svg>
                                        256-Bit SSL Secure Payment
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SubscriptionCheckout;
 ```

## File: src/pages/DevChat.jsx
 ```javascript
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { 
    Send, Code, Shield, Zap, Info, Loader2, User, Crown, 
    Users, Terminal, Home, Search, Hash, Settings, 
    MoreHorizontal, Paperclip, Smile, Command, Circle,
    Cpu, Activity, Globe, Lock
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const DevChat = () => {
    const { user } = useContext(AuthContext);
    const { success, error } = useToast();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [onlineCount, setOnlineCount] = useState(1);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState(null);
    const [status, setStatus] = useState('connecting');
    const [historyLoading, setHistoryLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const scrollRef = useRef(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Fetch History
        api.get('/chat/history')
            .then(data => {
                setMessages(Array.isArray(data) ? data : []);
                setHistoryLoading(false);
            })
            .catch(err => console.error('Failed to load history', err));

        // Connect WebSocket
        const token = localStorage.getItem('token');
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        
        // Target Go backend on port 8080
        const wsHost = window.location.hostname;
        const wsPort = 8080; 
        const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}/api/chat/ws?token=${token}`;
        
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setStatus('online');
            success("Intelligence Link Established");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'presence') {
                    setOnlineCount(data.count);
                } else if (data.type === 'system' && data.content.includes("Rate limit")) {
                    error(data.content);
                } else {
                    setMessages(prev => [...prev, data]);
                }
            } catch (err) {
                console.error("Message Processing Error:", err);
            }
        };

        ws.onclose = () => setStatus('offline');
        ws.onerror = () => setStatus('error');

        setSocket(ws);

        return () => ws.close();
    }, [user, navigate, success, error]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;

        socket.send(input);
        setInput('');
    };

    const formatCode = (content) => content.replace(/```/g, '');

    const filteredMessages = messages.filter(m => 
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-screen w-full bg-[#F8F9FA] flex overflow-hidden font-sans text-gray-900 border-t border-gray-100">
            
            {/* 1. ULTRA-MINIMAL LEFT TACTIC RAIL */}
            <div className="w-20 bg-white border-r border-gray-100 flex flex-col items-center py-8 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <button 
                    onClick={() => navigate('/')}
                    className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm group relative"
                >
                    <Home size={20} />
                    <span className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Exit to Dashboard</span>
                </button>

                <div className="mt-12 flex flex-col gap-6 flex-grow">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20 cursor-pointer group relative">
                        <Terminal size={20} />
                        <span className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Global Stream</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-all cursor-pointer group relative">
                        <Cpu size={20} />
                        <span className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Node Insights</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-all cursor-pointer group relative">
                        <Activity size={20} />
                        <span className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Network Pulse</span>
                    </div>
                </div>

                <div className="mt-auto flex flex-col gap-6">
                   <button className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-all cursor-pointer">
                        <Settings size={20} />
                    </button>
                    <div className="w-12 h-12 rounded-2xl border-2 border-emerald-500/30 p-1 flex items-center justify-center relative">
                        <div className="w-full h-full rounded-xl bg-blue-50 flex items-center justify-center text-[11px] font-black text-blue-600 uppercase tracking-tighter shadow-inner">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                    </div>
                </div>
            </div>

            {/* 2. CENTER STACK: FED & INPUT */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                
                {/* Tactical Workspace Header */}
                <header className="h-[5rem] border-b border-gray-100 flex items-center justify-between px-10 bg-white/95 backdrop-blur-md z-20">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <h2 className="text-[15px] font-black tracking-tight text-gray-900 uppercase">Comm_Intelligence_Stream</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${
                                    status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]' : 
                                    status === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500'
                                }`}></span>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                                    {status === 'online' ? 'Secure Protocol Active' : status === 'connecting' ? 'Establishing Handshake...' : 'Link Disconnected'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative group flex items-center">
                            <Search className="absolute left-3 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={14} />
                            <input 
                                type="text" 
                                placeholder="Sync through history..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-10 pr-4 text-[11px] font-bold focus:outline-none focus:bg-white focus:border-blue-600/20 transition-all w-48 md:w-80"
                            />
                        </div>
                        <div className="w-px h-6 bg-gray-100 mx-1"></div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/50">
                            <Globe size={14} strokeWidth={2.5} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{onlineCount} Nodes</span>
                        </div>
                    </div>
                </header>

                {/* Main Message Stream */}
                <main className="flex-1 overflow-y-auto px-10 md:px-20 py-12 space-y-12 scroll-smooth bg-[#FFFFFF]" ref={scrollRef}>
                    {historyLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-gray-50 border-t-blue-600 rounded-full animate-spin"></div>
                                <Terminal className="absolute inset-0 m-auto text-blue-600/20" size={24} />
                            </div>
                            <div className="text-center">
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em] mb-2">Syncing History</p>
                                <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest animate-pulse">Requesting shards from edge nodes...</p>
                            </div>
                        </div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-32 h-32 bg-gray-50/50 rounded-[3rem] flex items-center justify-center mb-8 border border-gray-50 animate-pulse">
                                <Search size={40} className="text-gray-200" />
                            </div>
                            <h3 className="text-lg font-black text-gray-300 uppercase tracking-widest mb-2">No Fragment Found</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">The query yielded zero intelligence logs</p>
                        </div>
                    ) : (
                        filteredMessages.map((msg, i) => {
                            const isMe = msg.userId === user?.id;
                            const isSystem = msg.type === 'system';

                            if (isSystem) return (
                                <div key={i} className="flex justify-center py-4">
                                    <div className="px-8 py-3 bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-400 rounded-2xl uppercase tracking-[0.2em] shadow-sm flex items-center gap-4">
                                        <Lock size={12} className="opacity-40" />
                                        {msg.content}
                                    </div>
                                </div>
                            );

                            return (
                                <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group animate-in slide-in-from-bottom-4 duration-500`}>
                                    <div className={`flex items-center gap-4 mb-3 px-4`}>
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${msg.isPro ? 'text-amber-500' : 'text-gray-400'}`}>
                                            {msg.userName}
                                        </span>
                                        {msg.isPro && <Crown size={14} className="text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]" />}
                                        <div className="w-1 h-1 bg-gray-100 rounded-full"></div>
                                        <span className="text-[10px] text-gray-300 font-black opacity-0 group-hover:opacity-100 transition-opacity">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className={`max-w-[85%] md:max-w-[75%] px-8 py-6 rounded-[2.5rem] text-[14px] font-medium leading-[1.7] tracking-tight transition-all ${
                                        isMe 
                                        ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/10 rounded-tr-none' 
                                        : 'bg-white text-gray-700 border border-gray-200 rounded-tl-none shadow-sm hover:border-blue-100'
                                    }`}>
                                        {msg.type === 'code' ? (
                                            <div className="bg-[#F8F9FA] p-6 rounded-2xl border border-gray-200 mt-2 mb-1 shadow-inner relative group">
                                                <div className="flex gap-2.5 mb-6 opacity-30">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/50"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50"></div>
                                                </div>
                                                <pre className="font-mono text-[13px] text-blue-900/90 whitespace-pre-wrap overflow-x-auto leading-relaxed selection:bg-blue-100 selection:text-blue-900 border-l-2 border-blue-100 pl-4">
                                                    {formatCode(msg.content)}
                                                </pre>
                                                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                    <Code size={16} className="text-gray-300 hover:text-blue-500" />
                                                </div>
                                            </div>
                                        ) : (
                                            <p dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }}></p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </main>

                {/* Fixed Master Input Controller */}
                <div className="p-8 border-t border-gray-100 bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.02)] relative z-20">
                    <form onSubmit={handleSend} className="max-w-5xl mx-auto relative group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4 text-gray-300 group-focus-within:text-blue-600 transition-all">
                             <button type="button" className="hover:scale-110 transition-transform"><Paperclip size={18} /></button>
                             <div className="w-px h-6 bg-gray-100"></div>
                             <Command size={18} />
                        </div>
                        
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message or paste code block..."
                            className="w-full bg-[#FAFBFC] border border-gray-200 rounded-[2.2rem] py-6 pl-18 pr-48 text-[14px] font-medium placeholder:text-gray-300 focus:outline-none focus:bg-white focus:border-blue-600/30 transition-all focus:shadow-2xl focus:shadow-blue-500/10 placeholder:uppercase placeholder:text-[10px] placeholder:font-black placeholder:tracking-[0.2em]"
                        />

                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
                            <button type="button" className="p-3 text-gray-300 hover:text-amber-500 transition-colors hidden sm:block"><Smile size={18} /></button>
                            <div className="flex items-center gap-3 px-5 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${user?.subscriptionPlan === 'pro' ? 'text-amber-500' : 'text-gray-400'}`}>
                                    {user?.subscriptionPlan === 'pro' ? 'Elite_Speed' : '5msg_min'}
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={!input.trim()}
                                    className="bg-gray-950 text-white w-12 h-12 rounded-[1.2rem] flex items-center justify-center hover:bg-blue-600 hover:scale-105 active:scale-95 disabled:opacity-20 transition-all shadow-xl shadow-gray-900/10"
                                >
                                    <Send size={18} strokeWidth={3} />
                                </button>
                            </div>
                        </div>

                        {/* Advanced Hints */}
                        <div className="absolute -top-12 left-8 flex items-center gap-4 opacity-0 group-focus-within:opacity-100 transition-all transform group-focus-within:translate-y-0 translate-y-2">
                             <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg">
                                 <Send size={10} strokeWidth={3} /> Shift + Enter
                             </div>
                             <span className="text-[9px] text-gray-300 font-black uppercase tracking-widest">For New Line</span>
                        </div>
                    </form>
                    <div className="mt-6 flex justify-between items-center max-w-5xl mx-auto px-6 border-t border-gray-50 pt-6">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] flex items-center gap-3">
                           🔒 SHA-256 Intelligence Hash Verified
                        </p>
                        <div className="flex items-center gap-10">
                            <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-2">
                                <Code size={13} /> Snippet Mode
                            </button>
                            <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-2">
                                <Activity size={13} /> Protocol Stats
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. CONTEXTUAL PANEL: NODES & OPS */}
            <div className="hidden xl:flex w-80 bg-white border-l border-gray-100 flex-col overflow-hidden shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="p-10 border-b border-gray-100">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-10 flex justify-between items-center">
                        Active_Pro_Nodes
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 group cursor-pointer">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[12px] font-black text-blue-600">
                                    {user?.name?.charAt(0)}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex-1">
                                <p className="text-[12px] font-black text-gray-900 tracking-tight">{user?.name} (L5)</p>
                                <p className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-widest">Online_Validated</p>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-50 opacity-40 grayscale group hover:opacity-100 hover:grayscale-0 transition-all cursor-not-allowed">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[12px] font-black text-gray-300">
                                    S
                                </div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">System_Analyzer_01</p>
                                    <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest italic">Listening...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 flex-grow overflow-y-auto">
                    <div className="p-8 rounded-[3rem] bg-gray-950 text-white shadow-2xl shadow-gray-900/10 relative overflow-hidden group border border-gray-800">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-700 animate-pulse">
                            <Crown size={48} />
                        </div>
                        <h4 className="text-xl font-black tracking-tight mb-4 leading-tight uppercase text-blue-400">Elite_Status</h4>
                        <p className="text-[10px] text-gray-400 leading-relaxed mb-10 font-bold uppercase tracking-widest">Access the full-velocity intelligence stream today.</p>
                        <button 
                            onClick={() => navigate('/pricing')}
                            className="w-full py-5 bg-white text-gray-950 text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all"
                        >
                            Elevate Now
                        </button>
                    </div>

                    <div className="mt-12 space-y-10 px-4">
                        <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6 border-b border-gray-50 pb-4">Stream_Context</h4>
                            <div className="space-y-8">
                                <div className="flex gap-5">
                                    <Zap size={16} className="text-blue-600" />
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-tighter">Throughput</p>
                                        <p className="text-[10px] text-gray-400 font-bold tracking-widest">
                                            {user?.subscriptionPlan === 'pro' ? 'UNLIMITED_BURST' : '5_MSG_PEAK'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-5">
                                    <Shield size={16} className="text-emerald-500" />
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-tighter">Security</p>
                                        <p className="text-[10px] text-emerald-600/80 font-bold tracking-widest uppercase italic">End-to-End Edge</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 mt-auto bg-[#FAFBFC] border-t border-gray-50">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.5em] flex items-center justify-center gap-3">
                        <Terminal size={12} /> Digital_Nexus_v2.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DevChat;
 ```

## File: src/pages/Cart.jsx
 ```javascript
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';
import { formatCurrency } from '../utils/normalizers';

const Cart = () => {
    const { cartItems, removeFromCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const checkoutHandler = () => {
        if (!user) {
            navigate('/login?redirect=cart');
        } else {
            navigate('/checkout');
        }
    };

    const total = cartItems.reduce((acc, item) => {
        return acc + Number(item.price || 0);
    }, 0);

    if (cartItems.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
                <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
                <Link to="/templates" className="bg-primary text-white px-6 py-3 rounded-full font-bold">
                    Browse Templates
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] px-6 py-20 font-sans">
            <div className="max-w-[1000px] mx-auto">
                <h1 className="text-4xl font-black text-black mb-10">Your Cart</h1>

                <div className="flex flex-col lg:flex-row gap-10">

                    {/* Items List */}
                    <div className="flex-grow flex flex-col gap-6">
                        {cartItems.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-6">
                                <img src={item.image} alt={item.title} className="w-24 h-24 object-cover rounded-xl bg-gray-100" />
                                <div className="flex-grow">
                                    <h3 className="text-xl font-bold text-black">{item.title}</h3>
                                    <p className="text-gray-500 text-sm">{item.category}</p>
                                    <h4 className="text-lg font-bold text-primary mt-1">{item.formattedPrice}</h4>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <svg className="w-6 h-6 text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Summary Card */}
                    <div className="w-full lg:w-[350px]">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
                            <h2 className="text-2xl font-bold mb-6">Summary</h2>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-bold">{formatCurrency(total)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-500">Tax</span>
                                <span className="font-bold">$0</span>
                            </div>
                            <div className="h-px bg-gray-100 w-full mb-6"></div>
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-xl font-bold">Total</span>
                                <span className="text-2xl font-black text-primary">{formatCurrency(total)}</span>
                            </div>
                            <button
                                onClick={checkoutHandler}
                                className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/20"
                            >
                                Checkout
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Cart;
 ```

## File: src/pages/Templates.jsx
 ```javascript
import React, { useState, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import productService from '../services/productService';
import BuildSitesHeader from '../components/BuildSitesHeader';
import TemplateGrid from '../components/TemplateGrid';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import AIRecommendationModal from '../components/ui/AIRecommendationModal';
import { FEATURES } from '../config/features';
import { normalizeProduct } from '../utils/normalizers';
import ConfigContext from '../context/ConfigContext';

const Templates = () => {
    const { config } = useContext(ConfigContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const keyword = searchParams.get('search') || '';
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedProductType, setSelectedProductType] = useState('all');
    const [showProOnly, setShowProOnly] = useState(false);
    const [sortBy, setSortBy] = useState('newest');

    const { data: rawTemplates, isLoading: loading, error: queryError, refetch } = useQuery({
        queryKey: ['templates', keyword],
        queryFn: () => productService.getAll(keyword),
    });

    const error = queryError?.message;
    const templates = Array.isArray(rawTemplates) ? rawTemplates.map(normalizeProduct) : [];

    // Client-side filtering
    const filteredTemplates = templates.filter(template => {
        if (selectedCategory !== 'all' && template.category !== selectedCategory) {
            return false;
        }
        if (selectedProductType !== 'all' && template.productType !== selectedProductType) {
            return false;
        }
        if (showProOnly && !template.requiresSubscription) {
            return false;
        }
        return true;
    });

    // Sorting
    const sortedTemplates = [...filteredTemplates].sort((a, b) => {
        switch (sortBy) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'rating':
                return (b.rating || 0) - (a.rating || 0);
            case 'popular':
                return (b.numSales || 0) - (a.numSales || 0);
            case 'newest':
            default:
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
    });

    // Get unique categories and types
    const categories = ['all', ...new Set(templates.map(t => t.category))];
    const productTypes = [
        { value: 'all', label: 'All Products' },
        { value: 'fullstack', label: 'Full-Stack Projects' },
        { value: 'api', label: 'API Collections' },
        { value: 'component', label: 'Component Libraries' },
        { value: 'mobile', label: 'Mobile Apps' },
        { value: 'template', label: 'Templates' },
        { value: 'tool', label: 'Developer Tools' }
    ];

    return (
        <>
            <BuildSitesHeader
                title="Explore our professional"
                highlight="marketplace"
                description="Production-ready code, full-stack projects, APIs, and components built for developers."
            />

            {/* Filter Bar */}
            <div className={`w-full bg-white border-b border-gray-200 sticky z-40 transition-all duration-300 ${config?.showAnnouncement && config?.announcements?.length > 0 ? 'top-[88px] md:top-[112px]' : 'top-[64px] md:top-[88px]'}`}>
                <div className="max-w-[1400px] mx-auto px-6 py-4">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        {/* Left: Filters */}
                        <div className="flex flex-wrap gap-3">
                            {/* Product Type Filter */}
                            <select
                                value={selectedProductType}
                                onChange={(e) => setSelectedProductType(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {productTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>

                            {/* Category Pills */}
                            <div className="flex gap-2 flex-wrap">
                                {categories.slice(0, 5).map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category
                                                ? 'bg-black text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {category === 'all' ? 'All' : category}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setShowProOnly(!showProOnly)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 border-2 ${showProOnly
                                            ? 'bg-amber-400 border-amber-500 text-black shadow-lg shadow-amber-500/20'
                                            : 'bg-white border-amber-100 text-amber-600 hover:bg-amber-50'
                                        }`}
                                >
                                    <span className="text-xs">💎</span>
                                    Pro Members only
                                </button>
                            </div>
                        </div>

                        {/* Right: Sort & Count */}
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500" aria-live="polite">
                                {sortedTemplates.length} {sortedTemplates.length === 1 ? 'product' : 'products'}
                            </span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="newest">Newest</option>
                                <option value="popular">Most Popular</option>
                                <option value="rating">Highest Rated</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>
                            
                            {FEATURES.ai && (
                                <button
                                    onClick={() => setIsAIModalOpen(true)}
                                    className="hidden md:flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-blue-600 hover:shadow-lg transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    Ask AI
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            {loading ? (
                <LoadingSkeleton count={6} />
            ) : error ? (
                <div className="min-h-[40vh] flex flex-col items-center justify-center p-6">
                    <div className="text-center max-w-md">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h3>
                        <p className="text-gray-500 mb-6">{error}</p>
                        <button
                            onClick={() => refetch()}
                            className="bg-primary text-white px-6 py-3 rounded-full font-bold hover:bg-blue-600 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            ) : sortedTemplates.length === 0 ? (
                <div className="min-h-[40vh] flex flex-col items-center justify-center p-6">
                    <div className="text-center max-w-md">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
                        <button
                            onClick={() => {
                                setSelectedCategory('all');
                                setSelectedProductType('all');
                                setSearchParams({});
                            }}
                            className="bg-primary text-white px-6 py-3 rounded-full font-bold hover:bg-blue-600 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mt-8 md:mt-12">
                    <TemplateGrid items={sortedTemplates} />
                </div>
            )}

            {/* AI Agent Recommendations */}
            {FEATURES.ai && (
                <AIRecommendationModal
                    isOpen={isAIModalOpen}
                    onClose={() => setIsAIModalOpen(false)}
                    selectedTechStack={selectedCategory}
                />
            )}
        </>
    );
};

export default Templates;
 ```

## File: src/pages/MaintenancePage.jsx
 ```javascript
import React from 'react';

const MaintenancePage = ({ message }) => {
    return (
        <div className="fixed inset-0 h-screen w-screen bg-white flex flex-col items-center justify-center p-6 text-center overflow-hidden selection:bg-black selection:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            {/* Soft Premium Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gray-50 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            
            <div className="relative z-10 max-w-xl w-full flex flex-col items-center">
                
                {/* Minimalist Brand Mark */}
                <div className="mb-12 group">
                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-2xl shadow-black/20 transform transition-transform group-hover:rotate-12 duration-500">
                        DS
                    </div>
                </div>

                {/* Politeness & Message */}
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">A Brief Intermission</p>
                    <h1 className="text-4xl md:text-6xl font-black text-black tracking-tighter leading-none mb-4">
                        Pardon our <span className="text-gray-300">progress.</span>
                    </h1>
                    
                    <div className="h-1 w-12 bg-black/10 rounded-full mx-auto mb-8">
                        <div className="h-full w-1/2 bg-black rounded-full animate-[loading_2s_ease-in-out_infinite]"></div>
                    </div>

                    <div className="space-y-4 px-4">
                        <p className="text-lg md:text-xl font-medium text-gray-500 leading-relaxed italic">
                            {message || "We’re currently perfecting your DigitalStudio experience. We'll be back online and ready for you very shortly."}
                        </p>
                        <p className="text-sm font-bold text-black/40 uppercase tracking-widest pt-4">
                            Thank you for your patience
                        </p>
                    </div>
                </div>

                {/* Action & Status */}
                <div className="mt-16 flex flex-col items-center gap-8 animate-in fade-in duration-1000 delay-500">
                    <button 
                        onClick={() => window.location.reload()}
                        className="group flex items-center gap-4 px-10 py-5 bg-black text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-primary transition-all shadow-2xl shadow-black/10 hover:-translate-y-1 active:translate-y-0"
                    >
                        Check Status
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse group-hover:bg-white"></span>
                    </button>
                    
                    <div className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.3em]">
                        DigitalStudio &copy; {new Date().getFullYear()} — Engineering Excellence
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}} />
        </div>
    );
};

export default MaintenancePage;
 ```

## File: src/pages/Checkout.jsx
 ```javascript
import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfigContext from '../context/ConfigContext';
import { formatCurrency } from '../utils/normalizers';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const Checkout = () => {
    const { config } = useContext(ConfigContext);
    const { cartItems, clearCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const { success, error } = useToast();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login?redirect=checkout');
        }
        if (cartItems.length === 0) {
            navigate('/cart');
        }
        if (config && config.features && config.features.payments === false) {
            error('Payments are currently unavailable.');
            navigate('/cart');
        }
    }, [cartItems, config, error, navigate, user]);

    const subtotal = cartItems.reduce((acc, item) => {
        return acc + Number(item.price || 0);
    }, 0);

    const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
    const total = Math.max(0, subtotal - discountAmount);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setValidatingCoupon(true);
        try {
            // Passing subtotal as totalAmount context for validation
            const res = await api.get(`/marketing/validate?code=${couponCode}&totalAmount=${subtotal}`);
            setAppliedCoupon(res);
            success(`Coupon '${res.code}' applied! You saved ${formatCurrency(res.discount)}`);
        } catch (err) {
            error(err.message || 'Invalid or expired coupon code.');
            setAppliedCoupon(null);
        } finally {
            setValidatingCoupon(false);
        }
    };

    const submitHandler = async () => {
        setLoading(true);

        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
            error("Razorpay SDK failed to load. Are you online?");
            setLoading(false);
            return;
        }

        const items = cartItems.map(item => ({
            productId: Number(item.id),
            quantity: 1,
        }));

        try {
            // Create Order on Backend with Coupon Code if applied
            const res = await api.post('/payments/create-order', { 
                items,
                couponCode: appliedCoupon?.code
            });
            const { orderId, amount, currency, keyId } = res;

            const options = {
                key: keyId,
                amount: amount,
                currency: currency,
                name: "DigitalStudio",
                description: "Digital Template Purchase",
                order_id: orderId,
                prefill: {
                    name: user.name || "Customer",
                    email: user.email,
                },
                theme: { color: "#000000" },
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/payments/verify', {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });
                        if (verifyRes.paymentStatus === 'paid' || verifyRes.status === 'captured' || verifyRes.entitled) {
                            success('Payment verified successfully! 🎉');
                            clearCart();
                            navigate('/profile');
                        }
                    } catch (err) {
                        console.error(err);
                        error(err.message || 'Payment Verification failed.');
                    }
                }
            };
            
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (_response){
                error("Payment processing failed. Try again.");
            });
            
            rzp.open();

        } catch (err) {
            console.error(err);
            error(err.message || 'Failed to initialize payment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] px-6 py-20 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-2">Final Step</p>
                        <h1 className="text-5xl font-black text-black tracking-tight">Checkout Overview</h1>
                    </div>
                    <div className="flex items-center gap-4 text-emerald-500 font-bold text-xs uppercase tracking-widest bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        Secure Checkout Active
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left Column: Review Summary */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-8 flex items-center gap-4">
                                <span className="w-10 h-10 bg-black text-white rounded-2xl flex items-center justify-center text-xs">01</span>
                                Selected Items
                            </h2>
                            <div className="space-y-6">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex items-center gap-6 rounded-3xl border border-gray-50 p-6 bg-gray-50/30 transition-all hover:bg-gray-50">
                                        <div className="w-24 h-24 rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex-shrink-0">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-black text-lg truncate">{item.title}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{item.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-black text-xl">{item.formattedPrice}</p>
                                            <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Lifetime Access</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Coupon Interface */}
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 animate-in slide-in-from-bottom-5 duration-500">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-4">
                                <span className="w-10 h-10 bg-gray-50 text-black border border-gray-100 rounded-2xl flex items-center justify-center text-xs">02</span>
                                Discount Coupon
                            </h2>
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <input 
                                        type="text" 
                                        placeholder="Enter Coupon Code..." 
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm tracking-widest placeholder:text-gray-300 transition-all"
                                    />
                                    {appliedCoupon && <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500 uppercase">Applied ✓</span>}
                                </div>
                                <button 
                                    onClick={handleApplyCoupon}
                                    disabled={validatingCoupon || !couponCode}
                                    className="px-10 py-5 bg-black text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-black/10 hover:bg-gray-800 disabled:opacity-30 disabled:grayscale transition-all"
                                >
                                    {validatingCoupon ? 'Validating...' : 'Apply Code'}
                                </button>
                            </div>
                            {appliedCoupon && (
                                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex justify-between items-center animate-in fade-in duration-300">
                                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Coupon Applied: {appliedCoupon.code}</p>
                                    <button onClick={() => setAppliedCoupon(null)} className="text-[10px] font-black text-emerald-700 hover:text-red-500 transition-colors">REMOVE</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-4">
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 sticky top-24 overflow-hidden relative">
                            {/* Visual Polish */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 rounded-bl-full -translate-y-4 translate-x-4"></div>
                            
                            <h2 className="text-xl font-bold mb-8 relative z-10">Value Summary</h2>
                            
                            <div className="space-y-6 mb-10 border-b border-gray-50 pb-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subtotal</span>
                                    <span className="font-bold text-black">{formatCurrency(subtotal)}</span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between items-center animate-in slide-in-from-right-4 duration-300">
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Discount</span>
                                        <span className="font-bold text-emerald-500">- {formatCurrency(discountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                                    <span className="text-sm font-black text-black uppercase tracking-tighter">Final Total</span>
                                    <span className="text-3xl font-black text-black tracking-tighter">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <button
                                onClick={submitHandler}
                                disabled={loading}
                                className={`w-full bg-black text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed grayscale' : ''}`}
                            >
                                {loading ? 'Processing...' : 'Confirm Payment'}
                                {!loading && <span className="text-lg">→</span>}
                            </button>
                            
                            <div className="mt-8 space-y-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">End-to-End Encrypted</span>
                                </div>
                                <p className="text-[9px] text-gray-400 text-center leading-relaxed">
                                    By proceeding, you agree to the license terms. Downloads are instantly unlocked upon payment.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Checkout;
 ```

## File: src/pages/DocViewer.jsx
 ```javascript
import { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import docService from '../services/docService';
import { normalizeDoc } from '../utils/normalizers';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Sparkles, Sun, Moon, Database, Download, Send, X, Terminal, FileText } from 'lucide-react';
import aiService from '../services/aiService';

const DocViewer = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const { info } = useToast();
    const navigate = useNavigate();
    
    const { data: rawDoc, isLoading: loading } = useQuery({
        queryKey: ['doc', id],
        queryFn: () => docService.getById(id),
    });

    const doc = rawDoc ? normalizeDoc(rawDoc) : null;

    const [readingProgress, setReadingProgress] = useState(0);
    const [activeId, setActiveId] = useState('');
    const [theme, setTheme] = useState('light'); // light, dark, midnight
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatId, setChatId] = useState(`chat_${Math.random().toString(36).substring(7)}_${Date.now()}`);
    const [copySuccess, setCopySuccess] = useState(null);

    // Auto-generate TOC from content if not provided or to ensure it matches slugs
    const autoToc = useMemo(() => {
        if (!doc?.content) return [];
        const lines = doc.content.split('\n');
        const headers = [];
        lines.forEach(line => {
            const match = line.match(/^(#{1,3})\s+(.+)$/);
            if (match) {
                const level = match[1].length;
                const title = match[2].trim();
                // Simple slugify matching rehype-slug
                const slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                headers.push({ id: slug, title, level });
            }
        });
        return headers;
    }, [doc?.content]);

    const toc = useMemo(() => {
        return (doc?.tableOfContents && doc.tableOfContents.length > 0) ? doc.tableOfContents : autoToc;
    }, [doc?.tableOfContents, autoToc]);

    const handleScroll = useCallback(() => {
        if (typeof document === 'undefined') return;
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        setReadingProgress(progress);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Intersection Observer for ScrollSpy
    useEffect(() => {
        if (!toc.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '-10% 0px -70% 0px', threshold: 0 }
        );

        const headingElements = toc.map(item => document.getElementById(item.id)).filter(Boolean);
        headingElements.forEach(el => observer.observe(el));

        return () => {
            headingElements.forEach(el => observer.unobserve(el));
        };
    }, [toc, loading]);

    const handleProtectedAccess = () => {
        if (!user) {
            info('Please login to access protected docs.');
            navigate('/login');
            return;
        }
        navigate('/pricing');
    };

    const toggleTheme = () => {
        const themes = ['light', 'dark', 'midnight'];
        const next = themes[(themes.indexOf(theme) + 1) % themes.length];
        setTheme(next);
    };

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        setCopySuccess(code);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || isChatLoading) return;

        const userMsg = { role: 'user', content: chatInput };
        const aiMsgPlaceHolder = { role: 'ai', content: '' };
        
        setChatHistory(prev => [...prev, userMsg, aiMsgPlaceHolder]);
        const currentMsgIndex = chatHistory.length + 1; // Index of the AI message we just added
        
        setChatInput('');
        setIsChatLoading(true);

        try {
            const response = await aiService.askDocAIStream(doc.content, chatInput, chatId);
            
            if (!response.ok) throw new Error('Network response was not ok');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                // SSE format is "data: content\n\n"
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const content = line.replace('data: ', '');
                        fullContent += content;
                        
                        // Update the last message in history
                        setChatHistory(prev => {
                            const newHistory = [...prev];
                            newHistory[newHistory.length - 1] = { role: 'ai', content: fullContent };
                            return newHistory;
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Chat Stream Error:", err);
            setChatHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1] = { 
                    role: 'ai', 
                    content: "I'm sorry, I'm having trouble connecting to my matrix right now. Please try again later." 
                };
                return newHistory;
            });
        } finally {
            setIsChatLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const themeConfig = {
        light: {
            bg: 'bg-[#F5F5F7]',
            card: 'bg-white',
            text: 'text-gray-600',
            heading: 'text-black',
            sidebar: 'bg-white',
            border: 'border-gray-100'
        },
        dark: {
            bg: 'bg-[#0F172A]',
            card: 'bg-[#1E293B]',
            text: 'text-slate-400',
            heading: 'text-slate-100',
            sidebar: 'bg-[#1E293B]',
            border: 'border-slate-800'
        },
        midnight: {
            bg: 'bg-[#000000]',
            card: 'bg-[#0A0A0A]',
            text: 'text-gray-400',
            heading: 'text-gray-100',
            sidebar: 'bg-[#0A0A0A]',
            border: 'border-white/5'
        }
    };

    const currentTheme = themeConfig[theme];

    const CodeBlock = ({ children, inline, ...props }) => {
        const code = String(children).replace(/\n$/, '');
        if (inline) {
            return <code className={`bg-gray-100 px-2 py-0.5 rounded-md text-primary font-black text-sm`} {...props}>{children}</code>;
        }

        return (
            <div className="relative group/code my-10 overflow-hidden rounded-[1.5rem] border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 bg-[#1C1C1E] border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-gray-500" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Technical Snippet</span>
                    </div>
                    <button 
                        onClick={() => handleCopy(code)}
                        className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-lg"
                    >
                        {copySuccess === code ? <span className="text-[10px] font-black text-green-400 uppercase tracking-widest px-2">Copied!</span> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
                <pre className="bg-[#1C1C1E] text-gray-300 p-8 overflow-x-auto font-mono text-sm leading-relaxed" {...props}>
                    {children}
                </pre>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!doc) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7]">
                <h2 className="text-3xl font-bold mb-4">Doc not found</h2>
                <Link to="/docs" className="text-blue-600 underline">Back to docs</Link>
            </div>
        );
    }

    const scrollToSection = (e, sectionId) => {
        e.preventDefault();
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 120;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            window.history.pushState(null, null, `#${sectionId}`);
            setActiveId(sectionId);
        }
    };

    const hasToc = toc.length > 0;
    const showLockCta = doc.isPremium && doc.locked && user?.subscriptionPlan !== 'pro';

    return (
        <div className={`min-h-screen ${currentTheme.bg} py-24 md:py-32 font-sans relative transition-colors duration-700`}>
            {/* Reading Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-gray-100/10">
                <div 
                    className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    style={{ width: `${readingProgress}%` }}
                ></div>
            </div>

            {/* Floating Action Menu */}
            <div className="fixed bottom-12 right-12 z-50 flex flex-col gap-4">
                <AnimatePresence>
                    {isAiOpen && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="absolute bottom-20 right-0 w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col pointer-events-auto"
                        >
                            <div className="p-6 bg-primary text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-6 h-6" />
                                    <h3 className="font-black uppercase text-xs tracking-widest">Doc Assistant</h3>
                                </div>
                                <button onClick={() => setIsAiOpen(false)} className="hover:opacity-70">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 text-sm font-medium text-gray-600">
                                    Hello! I'm your AI sidekick for DigitalStudio. Ask me anything about <span className="text-primary font-black">"{doc.title}"</span>.
                                </div>
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                                            msg.role === 'user' 
                                            ? 'bg-primary text-white font-bold' 
                                            : 'bg-white border border-gray-100 text-gray-600 font-medium'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isChatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-gray-100 p-4 rounded-2xl flex gap-2">
                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <form onSubmit={handleChatSubmit} className="p-6 bg-white border-t border-gray-100 flex gap-3">
                                <input 
                                    type="text" 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Type your question..."
                                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                <button type="submit" className="bg-primary text-white p-3 rounded-xl hover:scale-105 transition-all shadow-lg shadow-primary/20">
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-col gap-3">
                    {user?.subscriptionPlan === 'pro' && (
                        <button 
                            onClick={handlePrint}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl border bg-white border-gray-100 text-gray-600 hover:bg-gray-50`}
                            title="Export to PDF"
                        >
                            <Download className="w-6 h-6" />
                        </button>
                    )}
                    <button 
                        onClick={toggleTheme}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl border ${theme === 'midnight' ? 'bg-amber-400 text-black border-amber-300' : theme === 'dark' ? 'bg-white/10 text-white border-white/10' : 'bg-slate-900 text-white border-slate-800'}`}
                        title="Change Theme"
                    >
                        {theme === 'light' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                    </button>
                    <button 
                        onClick={() => setIsAiOpen(!isAiOpen)}
                        className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <Sparkles className="w-8 h-8 relative z-10" />
                    </button>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                <div className="max-w-4xl mb-12">
                    <Link to="/docs" className="text-primary font-black text-xs uppercase tracking-widest hover:opacity-70 mb-6 inline-flex items-center gap-2">
                        <Terminal className="w-4 h-4" />
                        Technical Manuals
                    </Link>
                    <h1 className={`text-4xl md:text-6xl font-black ${currentTheme.heading} mb-6 tracking-tight leading-tight`}>{doc.title}</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        {doc.category && (
                            <span className={`${currentTheme.card} border ${currentTheme.border} ${currentTheme.heading} px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm`}>
                                {doc.category}
                            </span>
                        )}
                        {doc.isPremium && (
                            <div className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${doc.locked
                                ? 'bg-black text-white'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                {doc.locked ? '🔒 Pro Membership' : '✅ Verified Access'}
                            </div>
                        )}
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">EST READ: {Math.ceil(doc.content?.length / 1000) || 1} MIN</span>
                    </div>
                </div>

                <div className={`flex flex-col ${hasToc ? 'lg:flex-row' : ''} gap-12`}>
                    {hasToc && (
                        <aside className="lg:w-72 shrink-0">
                            <div className={`sticky top-40 ${currentTheme.sidebar} border ${currentTheme.border} p-8 rounded-[2.5rem] shadow-sm transition-colors duration-700`}>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Navigation Guide</h3>
                                <nav className="space-y-4">
                                    {toc.map((item) => (
                                        <div key={item.id} className="relative group">
                                            <a 
                                                href={`#${item.id}`} 
                                                onClick={(e) => scrollToSection(e, item.id)}
                                                className={`text-sm font-black transition-all duration-300 block py-1 pl-4 border-l-2 ${
                                                    activeId === item.id 
                                                    ? 'text-primary border-primary translate-x-1' 
                                                    : `${currentTheme.text} ${currentTheme.border} hover:text-primary hover:border-gray-300`
                                                }`}
                                                style={{ paddingLeft: `${(item.level || 1) * 0.5 + 0.5}rem` }}
                                            >
                                                {item.title}
                                            </a>
                                            {activeId === item.id && (
                                                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,1)]"></div>
                                            )}
                                        </div>
                                    ))}
                                </nav>
                                <div className="mt-10 pt-10 border-t border-gray-50/10">
                                    <button 
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                        className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                                        Back to Top
                                    </button>
                                </div>
                            </div>
                        </aside>
                    )}

                    <div className="flex-grow min-w-0">
                        <div className={`${currentTheme.card} rounded-[3rem] p-8 md:p-16 lg:p-20 border ${currentTheme.border} shadow-xl shadow-gray-200/10 relative overflow-hidden transition-colors duration-700`}>
                            <article className={`markdown-content prose prose-zinc max-w-none transition-all duration-700 ${showLockCta ? 'max-h-[500px] overflow-hidden mask-blur-bottom' : ''}`}>
                                <style>{`
                                    .mask-blur-bottom {
                                        mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
                                        -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
                                    }
                                `}</style>
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeSlug]}
                                    components={{
                                        h1: ({node, ...props}) => <h1 className={`text-4xl font-black ${currentTheme.heading} mb-8 mt-12 first:mt-0 tracking-tight`} {...props} />,
                                        h2: ({node, ...props}) => <h2 className={`text-2xl font-black ${currentTheme.heading} mb-6 mt-12 border-b border-gray-100/10 pb-4 tracking-tight`} {...props} />,
                                        h3: ({node, ...props}) => <h3 className={`text-xl font-black ${currentTheme.heading} mb-4 mt-10 tracking-tight`} {...props} />,
                                        p: ({node, ...props}) => <p className={`${currentTheme.text} leading-relaxed mb-6 font-medium text-lg`} {...props} />,
                                        ul: ({node, ...props}) => <ul className={`space-y-3 mb-8 ml-6 list-disc ${currentTheme.text}`} {...props} />,
                                        ol: ({node, ...props}) => <ol className={`space-y-3 mb-8 ml-6 list-decimal ${currentTheme.text}`} {...props} />,
                                        li: ({node, ...props}) => <li className="pl-2 font-medium" {...props} />,
                                        code: CodeBlock
                                    }}
                                >
                                    {doc.content}
                                </ReactMarkdown>
                            </article>

                            {showLockCta && (
                                <div className="mt-20 p-12 bg-black rounded-[3rem] text-white text-center relative overflow-hidden group border border-white/10 shadow-2xl">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary opacity-20 blur-[130px] -translate-y-1/2 translate-x-1/2 group-hover:opacity-30 transition-opacity"></div>
                                    <div className="relative z-10">
                                        <div className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-white/10">
                                            <Database className="w-10 h-10 text-primary" />
                                        </div>
                                        <h3 className="text-4xl font-black mb-6 tracking-tight">Access Pro Technical Documentation</h3>
                                        <p className="text-xl mb-10 text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
                                            This guide is reserved for our Pro community members. Unlock this guide and hundreds of others, plus premium templates and exclusive Discord access.
                                        </p>
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                            <button
                                                onClick={handleProtectedAccess}
                                                className="w-full sm:w-auto bg-primary text-white px-12 py-5 rounded-2xl font-black hover:bg-white hover:text-black transition-all duration-500 shadow-2xl shadow-primary/30 active:scale-95"
                                            >
                                                Start Pro Trial
                                            </button>
                                            <Link
                                                to="/pricing"
                                                className="w-full sm:w-auto text-gray-400 hover:text-white font-black text-sm uppercase tracking-widest transition-colors flex items-center gap-2 group/btn"
                                            >
                                                Membership Plans 
                                                <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .fixed, aside, footer, nav, button { display: none !important; }
                    .max-w-[1400px] { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
                    .py-24 { padding-top: 0 !important; }
                    .rounded-[3rem] { border-radius: 0 !important; border: none !important; box-shadow: none !important; }
                    .bg-[#F5F5F7], .bg-[#0F172A], .bg-[#000000] { background: white !important; }
                    .text-slate-400, .text-gray-400 { color: #374151 !important; }
                    .text-slate-100, .text-gray-100 { color: black !important; }
                    pre { background: #f3f4f6 !important; color: black !important; border: 1px solid #e5e7eb !important; }
                }
            `}} />
        </div>
    );
};

export default DocViewer;
 ```

## File: src/pages/Contact.jsx
 ```javascript
import React from 'react';
import ContactSection from '../components/ContactSection';

const Contact = () => {
    return (
        <div className="pt-20">
            <ContactSection />
        </div>
    );
};

export default Contact;
 ```

## File: src/pages/Home.jsx
 ```javascript
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import HeroSection from '../components/HeroSection';
import FeaturedHeader from '../components/FeaturedHeader';
import TemplateGrid from '../components/TemplateGrid';
import BrowseTemplatesCTA from '../components/BrowseTemplatesCTA';
import ResponsiveShowcase from '../components/ResponsiveShowcase';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import FAQSection from '../components/FAQSection';
import ProBanner from '../components/ProBanner';
import productService from '../services/productService';
import { normalizeProduct } from '../utils/normalizers';

const Home = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['products', 'featured-home'],
        queryFn: () => productService.getAll({ featured: true, limit: 3 }),
    });

    const featuredProducts = useMemo(
        () => (Array.isArray(data) ? data.map(normalizeProduct) : []),
        [data],
    );

    return (
        <>
            <HeroSection />
            <FeaturedHeader />
            {isLoading ? (
                <LoadingSkeleton count={3} />
            ) : error ? (
                <div className="w-full bg-[#F5F5F7] px-6 pb-20">
                    <div className="max-w-[1400px] mx-auto rounded-3xl border border-red-100 bg-red-50 px-6 py-8 text-red-600">
                        Failed to load featured products. Please try again in a moment.
                    </div>
                </div>
            ) : (
                <TemplateGrid items={featuredProducts} limit={3} />
            )}
            <ProBanner />
            <BrowseTemplatesCTA />
            <FAQSection />
            <ResponsiveShowcase products={featuredProducts} />
        </>
    );
};

export default Home;
 ```

## File: src/pages/TemplatesDetails.jsx
 ```javascript
import React, { useContext, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ProductHeader from '../components/ProductHeader';
import TemplateCarousel from '../components/TemplateCarousel';
import TemplateDetails from '../components/TemplateDetails';
import TemplateGrid from '../components/TemplateGrid';
import ProductReviews from '../components/ProductReviews';
import productService from '../services/productService';
import { normalizeProduct } from '../utils/normalizers';
import ConfigContext from '../context/ConfigContext';

const TemplatesDetails = () => {
    const { id } = useParams();
    const { config } = useContext(ConfigContext);
    const reviewsEnabled = config?.features?.reviews !== false;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    const { data, isLoading, error } = useQuery({
        queryKey: ['product', id],
        queryFn: () => productService.getById(id),
        enabled: Boolean(id),
    });

    const product = data ? normalizeProduct(data) : null;

    const { data: relatedProducts } = useQuery({
        queryKey: ['related-products', product?.category],
        queryFn: () => productService.getAll({ category: product?.category, limit: 4 }),
        enabled: Boolean(product?.category),
    });

    // Filter out the current product from related list
    const filteredRelated = (relatedProducts || [])
        .filter(p => p.id !== product?.id)
        .slice(0, 3);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">Loading...</div>;
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7] px-6 text-center">
                <h2 className="text-3xl font-bold mb-4">Product unavailable</h2>
                <p className="text-gray-500 mb-6 max-w-lg">
                    We could not load this product from the live API.
                </p>
                <Link to="/templates" className="text-primary font-bold underline">Back to templates</Link>
            </div>
        );
    }

    return (
        <div className="bg-[#F8FAFC]">
            <ProductHeader product={product} />
            <TemplateCarousel product={product} />
            <TemplateDetails product={product} />
            
            {reviewsEnabled && <ProductReviews productId={product.id} />}

            {/* Related Designs Section */}
            {filteredRelated.length > 0 && (
                <div className="py-24 px-6 border-t border-slate-100 bg-white">
                    <div className="max-w-[1400px] mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                            <div className="flex flex-col gap-4 text-left">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">More for You</span>
                                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Related <span className="text-primary">Designs</span></h2>
                            </div>
                            <Link to="/templates" className="bg-slate-50 text-slate-900 px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all border border-slate-100 mb-2">
                                View All Products
                            </Link>
                        </div>
                        
                        <div className="grid grid-cols-1">
                            <TemplateGrid items={filteredRelated} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplatesDetails;
 ```

## File: src/services/userService.js
 ```javascript
import api from './api';

const userService = {
    getAll: () => api.get('/users'),
    adminList: () => api.get('/admin/users'),
    update: (id, data) => api.patch(`/users/${id}`, data),
    resetPassword: (id, password) => api.post(`/users/${id}/reset-password`, { password }),
};

export default userService;
 ```

## File: src/services/configService.js
 ```javascript
import api from './api';

const configService = {
    getPublic: () => api.get('/config'),
    getAdmin: () => api.get('/config/admin'),
    update: (data) => api.put('/config', data),
};

export default configService;
 ```

## File: src/services/productService.js
 ```javascript
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
 ```

## File: src/services/aiService.js
 ```javascript
import api from './api';

const aiService = {
    generateDescription: (title, techStack) => 
        api.post('/ai/generate-description', { title, techStack }),
    
    suggestTags: (title, content) => 
        api.post('/ai/suggest-tags', { title, content }),
    
    recommendPricing: (category, features) => 
        api.post('/ai/recommend-pricing', { category, features }),
    
    askDocAI: (markdown, question) =>
        api.post('/ai/chat', { markdown, question }),

    askDocAIStream: async (markdown, question, conversationId) => {
        const token = localStorage.getItem('token');
        return fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ markdown, question, conversationId })
        });
    },
    
    getUserRoadmap: (wishlistIds) =>
        api.post('/ai/roadmap', { wishlistIds })
};

export default aiService;
 ```

## File: src/services/marketingService.js
 ```javascript
import api from './api';

const marketingService = {
    getCoupons: () => api.get('/admin/marketing/coupons'),
    createCoupon: (data) => api.post('/admin/marketing/coupons', data),
    deleteCoupon: (id) => api.delete(`/admin/marketing/coupons/${id}`),
    
    getSEOData: (type, id) => api.get(`/marketing/seo/${type}/${id}`),
    updateSEOData: (type, id, data) => api.put(`/marketing/seo/${type}/${id}`, data),
};

export default marketingService;
 ```

## File: src/services/testimonialService.js
 ```javascript
import api from './api';

const testimonialService = {
    getApproved: () => api.get('/testimonials'),
    create: (data) => api.post('/testimonials', data),
    
    // Admin methods
    adminList: (status = 'all') => api.get(`/admin/testimonials/${status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''}`),
    approve: (id) => api.patch(`/admin/testimonials/${id}/approve`, {}),
    reject: (id) => api.patch(`/admin/testimonials/${id}/reject`, {}),
    delete: (id) => api.delete(`/admin/testimonials/${id}`),
};

export default testimonialService;
 ```

## File: src/services/orderService.js
 ```javascript
import api from './api';

const orderService = {
    create: (orderData) => api.post('/orders', orderData),
    getMyOrders: () => api.get('/orders/myorders'),
    adminList: (status = 'all') => api.get(`/admin/orders${status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''}`),
    adminGetById: (id) => api.get(`/admin/orders/${id}`),
    adminUpdate: (id, data) => api.patch(`/admin/orders/${id}`, data),
};

export default orderService;
 ```

## File: src/services/authService.js
 ```javascript
import api from './api';

const authService = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (name, email, password, referrerCode) => api.post('/auth/register', { name, email, password, referrerCode }),
    getMe: () => api.get('/auth/me'),
};

export default authService;
 ```

## File: src/services/api.js
 ```javascript
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
 ```

## File: src/services/docService.js
 ```javascript
import api from './api';

const docService = {
    getAll: (category = '', search = '') => {
        let url = '/docs?';
        if (category) url += `category=${encodeURIComponent(category)}&`;
        if (search) url += `search=${encodeURIComponent(search)}`;
        return api.get(url);
    },
    getById: (id) => api.get(`/docs/${id}`),
    create: (data) => api.post('/docs', data),
    update: (id, data) => api.put(`/docs/${id}`, data),
    delete: (id) => api.delete(`/docs/${id}`),
};

export default docService;
 ```

## File: src/services/analyticsService.js
 ```javascript
import api from './api';

const analyticsService = {
    getSales: () => api.get('/analytics/sales'),
    getTopProducts: () => api.get('/analytics/top-products'),
    getIntelligenceMetrics: () => api.get('/admin/intelligence/metrics'),
};

export default analyticsService;
 ```

## File: src/services/licenseService.js
 ```javascript
import api from './api';

const licenseService = {
    getMyLicenses: () => api.get('/licenses/my'),
    validate: (data) => api.post('/licenses/validate', data),
    adminIssue: (orderId) => api.post('/admin/licenses/issue', { orderId }),
};

export default licenseService;
 ```

## File: src/services/reviewService.js
 ```javascript
import api from './api';

const reviewService = {
    adminList: (status = 'all') => api.get(`/admin/reviews${status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''}`),
    update: (id, data) => api.patch(`/admin/reviews/${id}`, data),
    delete: (id) => api.delete(`/admin/reviews/${id}`),
};

export default reviewService;
 ```

