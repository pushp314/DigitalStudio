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
