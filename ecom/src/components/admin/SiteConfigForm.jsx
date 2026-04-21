import React, { useState, useContext, useEffect } from 'react';
import ConfigContext from '../../context/ConfigContext';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ImageUpload from './ImageUpload';
import { 
    Layout, 
    Monitor, 
    ShieldAlert, 
    Zap, 
    CreditCard, 
    HelpCircle, 
    Share2, 
    Plus, 
    Trash2,
    Type,
    Mail,
    Phone,
    MapPin,
    Eye,
    X,
    Database,
    Cpu,
    MessageSquare,
    Shield
} from 'lucide-react';

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
        maintenanceMessage: '',
        carouselStack: [],
        aiSettings: {
            enabled: false,
            enableDocsAi: true,
            enableChatAi: true,
            serviceUrl: '',
            provider: 'ollama',
            model: '',
            apiKey: ''
        },
        eliteSettings: {
            negotiationEnabled: true,
            negotiationFee: 9,
            supportMonthlyFee: 9,
            serviceBenefitDays: 30
        }
    });
    const [loading, setLoading] = useState(false);
    const { success, error: toastError } = useToast();
    const [activeSection, setActiveSection] = useState(initialSection);

    useEffect(() => {
        setActiveSection(initialSection);
    }, [initialSection]);

    useEffect(() => {
        if (config) {
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
                maintenanceMessage: config.maintenanceMessage || 'Under scheduled maintenance. Please check back shortly.',
                carouselStack: Array.isArray(config.carouselStack) ? config.carouselStack.map(item => ({...item})) : [],
                aiSettings: config.aiSettings || { enabled: false, serviceUrl: '', provider: 'ollama', model: '', apiKey: '' },
                eliteSettings: config.eliteSettings || { negotiationEnabled: true, negotiationFee: 9, supportMonthlyFee: 9, serviceBenefitDays: 30 }
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
            success('System manifest updated.');
        } catch (error) {
            toastError('Failed to synchronize manifest.');
        } finally {
            setLoading(false);
        }
    };

    const sections = [
        { id: 'general', label: 'Identity', icon: <Type size={16} /> },
        { id: 'hero', label: 'Banner Deck', icon: <Monitor size={16} /> },
        { id: 'marketing', label: 'Social Index', icon: <Share2 size={16} /> },
        { id: 'carousel', label: 'Carousel Stack', icon: <Layout size={16} /> },
        { id: 'faqs', label: 'Queries', icon: <HelpCircle size={16} /> },
        { id: 'intelligence', label: 'AI Settings', icon: <Database size={16} /> },
        { id: 'elite', label: 'Expert Support', icon: <MessageSquare size={16} /> },
        { id: 'features', label: 'Operational Nodes', icon: <Zap size={16} /> },
        { id: 'contact', label: 'Contact Center', icon: <Mail size={16} /> },
        { id: 'plans', label: 'Membership', icon: <CreditCard size={16} /> },
        { id: 'security', label: 'Maintenance', icon: <ShieldAlert size={16} /> }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 relative" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[700px]">
                
                {/* Fixed Professional Sidebar */}
                <aside className="w-full lg:w-64 bg-slate-50/50 border-r border-slate-200 p-6 flex flex-col gap-8">
                    <div className="space-y-1">
                        {sections.map(s => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setActiveSection(s.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                                    activeSection === s.id 
                                    ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200' 
                                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100/50'
                                }`}
                            >
                                <span className={`${activeSection === s.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>{s.icon}</span>
                                {s.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-200">
                         <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-30 transition-all shadow-sm"
                        >
                            {loading ? 'Saving...' : 'Save Config'}
                        </button>
                    </div>
                </aside>

                {/* Content Panel */}
                <div className="flex-1 p-10 lg:p-14 overflow-y-auto bg-white custom-scrollbar">
                    <form onSubmit={handleSubmit} className="max-w-3xl space-y-12 pb-20">
                        
                        {activeSection === 'general' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Branding Identity</h2>
                                    <p className="text-xs text-slate-500">Configure global platform identifiers and support channels.</p>
                                </div>
                                <div className="space-y-6">
                                    <Field label="Hero Headline">
                                        <input type="text" name="heroTitle" value={formData.heroTitle} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 text-sm" />
                                    </Field>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field label="Primary Support Channel">
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                                <input type="email" name="supportEmail" value={formData.supportEmail} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 text-sm font-medium" />
                                            </div>
                                        </Field>
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Global Broadcast</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Announcement Bar</p>
                                            </div>
                                            <Toggle checked={formData.showAnnouncement} onChange={(val) => setFormData(prev => ({...prev, showAnnouncement: val}))} />
                                        </div>
                                    </div>
                                    {formData.showAnnouncement && (
                                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex justify-between items-center bg-slate-900/5 p-4 rounded-xl border border-slate-200/50">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Announcement List</p>
                                                <button type="button" onClick={() => addArrayItem('announcements', '')} className="text-[9px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 hover:underline"><Plus size={10} /> Add message</button>
                                            </div>
                                            <div className="space-y-2">
                                                {formData.announcements.map((msg, idx) => (
                                                    <div key={idx} className="flex gap-2 group">
                                                        <input 
                                                            type="text" 
                                                            value={msg} 
                                                            onChange={(e) => handleArrayChangeRaw('announcements', idx, e.target.value)}
                                                            className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg outline-none text-[10px] font-bold uppercase tracking-[0.2em]"
                                                            placeholder={`Msg Node ${idx + 1}...`}
                                                        />
                                                        <button type="button" onClick={() => removeArrayItem('announcements', idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeSection === 'hero' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Banner Visuals</h2>
                                    <p className="text-xs text-slate-500">Manage asset rotation and visual entrance animations.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {formData.heroImages?.map((url, idx) => (
                                        <div key={idx} className="p-6 border border-slate-200 rounded-xl bg-slate-50/30 relative group">
                                            <button type="button" onClick={() => removeArrayItem('heroImages', idx)} className="absolute top-3 right-3 p-1.5 bg-white shadow-sm border border-slate-200 rounded-md text-slate-300 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                                            <ImageUpload 
                                                label={`Visual Asset ${idx + 1}`}
                                                currentImage={url}
                                                onUploadSuccess={(newUrl) => handleArrayChangeRaw('heroImages', idx, newUrl)}
                                            />
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addArrayItem('heroImages', '')} className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-slate-300 hover:border-slate-900 hover:text-slate-900 transition-all group">
                                        <Plus size={20} className="mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">New Asset</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeSection === 'marketing' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Social Index</h2>
                                    <p className="text-xs text-slate-500">Manage social proof points and the partner logo marquee.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Field label="Platform Rating">
                                        <input value={formData.socialProof.rating} onChange={(e) => handleNestedChange('socialProof', 'rating', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold" placeholder="e.g. 4.9/5" />
                                    </Field>
                                    <Field label="Creators Counter">
                                        <input value={formData.socialProof.creatorsLabel} onChange={(e) => handleNestedChange('socialProof', 'creatorsLabel', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold" placeholder="e.g. 5k+ Developers" />
                                    </Field>
                                </div>
                                <Field label="Proof Summary">
                                    <textarea value={formData.socialProof.summary} onChange={(e) => handleNestedChange('socialProof', 'summary', e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-xs font-medium" rows={3} placeholder="Unified testimonial or proof statement..." />
                                </Field>
                                
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Partner Marquee</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Infinite scrolling logos/names</p>
                                        </div>
                                        <button type="button" onClick={() => {
                                            const newTeams = [...(formData.socialProof.trustedCompanies || []), ''];
                                            handleNestedChange('socialProof', 'trustedCompanies', newTeams);
                                        }} className="text-[9px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 hover:underline"><Plus size={10} /> Add Partner</button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {formData.socialProof.trustedCompanies?.map((company, idx) => (
                                            <div key={idx} className="flex gap-2 group">
                                                <input 
                                                    type="text" 
                                                    value={company} 
                                                    onChange={(e) => {
                                                        const newTeams = [...formData.socialProof.trustedCompanies];
                                                        newTeams[idx] = e.target.value;
                                                        handleNestedChange('socialProof', 'trustedCompanies', newTeams);
                                                    }}
                                                    className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none text-[10px] font-bold uppercase tracking-widest focus:border-slate-900 transition-colors"
                                                    placeholder="Partner Name..."
                                                />
                                                <button type="button" onClick={() => {
                                                    const newTeams = formData.socialProof.trustedCompanies.filter((_, i) => i !== idx);
                                                    handleNestedChange('socialProof', 'trustedCompanies', newTeams);
                                                }} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'carousel' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Carousel Stack</h2>
                                        <p className="text-xs text-slate-500">Upload document previews and configure redirection nodes.</p>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => addArrayItem('carouselStack', { title: '', image: '', link: '' })} 
                                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                                    >
                                        <Plus size={14} /> Add Asset
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {formData.carouselStack.length === 0 ? (
                                        <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No visual assets configured</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-6">
                                            {formData.carouselStack.map((item, idx) => (
                                                <div key={idx} className="p-8 border border-slate-200 rounded-[2.5rem] bg-white relative group">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeArrayItem('carouselStack', idx)} 
                                                        className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 transition-all hover:bg-red-50 rounded-xl"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <div className="grid grid-cols-1 md:grid-cols-[240px,1fr] gap-10">
                                                        <div className="space-y-4">
                                                            <ImageUpload 
                                                                label={`Visual Node ${idx + 1}`}
                                                                currentImage={item.image}
                                                                onUploadSuccess={(url) => handleArrayChange('carouselStack', idx, 'image', url)}
                                                            />
                                                        </div>
                                                        <div className="space-y-6 self-center">
                                                            <Field label="Asset Highlight Title">
                                                                <input 
                                                                    value={item.title} 
                                                                    onChange={(e) => handleArrayChange('carouselStack', idx, 'title', e.target.value)} 
                                                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all text-sm font-bold"
                                                                    placeholder="e.g. Master Setup Guide"
                                                                />
                                                            </Field>
                                                            <Field label="Redirection Intelligence (Link)">
                                                                <div className="relative">
                                                                    <Share2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                                                    <input 
                                                                        value={item.link} 
                                                                        onChange={(e) => handleArrayChange('carouselStack', idx, 'link', e.target.value)} 
                                                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all text-xs font-medium"
                                                                        placeholder="/docs/setup-guide or https://external-manual.com"
                                                                    />
                                                                </div>
                                                            </Field>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeSection === 'elite' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Expert Support</h2>
                                        <p className="text-xs text-slate-500">Manage paid expert help and post-purchase support sessions.</p>
                                    </div>
                                    <Toggle 
                                        checked={formData.eliteSettings?.negotiationEnabled} 
                                        onChange={(val) => handleNestedChange('eliteSettings', 'negotiationEnabled', val)} 
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Field label="Expert Help Fee (₹)">
                                        <div className="relative">
                                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                            <input 
                                                type="number" 
                                                value={formData.eliteSettings?.negotiationFee} 
                                                onChange={(e) => handleNestedChange('eliteSettings', 'negotiationFee', parseFloat(e.target.value))}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold shadow-sm outline-none focus:ring-1 focus:ring-slate-900"
                                                placeholder="e.g. 9"
                                            />
                                        </div>
                                    </Field>
                                    <Field label="Support Duration (Days)">
                                        <div className="relative">
                                            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                            <input 
                                                type="number" 
                                                value={formData.eliteSettings?.serviceBenefitDays} 
                                                onChange={(e) => handleNestedChange('eliteSettings', 'serviceBenefitDays', parseInt(e.target.value))}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold shadow-sm outline-none focus:ring-1 focus:ring-slate-900"
                                                placeholder="e.g. 30"
                                            />
                                        </div>
                                    </Field>
                                </div>

                                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex items-start gap-6">
                                    <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shrink-0">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-2">Support Policy</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Enabling expert help lets users pay a ₹{formData.eliteSettings?.negotiationFee} fee to start a direct support chat. Buyers automatically receive {formData.eliteSettings?.serviceBenefitDays} days of dedicated direct support for every product they buy.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'intelligence' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">AI Settings</h2>
                                        <p className="text-xs text-slate-500">Configure documentation assistants, chat helpers, providers, and models.</p>
                                    </div>
                                    <Toggle 
                                        checked={formData.aiSettings.enabled} 
                                        onChange={(val) => handleNestedChange('aiSettings', 'enabled', val)} 
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Guide Analysis</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Docs AI Assistant</p>
                                        </div>
                                        <Toggle 
                                            checked={formData.aiSettings.enableDocsAi} 
                                            onChange={(val) => handleNestedChange('aiSettings', 'enableDocsAi', val)} 
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Community Support</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Chat AI Agent</p>
                                        </div>
                                        <Toggle 
                                            checked={formData.aiSettings.enableChatAi} 
                                            onChange={(val) => handleNestedChange('aiSettings', 'enableChatAi', val)} 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Field label="AI Provider">
                                        <select 
                                            value={formData.aiSettings.provider} 
                                            onChange={(e) => handleNestedChange('aiSettings', 'provider', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold shadow-sm outline-none focus:ring-1 focus:ring-slate-900"
                                        >
                                            <option value="ollama">Ollama (Local Node)</option>
                                            <option value="groq">Groq (Deep-Speed Cloud)</option>
                                            <option value="gemini">Gemini (free tier)</option>
                                        </select>
                                    </Field>
                                    <Field label="AI Model">
                                        <input 
                                            type="text" 
                                            value={formData.aiSettings.model} 
                                            onChange={(e) => handleNestedChange('aiSettings', 'model', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold shadow-sm outline-none focus:ring-1 focus:ring-slate-900"
                                            placeholder="e.g. qwen3.5:2b or gemini-1.5-flash"
                                        />
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 gap-8">
                                    <Field label="AI Service URL (Ollama)">
                                        <div className="relative">
                                            <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                            <input 
                                                type="text" 
                                                value={formData.aiSettings.serviceUrl} 
                                                onChange={(e) => handleNestedChange('aiSettings', 'serviceUrl', e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium shadow-sm outline-none focus:ring-1 focus:ring-slate-900"
                                                placeholder="http://localhost:11434/api"
                                            />
                                        </div>
                                    </Field>
                                    <Field label="Provider API Key">
                                        <div className="relative">
                                            <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                            <input 
                                                type="password" 
                                                value={formData.aiSettings.apiKey} 
                                                onChange={(e) => handleNestedChange('aiSettings', 'apiKey', e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium shadow-sm outline-none focus:ring-1 focus:ring-slate-900"
                                                placeholder="••••••••••••••••••••••••••••••••"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium mt-2">API keys are stored securely. Leave blank to use environment defaults.</p>
                                    </Field>
                                </div>
                            </div>
                        )}

                        {activeSection === 'faqs' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">FAQs</h2>
                                        <p className="text-xs text-slate-500">Manage buyer questions, support expectations, and product guidance.</p>
                                    </div>
                                    <button type="button" onClick={() => addArrayItem('faqs', { question: '', answer: '' })} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Plus size={14} /> New FAQ</button>
                                </div>
                                <div className="space-y-6">
                                    {formData.faqs.map((faq, idx) => (
                                        <div key={idx} className="p-8 border border-slate-200 rounded-2xl bg-white relative group space-y-6">
                                            <button type="button" onClick={() => removeArrayItem('faqs', idx)} className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                                            <Field label={`Question ${idx + 1}`}>
                                                <input value={faq.question} onChange={(e) => {
                                                    const newFaqs = [...formData.faqs];
                                                    newFaqs[idx] = { ...newFaqs[idx], question: e.target.value };
                                                    setFormData(prev => ({ ...prev, faqs: newFaqs }));
                                                }} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold" placeholder="State the inquiry..." />
                                            </Field>
                                            <Field label="Resolution Content">
                                                <textarea value={faq.answer} onChange={(e) => {
                                                    const newFaqs = [...formData.faqs];
                                                    newFaqs[idx] = { ...newFaqs[idx], answer: e.target.value };
                                                    setFormData(prev => ({ ...prev, faqs: newFaqs }));
                                                }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-xs font-medium" rows={3} placeholder="Provide technical resolution..." />
                                            </Field>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeSection === 'features' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Feature Gates</h2>
                                    <p className="text-xs text-slate-500">Enable or disable core system operational nodes.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {['payments', 'licenses', 'reviews', 'subscriptions', 'ai', 'wishlist', 'testimonials', 'docs', 'profiles'].map(feature => (
                                        <div key={feature} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50/50 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${formData.features[feature] ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Zap size={14} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900 capitalize">{feature}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formData.features[feature] ? 'ACTIVE' : 'LOCKED'}</p>
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

                        {activeSection === 'contact' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Contact Center</h2>
                                    <p className="text-xs text-slate-500">Manage public contact details and engagement headings.</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field label="Page Heading">
                                            <input 
                                                value={formData.contact.heading} 
                                                onChange={(e) => handleNestedChange('contact', 'heading', e.target.value)} 
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold" 
                                                placeholder="e.g. Get in touch" 
                                            />
                                        </Field>
                                        <Field label="Public Support Email">
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                                <input 
                                                    value={formData.contact.email} 
                                                    onChange={(e) => handleNestedChange('contact', 'email', e.target.value)} 
                                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium" 
                                                    placeholder="contact@digitalstudio.app"
                                                />
                                            </div>
                                        </Field>
                                    </div>
                                    <Field label="Engagement Subheading">
                                        <textarea 
                                            value={formData.contact.subheading} 
                                            onChange={(e) => handleNestedChange('contact', 'subheading', e.target.value)} 
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-xs font-medium" 
                                            rows={3} 
                                            placeholder="Provide context for customer inquiries..." 
                                        />
                                    </Field>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field label="Contact Hotline">
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                                <input 
                                                    value={formData.contact.phone} 
                                                    onChange={(e) => handleNestedChange('contact', 'phone', e.target.value)} 
                                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium" 
                                                    placeholder="+1 (555) 000-0000"
                                                />
                                            </div>
                                        </Field>
                                        <Field label="Operational Headquarters">
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                                <input 
                                                    value={formData.contact.address} 
                                                    onChange={(e) => handleNestedChange('contact', 'address', e.target.value)} 
                                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium" 
                                                    placeholder="Global City, Digital Hub"
                                                />
                                            </div>
                                        </Field>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'plans' && (
                            <div className="space-y-10 animate-in fade-in duration-500 text-slate-900">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h2 className="text-xl font-bold tracking-tight mb-1">Membership Subscriptions</h2>
                                        <p className="text-xs text-slate-500">Configure tier access and recursive billing logic.</p>
                                    </div>
                                    <button type="button" onClick={() => addArrayItem('memberPlans', { name: '', badge: '', price: 0, period: 'month', features: [], buttonText: 'Upgrade', isPopular: false, isPrimary: false })} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Plus size={14} /> New Tier</button>
                                </div>
                                <div className="space-y-6">
                                    {formData.memberPlans.map((plan, idx) => (
                                        <div key={idx} className="p-8 border border-slate-200 rounded-xl bg-white relative group">
                                            <button type="button" onClick={() => removeArrayItem('memberPlans', idx)} className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                <div className="space-y-5">
                                                     <div className="grid grid-cols-2 gap-4">
                                                        <Field label="Tier Handle">
                                                            <input value={plan.name} onChange={(e) => handleArrayChange('memberPlans', idx, 'name', e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold" />
                                                        </Field>
                                                        <Field label="Identity Badge">
                                                            <input value={plan.badge} onChange={(e) => handleArrayChange('memberPlans', idx, 'badge', e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] uppercase font-bold tracking-widest" />
                                                        </Field>
                                                     </div>
                                                     <div className="grid grid-cols-2 gap-4">
                                                        <Field label="Rate (INR)">
                                                            <input type="number" value={plan.price} onChange={(e) => handleArrayChange('memberPlans', idx, 'price', parseInt(e.target.value))} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold" />
                                                        </Field>
                                                        <Field label="Cycle Period">
                                                            <input value={plan.period} onChange={(e) => handleArrayChange('memberPlans', idx, 'period', e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium" />
                                                        </Field>
                                                     </div>
                                                     <div className="flex gap-6">
                                                        <div className="flex items-center gap-3">
                                                            <Toggle checked={plan.isPopular} onChange={(val) => handleArrayChange('memberPlans', idx, 'isPopular', val)} />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Promoted</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Toggle checked={plan.isPrimary} onChange={(val) => handleArrayChange('memberPlans', idx, 'isPrimary', val)} />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dark Accent</span>
                                                        </div>
                                                     </div>
                                                </div>
                                                <div className="space-y-4">
                                                     <div className="flex justify-between items-center">
                                                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tier Perks ({plan.features?.length || 0})</p>
                                                         <button type="button" onClick={() => { handleArrayChange('memberPlans', idx, 'features', [...(plan.features || []), '']) }} className="text-[9px] font-bold text-blue-600 uppercase tracking-widest hover:underline">+ Add perk</button>
                                                     </div>
                                                     <div className="space-y-2">
                                                         {plan.features?.map((feat, fIdx) => (
                                                             <div key={fIdx} className="flex gap-2 group/feat">
                                                                 <input 
                                                                    value={feat} 
                                                                    onChange={(e) => {
                                                                        const newFeatures = [...plan.features];
                                                                        newFeatures[fIdx] = e.target.value;
                                                                        handleArrayChange('memberPlans', idx, 'features', newFeatures);
                                                                    }} 
                                                                    className="flex-1 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium focus:bg-white transition-all"
                                                                    placeholder="Perk identifier..."
                                                                 />
                                                                 <button type="button" onClick={() => { handleArrayChange('memberPlans', idx, 'features', plan.features.filter((_, i) => i !== fIdx)) }} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover/feat:opacity-100 transition-all"><X size={14} /></button>
                                                             </div>
                                                         ))}
                                                     </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeSection === 'security' && (
                            <div className="space-y-10 animate-in fade-in duration-500">
                                <div>
                                    <h2 className="text-xl font-bold text-red-600 tracking-tight mb-1">Maintenance Environment</h2>
                                    <p className="text-xs text-slate-500">Restrict public access to the platform for system stabilization.</p>
                                </div>
                                <div className="p-8 border border-red-100 bg-red-50/30 rounded-xl space-y-6">
                                    <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                                        <div>
                                            <p className="text-xs font-bold text-red-600 uppercase tracking-widest">Stabilization Mode</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Enforce site-wide maintenance lockdown.</p>
                                        </div>
                                        <Toggle checked={formData.maintenanceMode} onChange={(val) => setFormData(prev => ({...prev, maintenanceMode: val}))} />
                                    </div>
                                    {formData.maintenanceMode && (
                                        <Field label="System Status Message (Public)">
                                            <textarea 
                                                name="maintenanceMessage" 
                                                value={formData.maintenanceMessage} 
                                                onChange={handleChange} 
                                                className="w-full px-4 py-3 bg-white border border-red-200 rounded-lg outline-none focus:ring-1 focus:ring-red-500 text-xs font-bold text-slate-900 leading-relaxed uppercase tracking-widest" 
                                                rows={4}
                                            />
                                        </Field>
                                    )}
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
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
        {children}
    </div>
);

const Toggle = ({ checked, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full transition-all duration-300 relative ${checked ? 'bg-slate-900 border border-slate-900' : 'bg-slate-200 border border-slate-200'}`}
    >
        <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all duration-300 ease-in-out ${checked ? 'left-5 shadow-sm' : 'left-0.5 shadow-sm'}`} />
    </button>
);

export default SiteConfigForm;
