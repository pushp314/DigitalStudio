import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProBanner from '../components/ProBanner';
import CarouselStack from '../components/CarouselStack';
import Meta from '../components/common/Meta';
import docService from '../services/docService';
import { useToast } from '../context/ToastContext';
import { normalizeDoc } from '../utils/normalizers';
import ConfigContext from '../context/ConfigContext';
import { LayoutGrid, List, Search as SearchIcon, FileText, Lock, Crown, Zap, ShieldCheck, Download, Users, ChevronRight, BookOpen } from 'lucide-react';
import { absoluteUrl, breadcrumbSchema } from '../utils/seo';

const Docs = () => {
    const { config } = useContext(ConfigContext);
    const { error } = useToast();
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list'); 
    const navigate = useNavigate();

    useEffect(() => {
        if (config && config.features && config.features.docs === false) {
            navigate('/');
        }
    }, [config, navigate]);

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const data = await docService.getAll();
                setDocs(Array.isArray(data) ? data.map(normalizeDoc) : []);
            } catch (err) {
                error(err.message || 'Failed to load docs.');
            } finally {
                setLoading(false);
            }
        };

        fetchDocs();
    }, [error]);

    const categories = useMemo(() => ['all', ...new Set(docs.map((doc) => doc.category).filter(Boolean))], [docs]);

    const filteredDocs = useMemo(() => {
        return docs.filter((doc) => {
            const matchesFilter = filter === 'all' || doc.category === filter;
            const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
                || doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
                || doc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesFilter && matchesSearch;
        });
    }, [docs, filter, searchQuery]);

    const membershipPerks = [
        { icon: <Crown size={14} />, label: "Premium Product Guides" },
        { icon: <ShieldCheck size={14} />, label: "Verified Setup Notes" },
        { icon: <Zap size={14} />, label: "Implementation Guides" },
        { icon: <Download size={14} />, label: "Product Delivery Help" },
        { icon: <Users size={14} />, label: "Member Support" },
        { icon: <Lock size={14} />, label: "Premium Documentation" }
    ];

    // Double for infinite scroll
    const scrollingPerks = [...membershipPerks, ...membershipPerks, ...membershipPerks];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] px-6 pb-40 pt-16 antialiased font-sans transition-colors duration-500">
            <Meta
                title="Technical Guides for SaaS Templates and Deployment"
                description="Read technical guides for setup, deployment, SaaS templates, dashboard builds, fullstack projects, and implementation support."
                canonical={absoluteUrl('/docs')}
                jsonLd={[breadcrumbSchema([
                    { name: 'Home', path: '/' },
                    { name: 'Docs', path: '/docs' },
                ])]}
            />
            {/* 3D Visual Asset Highlights - THE HOOK */}
            {config?.carouselStack?.length > 0 && (
                <div className="mb-24">
                    <div className="text-center mb-10">
                        <span className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg shadow-blue-600/20">Featured Products</span>
                    </div>
                    <CarouselStack items={config.carouselStack} />
                </div>
            )}

            <style>
                {`
                @keyframes perkScroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.33%); }
                }
                .animate-perks {
                    animation: perkScroll 25s linear infinite;
                }
                `}
            </style>

            <div className="max-w-4xl mx-auto">
                {/* Header Module - THE CONTEXT */}
                <div className="mb-12 border-b border-slate-200 pb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black tracking-tight text-slate-900 md:text-6xl uppercase leading-none">Technical Guides</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl inline-block">Setup, deployment, and product implementation</p>
                        
                        {/* Clarification Node */}
                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <FileText size={12} className="text-blue-600" />
                                Technical Manuals
                            </div>
                            <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                            <Link to="/blog" className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors group">
                                <BookOpen size={12} className="group-hover:text-blue-600" />
                                Strategic Blog
                                <ChevronRight size={10} />
                            </Link>
                        </div>
                    </div>
                    
                    <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Editorial View"
                        >
                            <List size={20} />
                        </button>
                    </div>
                </div>

                {/* Tactical Search & Filter */}
                <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
                     <div className="relative flex-1 w-full">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400">
                            <SearchIcon size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Find documentation..."
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            className="w-full bg-transparent border-none rounded-none pl-8 pr-4 py-2 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setFilter(category)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    filter === category 
                                    ? 'bg-slate-900 text-white shadow-lg' 
                                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                {category === 'all' ? 'All' : category}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredDocs.length === 0 ? (
                    <div className="py-24 text-center border-t border-slate-200">
                        <FileText size={48} className="mx-auto text-slate-200 mb-6" />
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">No guides found</h2>
                        <p className="mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Try another product, stack, or setup topic.</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' 
                        ? "grid gap-12 md:grid-cols-2" 
                        : "space-y-12"
                    }>
                        {filteredDocs.map((doc) => (
                            <Link 
                                key={doc.id} 
                                to={`/docs/${doc.id}`} 
                                className="group block"
                            >
                                {viewMode === 'grid' ? (
                                    <div className="space-y-4">
                                        <div className="aspect-[16/10] bg-white border border-slate-200 rounded-3xl relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                                            {doc.image ? (
                                                <img src={doc.image} alt={doc.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                            ) : (
                                                <div className="flex w-full h-full items-center justify-center text-slate-100">
                                                     <FileText size={48} strokeWidth={1} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2 px-2">
                                            <h2 className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors uppercase">{doc.title}</h2>
                                            <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">{doc.description || doc.previewContent}</p>
                                        </div>
                                    </div>
                                ) : (
                                    /* THE EDITORIAL LIST VIEW */
                                    <div className="flex items-start justify-between gap-12 border-b border-slate-200 pb-12 transition-all group-hover:border-slate-900/10">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">{doc.category || 'Documentation'}</span>
                                                {doc.isPremium && <Lock size={12} className="text-slate-400" />}
                                            </div>
                                            <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-snug group-hover:text-blue-600 transition-colors uppercase">
                                                {doc.title}
                                            </h2>
                                            <p className="text-base text-slate-500 leading-relaxed line-clamp-3 font-medium">
                                                {doc.description || doc.previewContent}
                                            </p>
                                            <div className="flex items-center gap-4 pt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                <span className={`px-2 py-0.5 rounded font-black ${doc.isPremium ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400 bg-slate-200/50'}`}>
                                                    {doc.isPremium ? 'Premium' : 'Public'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="hidden sm:block w-32 h-32 md:w-40 md:h-28 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden shrink-0 self-center group-hover:shadow-md transition-shadow">
                                            {doc.image ? (
                                                <img src={doc.image} alt={doc.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            ) : (
                                                <div className="flex w-full h-full items-center justify-center text-slate-100">
                                                     <FileText size={32} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                )}

                {/* Sub-Header Integration Node - Moved to bottom for value-first flow */}
                <div className="mt-24">
                    <ProBanner className="shadow-2xl rounded-[3rem] overflow-hidden border border-white/10" />
                </div>
            </div>

            {/* Persistent Infinite Membership Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-white/10 shadow-2xl backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
                        <div className="flex-1 overflow-hidden relative mr-12 hidden md:block">
                            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-900 to-transparent z-10" />
                            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-900 to-transparent z-10" />
                            <div className="flex whitespace-nowrap animate-perks">
                                {scrollingPerks.map((perk, idx) => (
                                    <div key={idx} className="flex items-center gap-2 mx-10 text-[10px] font-bold text-white uppercase tracking-[0.2em] opacity-60">
                                        <span className="text-blue-500">{perk.icon}</span>
                                        {perk.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-between md:justify-end">
                            <div className="flex flex-col md:text-right">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Unlock Pro guides and priority help</p>
                                <p className="text-[9px] text-blue-400 font-bold uppercase tracking-[0.2em] mt-1">Premium docs, community chat, and support benefits</p>
                            </div>
                            <Link 
                                to="/pricing" 
                                className="px-6 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                            >
                                Compare plans
                            </Link>
                        </div>
                    </div>
            </div>
        </div>
    );
};

export default Docs;
