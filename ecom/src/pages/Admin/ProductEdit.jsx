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
