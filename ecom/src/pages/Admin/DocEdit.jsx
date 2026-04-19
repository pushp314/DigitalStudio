import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import docService from '../../services/docService';
import aiService from '../../services/aiService';
import { useToast } from '../../context/ToastContext';
import { normalizeDoc } from '../../utils/normalizers';

const DocEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { success, error } = useToast();
    const isCreateMode = !id;

    const [loading, setLoading] = useState(!isCreateMode);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        price: '0',
        section: 'General',
        content: '# Getting Started\n\nWrite your documentation here using Markdown. Use headers (H1, H2, H3) to automatically generate the **ScrollSpy** table of contents.\n\n## Example Section\nThis section will appear in the sidebar automatically.',
        isPremium: false,
        order: 0,
        // SEO Fields
        seoTitle: '',
        seoDescription: '',
    });

    const [activeTab, setActiveTab] = useState('editor'); // editor, seo, help
    const [previewMode, setPreviewMode] = useState('split'); 

    useEffect(() => {
        if (isCreateMode) {
            setLoading(false);
            return;
        }

        const fetchDoc = async () => {
            try {
                const data = await docService.getById(id);
                const doc = normalizeDoc(data);
                setFormData({
                    title: doc.title || '',
                    price: String(doc.price || 0),
                    section: doc.section || 'General',
                    content: doc.content || '',
                    isPremium: doc.isPremium || false,
                    order: doc.order || 0,
                    seoTitle: doc.seoTitle || doc.title,
                    seoDescription: doc.seoDescription || '',
                });
            } catch (err) {
                error(err.message || 'Error fetching document');
                navigate('/admin/docs');
            } finally {
                setLoading(false);
            }
        };

        fetchDoc();
    }, [id, isCreateMode, error, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleGenerateAI = async () => {
        if (!formData.title) return error('Specify an asset title first!');
        setAiGenerating(true);
        try {
            const result = await aiService.generateDescription(formData.title, 'Technical Documentation');
            setFormData(prev => ({ ...prev, content: prev.content + '\n\n' + result.description }));
            success('AI Draft Generated');
        } catch (err) {
            error('AI Service Error');
        } finally {
            setAiGenerating(false);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const payload = {
            ...formData,
            price: Number(formData.price),
            order: Number(formData.order),
        };

        try {
            if (isCreateMode) {
                await docService.create(payload);
                success('Documentation created');
            } else {
                await docService.update(id, payload);
                success('Documentation updated');
            }
            navigate('/admin/docs');
        } catch (err) {
            error(err.message || 'Failed to save document');
        }
    };

    const insertText = (before, after = '') => {
        const textarea = document.getElementById('markdown-editor');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selected = text.substring(start, end);
        const newText = text.substring(0, start) + before + selected + after + text.substring(end);
        setFormData(prev => ({ ...prev, content: newText }));
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    const tocHeaders = useMemo(() => {
        const lines = formData.content.split('\n');
        return lines
            .filter(line => line.startsWith('#'))
            .map(line => {
                const level = line.match(/^#+/)?.[0].length || 1;
                const text = line.replace(/^#+\s*/, '');
                return { level, text };
            });
    }, [formData.content]);

    if (loading) return <div className="p-20 text-center font-bold text-gray-400">Loading...</div>;

    const tabs = [
        { id: 'editor', label: 'Editor', icon: '📝' },
        { id: 'seo', label: 'SEO', icon: '🔍' },
        { id: 'help', label: 'Guide', icon: '📖' },
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans selection:bg-black selection:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Enterprise Header */}
            <header className="bg-white border-b border-gray-100 px-10 py-5 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/admin/docs')} className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-xl hover:bg-black hover:text-white transition-all group">
                        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-black tracking-tight">{isCreateMode ? 'Draft Documentation' : formData.title}</h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Document Editor</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="bg-gray-50 p-1.5 rounded-2xl border border-gray-100 flex gap-1">
                        {['split', 'editor', 'preview'].map(m => (
                            <button
                                key={m}
                                onClick={() => setPreviewMode(m)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase transition-all tracking-widest ${previewMode === m ? 'bg-white text-black shadow-sm ring-1 ring-gray-100' : 'text-gray-400 hover:text-black'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleSubmit} className="px-8 py-3.5 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-95">
                        Save Document
                    </button>
                </div>
            </header>

            <div className="flex-grow flex overflow-hidden">
                {/* Secondary Sidebar Navigation */}
                <aside className="w-20 bg-white border-r border-gray-100 flex flex-col items-center py-10 gap-8 shrink-0">
                    {tabs.map(t => (
                        <button 
                            key={t.id} 
                            onClick={() => setActiveTab(t.id)} 
                            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${activeTab === t.id ? 'bg-black text-white' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
                        >
                            <span className="text-xl">{t.icon}</span>
                            <span className="text-[7px] font-bold uppercase mt-1">{t.label}</span>
                        </button>
                    ))}
                </aside>

                <div className={`flex-grow flex overflow-hidden ${previewMode === 'split' ? 'divide-x divide-gray-100' : ''}`}>
                    
                    {/* Workspace Central */}
                    {(previewMode === 'split' || previewMode === 'editor') && (
                        <div className={`${previewMode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col bg-white overflow-hidden`}>
                            <div className="p-10 space-y-8 overflow-y-auto flex-grow max-w-4xl mx-auto w-full">
                                
                                {activeTab === 'editor' && (
                                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                        <div className="grid grid-cols-2 gap-8">
                                            <FormGroup label="Document Title">
                                                <input name="title" value={formData.title} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm" placeholder="e.g. Setup Guide" />
                                            </FormGroup>
                                            <FormGroup label="Category">
                                                <input name="section" value={formData.section} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm" placeholder="e.g. Technical" />
                                            </FormGroup>
                                        </div>

                                        <div className="grid grid-cols-3 gap-8 items-end border-b border-gray-50 pb-8">
                                            <FormGroup label="Price (₹)">
                                                <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm" />
                                            </FormGroup>
                                            <FormGroup label="Index Order">
                                                <input type="number" name="order" value={formData.order} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm" />
                                            </FormGroup>
                                            <div className="pb-4 flex items-center justify-end h-full">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input type="checkbox" name="isPremium" checked={formData.isPremium} onChange={handleChange} className="w-5 h-5 accent-black" />
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Premium Document</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex gap-2">
                                                    <ToolbarBtn onClick={() => insertText('## ', '')}>H2</ToolbarBtn>
                                                    <ToolbarBtn onClick={() => insertText('### ', '')}>H3</ToolbarBtn>
                                                    <div className="w-px bg-gray-100 h-6 mx-2"></div>
                                                    <ToolbarBtn onClick={() => insertText('<a id="', '"></a>')}>Anchor</ToolbarBtn>
                                                </div>
                                                <button onClick={handleGenerateAI} disabled={aiGenerating} className="px-4 py-2 bg-black text-white rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 hover:opacity-80 disabled:opacity-50">
                                                    {aiGenerating ? 'AI ASSIST...' : '✨ Magic Write'}
                                                </button>
                                            </div>
                                            <textarea
                                                id="markdown-editor"
                                                name="content"
                                                value={formData.content}
                                                onChange={handleChange}
                                                className="w-full min-h-[700px] p-10 bg-gray-50 border border-gray-100 rounded-[2.5rem] outline-none focus:bg-white focus:border-black transition-all font-mono text-sm leading-relaxed"
                                                placeholder="Write documentation here..."
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'seo' && (
                                    <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                        <div className="p-10 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                                            <h2 className="text-2xl font-bold text-black tracking-tight mb-2">Search Optimization</h2>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Metadata settings for technical guides</p>
                                        </div>
                                        <FormGroup label="SEO Page Title">
                                            <input name="seoTitle" value={formData.seoTitle} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm" />
                                        </FormGroup>
                                        <FormGroup label="Search Description">
                                            <textarea name="seoDescription" value={formData.seoDescription} onChange={handleChange} rows={6} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-medium text-sm" />
                                        </FormGroup>
                                    </div>
                                )}

                                {activeTab === 'help' && (
                                    <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                        <div className="p-10 bg-black text-white rounded-[2.5rem] shadow-xl shadow-black/10">
                                            <h2 className="text-2xl font-bold tracking-tight mb-4">Navigation Guide</h2>
                                            <p className="opacity-60 leading-relaxed font-medium">Your documentation uses an automated system to generate sidebars.</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100">
                                                <p className="text-[10px] font-bold text-black uppercase tracking-widest mb-4">Tip 01</p>
                                                <h3 className="font-bold mb-2">H2/H3 Headers</h3>
                                                <p className="text-xs text-gray-500 leading-relaxed">Headers are automatically used as section links.</p>
                                            </div>
                                            <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100">
                                                <p className="text-[10px] font-bold text-black uppercase tracking-widest mb-4">Tip 02</p>
                                                <h3 className="font-bold mb-2">Manual Anchors</h3>
                                                <p className="text-xs text-gray-500 leading-relaxed">Use the Anchor tool to insert manual section markers anywhere.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Live Preview Console */}
                    {(previewMode === 'split' || previewMode === 'preview') && (
                        <div className={`${previewMode === 'split' ? 'w-1/2' : 'w-full'} bg-[#F8F9FA] overflow-y-auto p-12 md:p-20`}>
                            <div className="max-w-3xl mx-auto flex gap-12">
                                <div className="hidden xl:block w-52 shrink-0 space-y-6">
                                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest ml-4">Section List</p>
                                    <div className="space-y-4 border-l-2 border-gray-100">
                                        {tocHeaders.map((h, i) => (
                                            <div key={i} className={`text-[10px] font-bold uppercase tracking-widest pl-4 transition-all opacity-40 hover:opacity-100 cursor-pointer ${i === 0 ? 'opacity-100 border-l-2 border-black -ml-[2px]' : ''}`} style={{ marginLeft: `${(h.level - 2) * 10}px` }}>
                                                {h.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1 bg-white p-14 md:p-20 rounded-[3rem] shadow-sm border border-gray-100 min-h-screen">
                                    <div className="mb-14 pb-14 border-b border-gray-50">
                                        <span className="px-3 py-1 bg-black text-white text-[9px] font-bold rounded-full uppercase tracking-widest">{formData.section}</span>
                                        <h1 className="text-5xl font-bold text-black tracking-tighter mt-6 leading-tight">{formData.title || 'Untitled Document'}</h1>
                                    </div>
                                    <article className="prose prose-sm max-w-none text-gray-600 font-sans leading-relaxed">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
                                            {formData.content}
                                        </ReactMarkdown>
                                    </article>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const FormGroup = ({ label, children }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2">{label}</label>
        {children}
    </div>
);

const ToolbarBtn = ({ onClick, children }) => (
    <button type="button" onClick={onClick} className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-[9px] font-bold text-gray-400 hover:text-black hover:border-black transition-all uppercase tracking-widest">
        {children}
    </button>
);

export default DocEdit;
