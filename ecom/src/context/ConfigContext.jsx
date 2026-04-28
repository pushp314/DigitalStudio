import React, { createContext, useState, useEffect } from 'react';
import configService from '../services/configService';
import { normalizeSiteConfig } from '../utils/normalizers';

import { useQuery, useQueryClient } from '@tanstack/react-query';

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
    navbar: {
        links: [
            { label: 'Explore Assets', href: '/assets', type: 'dropdown', key: 'explore', isMega: true },
            { label: 'Resources', href: '#', type: 'dropdown', key: 'resources', isMega: true },
            { label: 'Services', href: '#', type: 'dropdown', key: 'services' },
            { label: 'Pricing', href: '/pricing', type: 'link' },
            { label: 'Sell Project', href: '/sell-your-project', type: 'link' },
        ]
    }
};

export const ConfigProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const { data: rawConfig, isLoading: loading, refetch: fetchConfig } = useQuery({
        queryKey: ['site-config'],
        queryFn: () => configService.getPublic(),
        staleTime: 1000 * 60 * 60, // 1 hour - config doesn't change often
    });

    const config = React.useMemo(() => {
        if (!rawConfig) return DEFAULT_CONFIG;
        return normalizeSiteConfig(rawConfig);
    }, [rawConfig]);

    const updateContextConfig = (newData) => {
        queryClient.setQueryData(['site-config'], newData);
    };

    const value = React.useMemo(
        () => ({
            config,
            loading,
            fetchConfig,
            updateContextConfig
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
