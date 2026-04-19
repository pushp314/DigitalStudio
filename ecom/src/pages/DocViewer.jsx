import { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import docService from '../services/docService';
import { normalizeDoc } from '../utils/normalizers';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Sparkles, Sun, Moon, Database, Download, Send, X, Terminal, FileText } from 'lucide-react';
import aiService from '../services/aiService';

const DocViewer = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const { info } = useToast();
    const navigate = useNavigate();
    
    const { data: rawDoc, isLoading: loading } = useQuery({
        queryKey: ['doc', id],
        queryFn: () => docService.getById(id),
    });

    const doc = rawDoc ? normalizeDoc(rawDoc) : null;

    const [readingProgress, setReadingProgress] = useState(0);
    const [activeId, setActiveId] = useState('');
    const [theme, setTheme] = useState('light'); // light, dark, midnight
    const [isAiOpen, setIsAiOpen] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatId, setChatId] = useState(`chat_${Math.random().toString(36).substring(7)}_${Date.now()}`);
    const [copySuccess, setCopySuccess] = useState(null);

    // Auto-generate TOC from content if not provided or to ensure it matches slugs
    const autoToc = useMemo(() => {
        if (!doc?.content) return [];
        const lines = doc.content.split('\n');
        const headers = [];
        lines.forEach(line => {
            const match = line.match(/^(#{1,3})\s+(.+)$/);
            if (match) {
                const level = match[1].length;
                const title = match[2].trim();
                // Simple slugify matching rehype-slug
                const slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                headers.push({ id: slug, title, level });
            }
        });
        return headers;
    }, [doc?.content]);

    const toc = useMemo(() => {
        return (doc?.tableOfContents && doc.tableOfContents.length > 0) ? doc.tableOfContents : autoToc;
    }, [doc?.tableOfContents, autoToc]);

    const handleScroll = useCallback(() => {
        if (typeof document === 'undefined') return;
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        setReadingProgress(progress);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // Intersection Observer for ScrollSpy
    useEffect(() => {
        if (!toc.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '-10% 0px -70% 0px', threshold: 0 }
        );

        const headingElements = toc.map(item => document.getElementById(item.id)).filter(Boolean);
        headingElements.forEach(el => observer.observe(el));

        return () => {
            headingElements.forEach(el => observer.unobserve(el));
        };
    }, [toc, loading]);

    const handleProtectedAccess = () => {
        if (!user) {
            info('Please login to access protected docs.');
            navigate('/login');
            return;
        }
        navigate('/pricing');
    };

    const toggleTheme = () => {
        const themes = ['light', 'dark', 'midnight'];
        const next = themes[(themes.indexOf(theme) + 1) % themes.length];
        setTheme(next);
    };

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        setCopySuccess(code);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || isChatLoading) return;

        const userMsg = { role: 'user', content: chatInput };
        const aiMsgPlaceHolder = { role: 'ai', content: '' };
        
        setChatHistory(prev => [...prev, userMsg, aiMsgPlaceHolder]);
        const currentMsgIndex = chatHistory.length + 1; // Index of the AI message we just added
        
        setChatInput('');
        setIsChatLoading(true);

        try {
            const response = await aiService.askDocAIStream(doc.content, chatInput, chatId);
            
            if (!response.ok) throw new Error('Network response was not ok');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                // SSE format is "data: content\n\n"
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const content = line.replace('data: ', '');
                        fullContent += content;
                        
                        // Update the last message in history
                        setChatHistory(prev => {
                            const newHistory = [...prev];
                            newHistory[newHistory.length - 1] = { role: 'ai', content: fullContent };
                            return newHistory;
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Chat Stream Error:", err);
            setChatHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1] = { 
                    role: 'ai', 
                    content: "I'm sorry, I'm having trouble connecting to my matrix right now. Please try again later." 
                };
                return newHistory;
            });
        } finally {
            setIsChatLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const themeConfig = {
        light: {
            bg: 'bg-[#F5F5F7]',
            card: 'bg-white',
            text: 'text-gray-600',
            heading: 'text-black',
            sidebar: 'bg-white',
            border: 'border-gray-100'
        },
        dark: {
            bg: 'bg-[#0F172A]',
            card: 'bg-[#1E293B]',
            text: 'text-slate-400',
            heading: 'text-slate-100',
            sidebar: 'bg-[#1E293B]',
            border: 'border-slate-800'
        },
        midnight: {
            bg: 'bg-[#000000]',
            card: 'bg-[#0A0A0A]',
            text: 'text-gray-400',
            heading: 'text-gray-100',
            sidebar: 'bg-[#0A0A0A]',
            border: 'border-white/5'
        }
    };

    const currentTheme = themeConfig[theme];

    const CodeBlock = ({ children, inline, ...props }) => {
        const code = String(children).replace(/\n$/, '');
        if (inline) {
            return <code className={`bg-gray-100 px-2 py-0.5 rounded-md text-primary font-black text-sm`} {...props}>{children}</code>;
        }

        return (
            <div className="relative group/code my-10 overflow-hidden rounded-[1.5rem] border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 bg-[#1C1C1E] border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-gray-500" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Technical Snippet</span>
                    </div>
                    <button 
                        onClick={() => handleCopy(code)}
                        className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-lg"
                    >
                        {copySuccess === code ? <span className="text-[10px] font-black text-green-400 uppercase tracking-widest px-2">Copied!</span> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
                <pre className="bg-[#1C1C1E] text-gray-300 p-8 overflow-x-auto font-mono text-sm leading-relaxed" {...props}>
                    {children}
                </pre>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!doc) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7]">
                <h2 className="text-3xl font-bold mb-4">Doc not found</h2>
                <Link to="/docs" className="text-blue-600 underline">Back to docs</Link>
            </div>
        );
    }

    const scrollToSection = (e, sectionId) => {
        e.preventDefault();
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 120;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            window.history.pushState(null, null, `#${sectionId}`);
            setActiveId(sectionId);
        }
    };

    const hasToc = toc.length > 0;
    const showLockCta = doc.isPremium && doc.locked && user?.subscriptionPlan !== 'pro';

    return (
        <div className={`min-h-screen ${currentTheme.bg} py-24 md:py-32 font-sans relative transition-colors duration-700`}>
            {/* Reading Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-gray-100/10">
                <div 
                    className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    style={{ width: `${readingProgress}%` }}
                ></div>
            </div>

            {/* Floating Action Menu */}
            <div className="fixed bottom-12 right-12 z-50 flex flex-col gap-4">
                <AnimatePresence>
                    {isAiOpen && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="absolute bottom-20 right-0 w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col pointer-events-auto"
                        >
                            <div className="p-6 bg-primary text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-6 h-6" />
                                    <h3 className="font-black uppercase text-xs tracking-widest">Doc Assistant</h3>
                                </div>
                                <button onClick={() => setIsAiOpen(false)} className="hover:opacity-70">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 text-sm font-medium text-gray-600">
                                    Hello! I'm your AI sidekick for DigitalStudio. Ask me anything about <span className="text-primary font-black">"{doc.title}"</span>.
                                </div>
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                                            msg.role === 'user' 
                                            ? 'bg-primary text-white font-bold' 
                                            : 'bg-white border border-gray-100 text-gray-600 font-medium'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isChatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-gray-100 p-4 rounded-2xl flex gap-2">
                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <form onSubmit={handleChatSubmit} className="p-6 bg-white border-t border-gray-100 flex gap-3">
                                <input 
                                    type="text" 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Type your question..."
                                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                <button type="submit" className="bg-primary text-white p-3 rounded-xl hover:scale-105 transition-all shadow-lg shadow-primary/20">
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-col gap-3">
                    {user?.subscriptionPlan === 'pro' && (
                        <button 
                            onClick={handlePrint}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl border bg-white border-gray-100 text-gray-600 hover:bg-gray-50`}
                            title="Export to PDF"
                        >
                            <Download className="w-6 h-6" />
                        </button>
                    )}
                    <button 
                        onClick={toggleTheme}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl border ${theme === 'midnight' ? 'bg-amber-400 text-black border-amber-300' : theme === 'dark' ? 'bg-white/10 text-white border-white/10' : 'bg-slate-900 text-white border-slate-800'}`}
                        title="Change Theme"
                    >
                        {theme === 'light' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                    </button>
                    <button 
                        onClick={() => setIsAiOpen(!isAiOpen)}
                        className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <Sparkles className="w-8 h-8 relative z-10" />
                    </button>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12">
                <div className="max-w-4xl mb-12">
                    <Link to="/docs" className="text-primary font-black text-xs uppercase tracking-widest hover:opacity-70 mb-6 inline-flex items-center gap-2">
                        <Terminal className="w-4 h-4" />
                        Technical Manuals
                    </Link>
                    <h1 className={`text-4xl md:text-6xl font-black ${currentTheme.heading} mb-6 tracking-tight leading-tight`}>{doc.title}</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        {doc.category && (
                            <span className={`${currentTheme.card} border ${currentTheme.border} ${currentTheme.heading} px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm`}>
                                {doc.category}
                            </span>
                        )}
                        {doc.isPremium && (
                            <div className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${doc.locked
                                ? 'bg-black text-white'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                {doc.locked ? '🔒 Pro Membership' : '✅ Verified Access'}
                            </div>
                        )}
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">EST READ: {Math.ceil(doc.content?.length / 1000) || 1} MIN</span>
                    </div>
                </div>

                <div className={`flex flex-col ${hasToc ? 'lg:flex-row' : ''} gap-12`}>
                    {hasToc && (
                        <aside className="lg:w-72 shrink-0">
                            <div className={`sticky top-40 ${currentTheme.sidebar} border ${currentTheme.border} p-8 rounded-[2.5rem] shadow-sm transition-colors duration-700`}>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">Navigation Guide</h3>
                                <nav className="space-y-4">
                                    {toc.map((item) => (
                                        <div key={item.id} className="relative group">
                                            <a 
                                                href={`#${item.id}`} 
                                                onClick={(e) => scrollToSection(e, item.id)}
                                                className={`text-sm font-black transition-all duration-300 block py-1 pl-4 border-l-2 ${
                                                    activeId === item.id 
                                                    ? 'text-primary border-primary translate-x-1' 
                                                    : `${currentTheme.text} ${currentTheme.border} hover:text-primary hover:border-gray-300`
                                                }`}
                                                style={{ paddingLeft: `${(item.level || 1) * 0.5 + 0.5}rem` }}
                                            >
                                                {item.title}
                                            </a>
                                            {activeId === item.id && (
                                                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,1)]"></div>
                                            )}
                                        </div>
                                    ))}
                                </nav>
                                <div className="mt-10 pt-10 border-t border-gray-50/10">
                                    <button 
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                        className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                                        Back to Top
                                    </button>
                                </div>
                            </div>
                        </aside>
                    )}

                    <div className="flex-grow min-w-0">
                        <div className={`${currentTheme.card} rounded-[3rem] p-8 md:p-16 lg:p-20 border ${currentTheme.border} shadow-xl shadow-gray-200/10 relative overflow-hidden transition-colors duration-700`}>
                            <article className={`markdown-content prose prose-zinc max-w-none transition-all duration-700 ${showLockCta ? 'max-h-[500px] overflow-hidden mask-blur-bottom' : ''}`}>
                                <style>{`
                                    .mask-blur-bottom {
                                        mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
                                        -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
                                    }
                                `}</style>
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeSlug]}
                                    components={{
                                        h1: ({node, ...props}) => <h1 className={`text-4xl font-black ${currentTheme.heading} mb-8 mt-12 first:mt-0 tracking-tight`} {...props} />,
                                        h2: ({node, ...props}) => <h2 className={`text-2xl font-black ${currentTheme.heading} mb-6 mt-12 border-b border-gray-100/10 pb-4 tracking-tight`} {...props} />,
                                        h3: ({node, ...props}) => <h3 className={`text-xl font-black ${currentTheme.heading} mb-4 mt-10 tracking-tight`} {...props} />,
                                        p: ({node, ...props}) => <p className={`${currentTheme.text} leading-relaxed mb-6 font-medium text-lg`} {...props} />,
                                        ul: ({node, ...props}) => <ul className={`space-y-3 mb-8 ml-6 list-disc ${currentTheme.text}`} {...props} />,
                                        ol: ({node, ...props}) => <ol className={`space-y-3 mb-8 ml-6 list-decimal ${currentTheme.text}`} {...props} />,
                                        li: ({node, ...props}) => <li className="pl-2 font-medium" {...props} />,
                                        code: CodeBlock
                                    }}
                                >
                                    {doc.content}
                                </ReactMarkdown>
                            </article>

                            {showLockCta && (
                                <div className="mt-20 p-12 bg-black rounded-[3rem] text-white text-center relative overflow-hidden group border border-white/10 shadow-2xl">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary opacity-20 blur-[130px] -translate-y-1/2 translate-x-1/2 group-hover:opacity-30 transition-opacity"></div>
                                    <div className="relative z-10">
                                        <div className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-white/10">
                                            <Database className="w-10 h-10 text-primary" />
                                        </div>
                                        <h3 className="text-4xl font-black mb-6 tracking-tight">Access Pro Technical Documentation</h3>
                                        <p className="text-xl mb-10 text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
                                            This guide is reserved for our Pro community members. Unlock this guide and hundreds of others, plus premium templates and exclusive Discord access.
                                        </p>
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                            <button
                                                onClick={handleProtectedAccess}
                                                className="w-full sm:w-auto bg-primary text-white px-12 py-5 rounded-2xl font-black hover:bg-white hover:text-black transition-all duration-500 shadow-2xl shadow-primary/30 active:scale-95"
                                            >
                                                Start Pro Trial
                                            </button>
                                            <Link
                                                to="/pricing"
                                                className="w-full sm:w-auto text-gray-400 hover:text-white font-black text-sm uppercase tracking-widest transition-colors flex items-center gap-2 group/btn"
                                            >
                                                Membership Plans 
                                                <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .fixed, aside, footer, nav, button { display: none !important; }
                    .max-w-[1400px] { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
                    .py-24 { padding-top: 0 !important; }
                    .rounded-[3rem] { border-radius: 0 !important; border: none !important; box-shadow: none !important; }
                    .bg-[#F5F5F7], .bg-[#0F172A], .bg-[#000000] { background: white !important; }
                    .text-slate-400, .text-gray-400 { color: #374151 !important; }
                    .text-slate-100, .text-gray-100 { color: black !important; }
                    pre { background: #f3f4f6 !important; color: black !important; border: 1px solid #e5e7eb !important; }
                }
            `}} />
        </div>
    );
};

export default DocViewer;
