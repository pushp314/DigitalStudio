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
