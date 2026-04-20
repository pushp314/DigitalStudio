import React, { createContext, useState, useEffect } from 'react';
import configService from '../services/configService';
import { normalizeSiteConfig } from '../utils/normalizers';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({
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
            console.error('Failed to fetch site config', error);
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

    const value = React.useMemo(
        () => ({
            config,
            updateContextConfig,
            loading,
            fetchConfig,
        }),
        [config, loading],
    );

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
};

export default ConfigContext;
