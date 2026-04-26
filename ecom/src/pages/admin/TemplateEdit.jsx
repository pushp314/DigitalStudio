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
    categoryId: '',
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
    // Technical & Media
    videoURL: '',
    duration: '',
    courseOutline: '',
    snippetLanguage: 'javascript',
    snippet: '',
    // SEO Fields
    seoTitle: '',
    seoDescription: '',
    ogImage: '',
};

const PRODUCT_TYPE_OPTIONS = [
    { value: 'template', label: 'Template' },
    { value: 'fullstack', label: 'Full-stack app' },
    { value: 'api', label: 'API / backend kit' },
    { value: 'component', label: 'Component pack' },
    { value: 'ui_kit', label: 'UI kit' },
    { value: 'code_snippet', label: 'Code snippet' },
    { value: 'edu_module', label: 'Guide / learning module' },
];

const TemplateEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { success, error } = useToast();
    const isCreateMode = !id;

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [formData, setFormData] = useState(emptyForm);
    const [activeTab, setActiveTab] = useState('general'); // general, gallery, seo, preview
    const [previewDevice, setPreviewDevice] = useState('desktop'); // desktop, mobile
    const [categories, setCategories] = useState([]);

    const pageTitle = useMemo(() => (isCreateMode ? 'Add New Product' : 'Edit Product'), [isCreateMode]);

    useEffect(() => {
        const init = async () => {
            try {
                const cats = await api.get('/admin/categories');
                setCategories(Array.isArray(cats) ? cats : []);

                if (!isCreateMode) {
                    const data = await productService.getById(id);
                    const product = normalizeProduct(data);
                    setFormData({
                        ...product,
                        price: String(product.price || ''),
                        categoryId: product.categoryId || '',
                        techStack: product.techStack?.join(', ') || '',
                        previewImages: product.previewImages?.length > 0 ? product.previewImages : [{ url: '' }],
                        seoTitle: product.seoTitle || product.title,
                        seoDescription: product.seoDescription || product.description,
                        ogImage: product.ogImage || product.image,
                    });
                }
            } catch (err) {
                error(err.message || 'Error initializing editor');
                if (!isCreateMode) navigate('/admin/templates');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [id, isCreateMode, navigate, error]);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        
        if (name === 'categoryId') {
            const selectedCat = categories.find(c => String(c.id) === String(value));
            setFormData(prev => ({
                ...prev,
                categoryId: value,
                category: selectedCat ? selectedCat.name : ''
            }));
            return;
        }

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

    const isAdminPath = window.location.pathname.startsWith('/admin');
    const backPath = isAdminPath ? '/admin/templates' : '/account?tab=studio';

    const handleSubmit = async (event) => {
        if (event) event.preventDefault();
        const payload = {
            ...formData,
            price: Number(formData.price || 0),
            categoryId: Number(formData.categoryId || 0),
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
                success(isAdminPath ? 'Product created successfully' : 'Project submitted for administrative review.');
            } else {
                await productService.update(id, payload);
                success(isAdminPath ? 'Product updated' : 'Submission updated. Re-review might be required.');
            }
            navigate(backPath);
        } catch (err) {
            error('Could not save this product submission.');
        }
    };

    if (loading) return <div className="p-20 text-center font-bold text-gray-400">Loading details...</div>;

    const tabs = [
        { id: 'general', label: 'Meta', icon: '📝' },
        { id: 'gallery', label: 'Gallery', icon: '🖼️' },
        { id: 'technical', label: 'Content', icon: '💻' },
        { id: 'seo', label: 'SEO', icon: '🔍' },
        { id: 'preview', label: 'Mockup', icon: '📱' },
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB] p-4 sm:p-8 md:p-14 lg:p-20 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 sm:mb-12">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">{isAdminPath ? 'Product Admin' : 'Approval-Based Listing'}</p>
                        <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight">{isAdminPath ? pageTitle : (isCreateMode ? 'Sell Your Project' : 'Edit Submission')}</h1>
                        {!isAdminPath && (
                            <p className="mt-3 max-w-2xl text-xs sm:text-sm font-medium leading-6 text-gray-500">
                                Submit an app, template, dashboard, software kit, or technical asset. BizCode reviews every listing before it appears in the catalog.
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button onClick={() => navigate(backPath)} className="flex-1 sm:flex-none px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-black transition-all">Cancel</button>
                        <button onClick={handleSubmit} className="flex-[2] sm:flex-none px-8 sm:px-10 py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-95">{isAdminPath ? 'Save Changes' : (isCreateMode ? 'Submit for Review' : 'Update Project')}</button>
                    </div>
                </div>

                {/* Main Workspace */}
                <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[600px] sm:min-h-[700px]">
                    {/* Tab Selection */}
                    <aside className="w-full lg:w-24 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-100 flex lg:flex-col items-center py-4 lg:py-10 px-4 lg:px-0 gap-4 lg:gap-8 overflow-x-auto lg:overflow-x-visible custom-scrollbar">
                        {tabs.map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setActiveTab(t.id)} 
                                className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 lg:w-14 lg:h-14 rounded-2xl flex flex-col items-center justify-center transition-all ${activeTab === t.id ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:bg-white hover:text-black'}`}
                            >
                                <span className="text-lg sm:text-xl">{t.icon}</span>
                                <span className="text-[7px] sm:text-[8px] font-black uppercase mt-1">{t.label}</span>
                            </button>
                        ))}
                    </aside>

                    {/* Content Panel */}
                    <main className="flex-1 p-6 sm:p-12 md:p-16 overflow-y-auto overflow-x-hidden">
                        {activeTab === 'general' && (
                            <div className="space-y-8 sm:space-y-10 animate-in slide-in-from-right-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                                    <Field label="Product Title">
                                        <input name="title" value={formData.title} onChange={handleChange} className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-black font-black text-sm transition-all" placeholder="e.g. SaaS Admin Dashboard" />
                                    </Field>
                                    <Field label="Product Type">
                                        <select name="productType" value={formData.productType} onChange={handleChange} className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-black font-black text-sm appearance-none transition-all">
                                            {PRODUCT_TYPE_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Use Case / Category">
                                        <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-black font-black text-sm appearance-none transition-all">
                                            <option value="">Select Category</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>

                                <Field label="Short Buyer Summary">
                                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-black font-medium text-sm leading-relaxed transition-all" placeholder="Explain what this helps buyers launch, who it is for, and what is included." />
                                </Field>
                                
                                <Field label="Product Details (Markdown)">
                                    <div className="relative">
                                        <textarea name="longDescription" value={formData.longDescription} onChange={handleChange} rows={12} className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-black font-medium text-sm leading-relaxed transition-all" />
                                        <button onClick={handleGenerateAI} disabled={aiGenerating} className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50">
                                            {aiGenerating ? 'Writing...' : 'Write with AI'}
                                        </button>
                                    </div>
                                </Field>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 border-t border-gray-50 pt-8 sm:pt-10">
                                    <Field label="Price (₹)">
                                        <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-black font-black text-sm transition-all" />
                                    </Field>
                                    <Field label="Tech Stack">
                                        <input name="techStack" value={formData.techStack} onChange={handleChange} className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-black font-black text-sm transition-all" placeholder="React, Go, R2" />
                                    </Field>
                                    <Field label="Version">
                                        <input name="version" value={formData.version} onChange={handleChange} className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-black font-black text-sm transition-all" placeholder="1.0.0" />
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                                    <Field label="Live Preview URL">
                                        <input name="liveDemo" value={formData.liveDemo} onChange={handleChange} className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-black font-black text-sm transition-all" placeholder="https://..." />
                                    </Field>
                                    <Field label="Repository URL">
                                        <input name="githubRepo" value={formData.githubRepo} onChange={handleChange} className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-black font-black text-sm transition-all" placeholder="https://github.com/..." />
                                    </Field>
                                    <Field label="Delivery File URL">
                                        <input name="fileURL" value={formData.fileURL} onChange={handleChange} className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-black font-black text-sm transition-all" placeholder="Private asset URL or managed file" />
                                    </Field>
                                </div>
                            </div>
                        )}

                        {activeTab === 'gallery' && (
                            <div className="space-y-8 sm:space-y-10 animate-in slide-in-from-right-4 duration-500">
                                <Field label="Primary Cover Image">
                                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                                        <img src={formData.image || 'https://via.placeholder.com/150'} className="w-full sm:w-32 h-48 sm:h-32 rounded-2xl sm:rounded-3xl object-cover border border-gray-100 bg-gray-50 shadow-sm" />
                                        <div className="flex-1 w-full space-y-3">
                                            <input name="image" value={formData.image} onChange={handleChange} className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-black font-black text-[10px] sm:text-xs" placeholder="URL or Upload..." />
                                            <label className="inline-block w-full sm:w-auto text-center px-6 py-3 border-2 border-black rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-black hover:text-white transition-all">
                                                Upload cover to R2
                                                <input type="file" className="hidden" onChange={(e) => handleUpload(e, (u) => setFormData(p => ({ ...p, image: u })))} />
                                            </label>
                                        </div>
                                    </div>
                                </Field>

                                <div className="space-y-6 pt-8 sm:pt-10 border-t border-gray-50">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Additional Media Slots</h3>
                                    {(formData.previewImages || []).map((img, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                                            <input value={img.url} onChange={(e) => {
                                                const n = [...formData.previewImages];
                                                n[idx] = { ...n[idx], url: e.target.value };
                                                setFormData(p => ({ ...p, previewImages: n }));
                                            }} className="flex-1 px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none font-black text-[10px] sm:text-xs" placeholder="Slide URL..." />
                                            <label className="shrink-0 p-3 sm:p-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl cursor-pointer hover:bg-black hover:text-white transition-all text-center">
                                                🌩️
                                                <input type="file" className="hidden" onChange={(e) => handleUpload(e, (u) => {
                                                     const n = [...formData.previewImages];
                                                     n[idx] = { ...n[idx], url: u };
                                                     setFormData(p => ({ ...p, previewImages: n }));
                                                })} />
                                            </label>
                                        </div>
                                    ))}
                                    <button onClick={() => setFormData(p => ({ ...p, previewImages: [...(p.previewImages || []), { url: '' }] }))} className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:border-black hover:text-black transition-all">+ Add Visual Frame</button>
                                </div>
                            </div>
                        )}
                        {activeTab === 'technical' && (
                            <div className="space-y-8 sm:space-y-10 animate-in slide-in-from-right-4 duration-500">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                    <Field label="Video Showcase URL">
                                        <input name="videoURL" value={formData.videoURL} onChange={handleChange} className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-black font-black text-sm" placeholder="https://..." />
                                    </Field>
                                    <Field label="Content Duration">
                                        <input name="duration" value={formData.duration} onChange={handleChange} className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-black font-black text-sm" placeholder="10h 30m" />
                                    </Field>
                                </div>

                                <Field label="Course Outline / Curriculum">
                                    <textarea name="courseOutline" value={formData.courseOutline} onChange={handleChange} rows={6} className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-black font-medium text-sm leading-relaxed" placeholder="List the modules or sections..." />
                                </Field>

                                <div className="space-y-4 pt-8 sm:pt-10 border-t border-gray-50">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                        <Field label="Snippet Language">
                                            <input name="snippetLanguage" value={formData.snippetLanguage} onChange={handleChange} className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-black font-black text-sm" placeholder="javascript" />
                                        </Field>
                                    </div>
                                    <Field label="Code Snippet / Preview Code">
                                        <textarea name="snippet" value={formData.snippet} onChange={handleChange} rows={10} className="w-full p-4 sm:p-6 bg-[#0d1117] text-[#c9d1d9] rounded-xl sm:rounded-2xl outline-none font-mono text-[10px] sm:text-xs leading-relaxed" placeholder="// Paste a representative code snippet here..." />
                                    </Field>
                                </div>
                            </div>
                        )}

                        {activeTab === 'seo' && (
                            <div className="space-y-8 sm:space-y-10 animate-in slide-in-from-right-4 duration-500">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight mb-2">Search Optimization</h2>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Configure metadata for high-fidelity social previews</p>
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            if (!formData.title) return error('Add a title first');
                                            setAiGenerating(true);
                                            try {
                                                const result = await aiService.improveProductContent(formData.title, formData.description, formData.category);
                                                if (result?.data) {
                                                    const d = result.data;
                                                    if (window.confirm('Apply AI-generated SEO content? This will update your SEO fields.')) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            seoTitle: d.seoTitle || prev.seoTitle,
                                                            seoDescription: d.seoDescription || prev.seoDescription,
                                                            description: d.shortDescription || prev.description,
                                                        }));
                                                        success('SEO content applied');
                                                    }
                                                }
                                            } catch (err) {
                                                error('AI SEO generation failed');
                                            } finally {
                                                setAiGenerating(false);
                                            }
                                        }}
                                        disabled={aiGenerating}
                                        className="w-full sm:w-auto px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50 shadow-lg shadow-black/10"
                                    >
                                        {aiGenerating ? '✨ Generating...' : '✨ Improve with AI'}
                                    </button>
                                </div>
                                <Field label="Meta Title (SEO)">
                                    <input name="seoTitle" value={formData.seoTitle} onChange={handleChange} className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-black font-black text-sm transition-all" />
                                </Field>
                                <Field label="Meta Description">
                                    <textarea name="seoDescription" value={formData.seoDescription} onChange={handleChange} rows={4} className="w-full px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-black font-medium text-sm leading-relaxed transition-all" />
                                </Field>
                                <Field label="OpenGraph Image (1200x630)">
                                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                                        <input name="ogImage" value={formData.ogImage} onChange={handleChange} className="flex-1 px-5 py-3 sm:py-4 bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl outline-none font-black text-[10px] sm:text-xs" />
                                        <button onClick={() => setFormData(p => ({...p, ogImage: p.image}))} className="px-6 py-3 sm:py-4 bg-black text-white rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Clone Cover</button>
                                    </div>
                                </Field>
                            </div>
                        )}

                        {activeTab === 'preview' && (
                            <div className="space-y-8 sm:space-y-10 animate-in slide-in-from-right-4 duration-500 overflow-x-hidden">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight mb-2">Product Preview</h2>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Check how the listing cover looks across frames</p>
                                    </div>
                                    <div className="flex bg-gray-100 p-1 rounded-xl sm:p-1.5 sm:rounded-2xl gap-2 shadow-inner w-full sm:w-auto">
                                        <button onClick={() => setPreviewDevice('desktop')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${previewDevice === 'desktop' ? 'bg-black text-white shadow-sm' : 'text-gray-400 hover:text-black'}`}>MacBook</button>
                                        <button onClick={() => setPreviewDevice('mobile')} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${previewDevice === 'mobile' ? 'bg-black text-white shadow-sm' : 'text-gray-400 hover:text-black'}`}>iPhone</button>
                                    </div>
                                </div>

                                <div className="flex justify-center items-center py-10 sm:py-20 bg-gray-50/50 border border-gray-100 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden min-h-[400px] sm:min-h-[600px] px-4">
                                    {previewDevice === 'desktop' ? (
                                        <div className="w-full max-w-[800px] aspect-video bg-white rounded-lg border-4 sm:border-8 border-black shadow-2xl relative overflow-hidden transition-all duration-500">
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 sm:w-20 h-1 bg-black rounded-b-md"></div>
                                            <img src={formData.image || 'https://via.placeholder.com/800x450'} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-[260px] sm:w-[300px] h-[520px] sm:h-[600px] bg-white rounded-[2.5rem] sm:rounded-[3rem] border-4 sm:border-8 border-black shadow-2xl relative overflow-hidden transition-all duration-500">
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 sm:w-40 h-6 sm:h-8 bg-black rounded-b-2xl sm:rounded-b-3xl z-10"></div>
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
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">{label}</label>
        {children}
    </div>
);

export default TemplateEdit;
