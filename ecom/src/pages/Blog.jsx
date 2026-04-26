import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import blogService from '../services/blogService';
import Meta from '../components/common/Meta';
import { absoluteUrl, breadcrumbSchema } from '../utils/seo';
import { 
    BookOpen, 
    ChevronRight, 
    ArrowRight, 
    Calendar, 
    User,
    ArrowUpRight,
    Search,
    BookText
} from 'lucide-react';
import { motion } from 'framer-motion';

const Blog = () => {
    const { data: posts, isLoading } = useQuery({
        queryKey: ['blogs'],
        queryFn: () => blogService.list(),
    });

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
            <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-blue-50 rounded-full blur-[120px] opacity-50"></div>
                
                <div className="ds-shell relative z-10">
                    <div className="max-w-3xl space-y-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em]"
                        >
                            <BookOpen size={12} />
                            The Playbook
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900"
                        >
                            Master the art of <span className="text-blue-600">SaaS building</span>.
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-slate-500 leading-relaxed max-w-2xl"
                        >
                            Practical guides, industry playbooks, and developer-first strategies for founders building ready-to-scale software.
                        </motion.p>
                    </div>

                    {/* Blog vs Docs - High Clarity Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        <div className="bg-white/60 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white shadow-sm hover:shadow-xl transition-all group">
                            <div className="flex items-start justify-between">
                                <div className="space-y-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                        <BookText size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">The Documentation</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        Technical manuals, API references, and step-by-step setup guides for specific products and tools.
                                    </p>
                                    <Link to="/docs" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 hover:gap-3 transition-all pt-2">
                                        Explore Docs <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 group">
                            <div className="flex items-start justify-between">
                                <div className="space-y-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white group-hover:bg-blue-600 transition-all duration-500">
                                        <BookOpen size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">The Blog</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        Industry insights, building playbooks, and high-level strategy for SaaS growth and development.
                                    </p>
                                    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
                                        You are here <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Articles Grid */}
            <section className="pb-32">
                <div className="ds-shell">
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-4">
                            Latest Publications
                            <div className="h-px w-24 bg-slate-200"></div>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {isLoading ? (
                            [1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-white rounded-[2rem] aspect-[4/5] animate-pulse"></div>
                            ))
                        ) : posts?.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-slate-100">
                                <div className="max-w-sm mx-auto space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto">
                                        <BookOpen size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">Archives are currently empty</h3>
                                    <p className="text-sm text-slate-400">Our authors are busy drafting new playbooks. Check back shortly.</p>
                                </div>
                            </div>
                        ) : posts?.map((post, idx) => (
                            <motion.article 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={post.slug} 
                                className="group bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                                        {post.category || 'Guide'}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
                                        <Calendar size={12} />
                                        {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                    </span>
                                </div>

                                <h2 className="text-2xl font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                                    <Link to={`/blog/${post.slug}`}>
                                        {post.title}
                                    </Link>
                                </h2>

                                <div className="mt-4 text-sm text-slate-500 line-clamp-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content.substring(0, 150) + '...' }}></div>

                                <div className="mt-auto pt-8 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400">
                                            {post.author?.name?.charAt(0) || 'A'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-900">{post.author?.name || 'Administrator'}</span>
                                            <span className="text-[9px] text-slate-400 font-medium">Core Contributor</span>
                                        </div>
                                    </div>

                                    <Link to={`/blog/${post.slug}`} className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10 group-hover:shadow-blue-500/20">
                                        <ArrowUpRight size={18} />
                                    </Link>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Blog;
