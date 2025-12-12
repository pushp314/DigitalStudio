import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({
        heroTitle: "Building quality templates",
        heroSubtitle: "Ship your startup faster.",
        announcementMessage: "",
        showAnnouncement: false,
        supportEmail: "",
        features: {
            saas: true,
            docs: true,
            hub: true
        }
    });

    const [loading, setLoading] = useState(true);

    const fetchConfig = async () => {
        try {
            const { data } = await api.get('/config');
            setConfig(data);
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
        setConfig(newConfig);
    };

    return (
        <ConfigContext.Provider value={{ config, updateContextConfig, loading, fetchConfig }}>
            {children}
        </ConfigContext.Provider>
    );
};

export default ConfigContext;
