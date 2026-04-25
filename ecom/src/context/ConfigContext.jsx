import React, { createContext, useState, useEffect } from 'react';
import configService from '../services/configService';
import { normalizeSiteConfig } from '../utils/normalizers';

import { useQuery } from '@tanstack/react-query';

const ConfigContext = createContext();

const DEFAULT_CONFIG = {
    heroTitle: 'Build faster with products for developers',
    announcements: [],
    showAnnouncement: false,
    supportEmail: '',
    features: {
        docs: true,
        reviews: true,
        analytics: true,
        ai: true,
        payments: true,
        subscriptions: true,
        licenses: true,
        testimonials: true,
        profiles: true,
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
};

export const ConfigProvider = ({ children }) => {
    const { data: rawConfig, isLoading: loading, refetch: fetchConfig } = useQuery({
        queryKey: ['site-config'],
        queryFn: () => configService.getPublic(),
        staleTime: 1000 * 60 * 60, // 1 hour - config doesn't change often
    });

    const config = React.useMemo(() => {
        if (!rawConfig) return DEFAULT_CONFIG;
        return normalizeSiteConfig(rawConfig);
    }, [rawConfig]);

    const value = React.useMemo(
        () => ({
            config,
            loading,
            fetchConfig,
        }),
        [config, loading, fetchConfig],
    );

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
};

export default ConfigContext;
