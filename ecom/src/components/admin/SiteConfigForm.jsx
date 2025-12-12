import React, { useState, useContext, useEffect } from 'react';
import ConfigContext from '../../context/ConfigContext';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const SiteConfigForm = () => {
    const { config, updateContextConfig } = useContext(ConfigContext);
    const [formData, setFormData] = useState({
        heroTitle: '',
        heroSubtitle: '',
        announcementMessage: '',
        showAnnouncement: false,
        supportEmail: ''
    });
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (config) {
            setFormData({
                heroTitle: config.heroTitle || '',
                heroSubtitle: config.heroSubtitle || '',
                announcementMessage: config.announcementMessage || '',
                showAnnouncement: config.showAnnouncement || false,
                supportEmail: config.supportEmail || ''
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.put('/config', formData);
            updateContextConfig(data);
            addToast('Site configuration updated successfully!', 'success');
        } catch (error) {
            addToast('Failed to update configuration.', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">General Settings</h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Hero Section */}
                    <div className="space-y-4">
                        <h4 className="text-zinc-500 text-xs font-bold uppercase tracking-wider border-b border-zinc-800 pb-2">Hero Section</h4>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Hero Title</label>
                            <input
                                type="text"
                                name="heroTitle"
                                value={formData.heroTitle}
                                onChange={handleChange}
                                className="w-full bg-black border border-zinc-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#0055FF] outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Hero Subtitle</label>
                            <input
                                type="text"
                                name="heroSubtitle"
                                value={formData.heroSubtitle}
                                onChange={handleChange}
                                className="w-full bg-black border border-zinc-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#0055FF] outline-none"
                            />
                        </div>
                    </div>

                    {/* Announcement Bar */}
                    <div className="space-y-4 pt-4">
                        <h4 className="text-zinc-500 text-xs font-bold uppercase tracking-wider border-b border-zinc-800 pb-2">Announcement Bar</h4>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="showAnnouncement"
                                name="showAnnouncement"
                                checked={formData.showAnnouncement}
                                onChange={handleChange}
                                className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-[#0055FF] focus:ring-[#0055FF]"
                            />
                            <label htmlFor="showAnnouncement" className="text-sm font-medium text-zinc-300">Show Announcement Bar</label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Announcement Message</label>
                            <input
                                type="text"
                                name="announcementMessage"
                                value={formData.announcementMessage}
                                onChange={handleChange}
                                className="w-full bg-black border border-zinc-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#0055FF] outline-none"
                            />
                        </div>
                    </div>

                    {/* Support */}
                    <div className="space-y-4 pt-4">
                        <h4 className="text-zinc-500 text-xs font-bold uppercase tracking-wider border-b border-zinc-800 pb-2">Contact Info</h4>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Support Email</label>
                            <input
                                type="email"
                                name="supportEmail"
                                value={formData.supportEmail}
                                onChange={handleChange}
                                className="w-full bg-black border border-zinc-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#0055FF] outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-800 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#0055FF] hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full transition-all shadow-[0_0_20px_rgba(0,85,255,0.4)] hover:shadow-[0_0_30px_rgba(0,85,255,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SiteConfigForm;
