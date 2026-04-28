import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import blogService from '../services/blogService';
import Meta from '../components/common/Meta';
import { absoluteUrl, breadcrumbSchema } from '../utils/seo';
import { 
    BookOpen, 
    Clock,
    LayoutGrid,
    List,
    Search as SearchIcon,
    FileText,
    ChevronRight as ChevronRightIcon,
    ArrowUpRight,
    Calendar,
    ArrowRight,
    User,
    BookText,
    Hash
} from 'lucide-react';
import { motion } from 'framer-motion';
import { normalizePost } from '../utils/normalizers';

const Blog = () => {
    const { data: rawPosts, isLoading } = useQuery({
        queryKey: ['blogs'],
        queryFn: () => blogService.list(),
    });

    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list');

    const posts = useMemo(() => 
        (rawPosts || []).map(normalizePost), 
    [rawPosts]);

    const categories = useMemo(() => ['all', ...new Set(posts.map((post) => post.category).filter(Boolean))], [posts]);

    const filteredPosts = useMemo(() => {
        return posts.filter((post) => {
            const matchesFilter = filter === 'all' || post.category === filter;
            const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase())
                || post.content?.toLowerCase().includes(searchQuery.toLowerCase())
                || (post.author?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
                || (post.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesFilter && matchesSearch;
        });
    }, [posts, filter, searchQuery]);

    return (
        <div className="min-h-screen bg-[#F5F5F7]">
            <Meta
                title="BizCode Blog | SaaS Building Guides & Developer Playbooks"
                description="Expert guides on SaaS templates, fullstack deployment, and developer tools. Learn how to launch and scale your products with BizCode."
                canonical={absoluteUrl('/blog')}
                jsonLd={[breadcrumbSchema([
                    { name: 'Home', path: '/' },
                    { name: 'Blog', path: '/blog' },
                ])]}
            />

            {/* Premium Hero Section */}
            <section className="relative overflow-hidden pt-12 pb-12 md:pt-32 md:pb-24">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-blue-50 rounded-full blur-[120px] opacity-50"></div>
                
                <div className="ds-shell relative z-10 px-4 sm:px-6">
                    <div className="max-w-3xl space-y-4 sm:space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]"
                        >
                            <BookOpen size={12} />
                            The Playbook
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-clamp-6xl font-black tracking-tighter text-slate-900 leading-[0.95] sm:leading-[0.9]"
                        >
                            Master the art of <span className="text-blue-600">SaaS building</span>.
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-sm sm:text-lg text-slate-500 leading-relaxed max-w-2xl font-medium"
                        >
                            Practical guides, industry playbooks, and developer-first strategies for founders building ready-to-scale software.
                        </motion.p>
                    </div>

                    {/* Blog vs Docs - High Clarity Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        <div className="bg-white/60 backdrop-blur-sm p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white shadow-sm hover:shadow-xl transition-all group">
                            <div className="flex items-start justify-between">
                                <div className="space-y-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                        <BookText size={20} className="sm:w-6 sm:h-6" />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">The Documentation</h3>
                                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                                        The <b>Technical Manual</b>. Integration guides, API references, and deployment blueprints.
                                    </p>
                                    <Link to="/docs" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:gap-3 transition-all pt-2">
                                        Consult Manuals <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-slate-800 group">
                            <div className="flex items-start justify-between">
                                <div className="space-y-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white group-hover:bg-blue-600 transition-all duration-500">
                                        <BookOpen size={20} className="sm:w-6 sm:h-6" />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">The Strategic Playbook</h3>
                                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                                        The <b>Building Strategy</b>. Industry trends, high-level SaaS architecture, and growth playbooks.
                                    </p>
                                    <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-blue-400">
                                        Active Section <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Articles Grid */}
            <section className="pb-24 sm:pb-32 px-4 sm:px-6">
                <div className="ds-shell">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 border-b border-slate-200 pb-10">
                        <div className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-4">
                                Latest Publications
                                <div className="h-px w-12 sm:w-24 bg-slate-200"></div>
                            </h2>
                            <div className="flex items-center gap-4 pt-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <BookOpen size={12} className="text-blue-600" />
                                    Strategic Playbook
                                </div>
                                <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                <Link to="/docs" className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors group">
                                    <FileText size={12} className="group-hover:text-blue-600" />
                                    Technical Docs
                                    <ChevronRightIcon size={10} />
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
                                placeholder="Search playbooks..."
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

                    <div className={viewMode === 'grid' 
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" 
                        : "space-y-12"
                    }>
                        {isLoading ? (
                            [1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-white rounded-[2rem] aspect-[4/5] animate-pulse"></div>
                            ))
                        ) : filteredPosts?.length === 0 ? (
                            <div className="col-span-full py-16 sm:py-20 text-center bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100">
                                <div className="max-w-sm mx-auto space-y-4 px-4">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto">
                                        <BookOpen size={28} className="sm:w-8 sm:h-8" />
                                    </div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-900">No playbooks found</h3>
                                    <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">Try another category, search term, or check back later.</p>
                                </div>
                            </div>
                        ) : filteredPosts?.map((post, idx) => (
                            viewMode === 'grid' ? (
                                <motion.article 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={post.slug} 
                                    className="group bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 p-6 sm:p-8 flex flex-col hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                                            {post.category || 'Guide'}
                                        </span>
                                        <span className="flex items-center gap-2 sm:gap-3">
                                            <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-300">
                                                <Calendar size={10} />
                                                {new Date(post.publishedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                            <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                                <Clock size={10} />
                                                {post.readingTime}m read
                                            </span>
                                        </span>
                                    </div>

                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors tracking-tight">
                                        <Link to={`/blog/${post.slug}`}>
                                            {post.title}
                                        </Link>
                                    </h2>

                                    <div className="mt-4 text-[13px] sm:text-sm text-slate-500 line-clamp-3 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: post.content.substring(0, 120) + '...' }}></div>

                                    {post.tags?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {post.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <Hash size={8} /> {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-auto pt-8 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400">
                                                {post.author?.name ? post.author.name.charAt(0).toUpperCase() : <User size={14} />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-900 leading-tight">{post.author?.name || 'Administrator'}</span>
                                                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Contributor</span>
                                            </div>
                                        </div>

                                        <Link to={`/blog/${post.slug}`} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10 group-hover:shadow-blue-500/20">
                                            <ArrowUpRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                                        </Link>
                                    </div>
                                </motion.article>
                            ) : (
                                /* THE EDITORIAL LIST VIEW */
                                <motion.article 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={post.slug} 
                                    className="group flex flex-col md:flex-row items-start justify-between gap-8 sm:gap-12 border-b border-slate-200 pb-12 transition-all hover:border-slate-300"
                                >
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">{post.category || 'Guide'}</span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{post.readingTime}m read</span>
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors tracking-tight">
                                            <Link to={`/blog/${post.slug}`}>
                                                {post.title}
                                            </Link>
                                        </h2>
                                        <div className="text-sm sm:text-base text-slate-500 leading-relaxed line-clamp-3 font-medium" dangerouslySetInnerHTML={{ __html: post.content.substring(0, 180) + '...' }}></div>
                                        
                                        {post.tags?.length > 0 && (
                                            <div className="flex flex-wrap gap-4 pt-2">
                                                {post.tags.map(tag => (
                                                    <span key={tag} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors cursor-default">
                                                        <Hash size={10} className="text-slate-300" /> {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-6 pt-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200 overflow-hidden">
                                                    {post.author?.avatar ? <img src={post.author.avatar} alt="" className="w-full h-full object-cover" /> : (post.author?.name ? post.author.name.charAt(0).toUpperCase() : <User size={14} />)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">{post.author?.name || 'Administrator'}</span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-1">SaaS Strategist</span>
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                                                {new Date(post.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <Link to={`/blog/${post.slug}`} className="hidden md:block w-48 h-32 bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden shrink-0 self-center group-hover:shadow-xl group-hover:border-blue-100 transition-all duration-500">
                                        {post.image ? (
                                            <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        ) : (
                                            <div className="flex w-full h-full items-center justify-center text-slate-100 bg-slate-50">
                                                 <BookOpen size={32} />
                                            </div>
                                        )}
                                    </Link>
                                </motion.article>
                            )
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Blog;
