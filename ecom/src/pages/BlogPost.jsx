import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import blogService from '../services/blogService';
import Meta from '../components/common/Meta';
import { absoluteUrl, blogPostingSchema, breadcrumbSchema } from '../utils/seo';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
    ChevronLeft, 
    Calendar, 
    User, 
    Share2, 
    Bookmark, 
    Clock,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { normalizePost } from '../utils/normalizers';

const BlogPost = () => {
    const { slug } = useParams();
    
    const { data: rawPost, isLoading, error } = useQuery({
        queryKey: ['blog', slug],
        queryFn: () => blogService.get(slug),
    });

    const post = React.useMemo(() => 
        rawPost ? normalizePost(rawPost) : null, 
    [rawPost]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Article...</p>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return <Navigate to="/blog" replace />;
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] pb-32">
            <Meta
                title={post.title}
                description={post.content.substring(0, 160)}
                canonical={absoluteUrl(`/blog/${post.slug}`)}
                type="article"
                jsonLd={[
                    blogPostingSchema({
                        title: post.title,
                        description: post.content.substring(0, 160),
                        publishedAt: post.publishedAt,
                        author: post.author?.name || 'Administrator',
                        slug: post.slug
                    }),
                    breadcrumbSchema([
                        { name: 'Home', path: '/' },
                        { name: 'Blog', path: '/blog' },
                        { name: post.title, path: `/blog/${post.slug}` },
                    ]),
                ]}
            />

            {/* Premium Article Header */}
            <header className="relative pt-12 pb-10 md:pt-32 md:pb-20 overflow-hidden bg-white px-4 sm:px-6">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#eff6ff_0%,transparent_70%)]"></div>
                
                <div className="ds-shell relative z-10">
                    <Link to="/blog" className="inline-flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors mb-8 sm:mb-12 group">
                        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Playbooks
                    </Link>
                    
                    <div className="max-w-4xl space-y-6 sm:space-y-8">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                {post.category || 'Guide'}
                            </span>
                            <div className="flex items-center gap-3 sm:gap-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(post.publishedAt).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1.5"><Clock size={12} /> {post.readingTime}m read</span>
                            </div>
                        </div>

                        <h1 className="text-clamp-6xl font-black tracking-tighter text-slate-900 leading-[1] sm:leading-[1.1]">
                            {post.title}
                        </h1>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-400 uppercase">
                                    {post.author?.name?.charAt(0) || 'A'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-900 leading-tight">{post.author?.name || 'Administrator'}</span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Contributor</span>
                                </div>
                            </div>

                            <div className="hidden sm:block h-8 w-px bg-slate-100"></div>

                            <div className="flex items-center gap-2">
                                <button className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all"><Share2 size={16} /></button>
                                <button className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all"><Bookmark size={16} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="ds-shell mt-8 sm:mt-12 grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-12 sm:gap-16 px-4 sm:px-6">
                {/* Main Content Area */}
                <main className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-16 border border-slate-100 shadow-sm overflow-hidden">
                    <article className="prose prose-slate prose-sm sm:prose-lg max-w-none 
                        prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900
                        prose-p:text-slate-600 prose-p:leading-relaxed prose-p:font-medium
                        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-slate-900
                        prose-img:rounded-[1.5rem] sm:prose-img:rounded-[2rem] prose-img:shadow-2xl">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {post.content}
                        </ReactMarkdown>
                    </article>

                    <div className="mt-12 sm:mt-20 pt-10 sm:pt-12 border-t border-slate-100">
                        <div className="bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] group-hover:scale-110 transition-transform duration-700"></div>
                            
                            <div className="relative z-10 space-y-6">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                                    <ArrowRight size={24} />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">Turn this guide into reality.</h3>
                                <p className="text-sm text-slate-400 max-w-lg leading-relaxed font-medium">
                                    Our experts can help you implement these playbooks or customize any of our templates to fit your vision.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                    <Link to="/custom-request" className="bg-blue-600 text-white px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">
                                        Request Custom Build
                                    </Link>
                                    <Link to="/assets" className="bg-white/10 text-white px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-white/20 transition-all backdrop-blur-md">
                                        Browse Products
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Sidebar */}
                <aside className="space-y-8 sm:space-y-10">
                    <div className="sticky top-28 space-y-8">
                        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-sm">
                            <h4 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Playbook Context</h4>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <p className="text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-widest">Strategic Analysis</p>
                                    <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-medium">
                                        Focuses on high-level strategy, industry playbooks, and business insights.
                                    </p>
                                </div>
                                <div className="h-px bg-slate-50"></div>
                                <div className="space-y-2">
                                    <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Need technical help?</p>
                                    <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-medium">
                                        Check the <Link to="/docs" className="text-blue-600 font-bold hover:underline">Documentation</Link> for technical manuals.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-600 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 text-white shadow-2xl shadow-blue-500/20">
                            <h4 className="text-lg font-black tracking-tight mb-4 leading-tight">Join 2,500+ builders scaling with BizCode.</h4>
                            <p className="text-xs text-blue-100 leading-relaxed mb-6 font-medium">Get exclusive templates delivered to your inbox.</p>
                            <input 
                                type="email" 
                                placeholder="name@company.com" 
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-xs text-white placeholder:text-blue-200 outline-none focus:bg-white/20 transition-all mb-3"
                            />
                            <button className="w-full bg-white text-blue-600 font-black py-3.5 rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all">Subscribe Now</button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default BlogPost;
