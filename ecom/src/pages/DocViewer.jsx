import { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import AuthContext from '../context/AuthContext';
import ConfigContext from '../context/ConfigContext';
import { useToast } from '../context/ToastContext';
import docService from '../services/docService';
import { normalizeDoc } from '../utils/normalizers';
import aiService from '../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import Meta from '../components/common/Meta';
import { absoluteUrl, breadcrumbSchema } from '../utils/seo';
import { 
    Cpu, X, Trash2, Loader2, Lock, Sparkles, Terminal, 
    ChevronRight, ShieldCheck, Bot, Send, MessageCircle, Minimize2 
} from 'lucide-react';
const DocViewer = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const { config } = useContext(ConfigContext);
    const { info } = useToast();
    const navigate = useNavigate();

    const { data: rawDoc, isLoading } = useQuery({
        queryKey: ['doc', id],
        queryFn: () => docService.getById(id),
    });

    const doc = rawDoc ? normalizeDoc(rawDoc) : null;
    const [readingProgress, setReadingProgress] = useState(0);
    const [activeId, setActiveId] = useState('');
    
    // Chat State Management (SaaS-Pro persistence)
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [copySuccess, setCopySuccess] = useState(null);

    const isPro = user?.subscriptionPlan === 'pro' || user?.role === 'admin';

    // Synchronize Session History
    useEffect(() => {
        let mounted = true;
        if (isAssistantOpen && isPro && doc) {
            const syncHistory = async () => {
                setIsLoadingHistory(true);
                try {
                    const data = await aiService.getDocChatHistory(id);
                    if (mounted && data?.history) {
                        setChatHistory(data.history);
                    }
                } catch (error) {
                    console.error("Transmission sync failure:", error);
                } finally {
                    if (mounted) setIsLoadingHistory(false);
                }
            };
            syncHistory();
        }
        return () => { mounted = false; };
    }, [isAssistantOpen, isPro, id]); // Use id instead of doc to prevent unnecessary re-syncs if doc object changes

    const handleClearChat = async () => {
        if (!window.confirm("Clear this guide assistant conversation?")) return;
        try {
            await aiService.deleteDocChat(id);
            setChatHistory([]);
        } catch (error) {
            console.error("Purge failure:", error);
        }
    };

    const autoToc = useMemo(() => {
        if (!doc?.content) {
            return [];
        }

        return doc.content
            .split('\n')
            .map((line) => line.match(/^(#{1,3})\s+(.+)$/))
            .filter(Boolean)
            .map((match) => ({
                id: match[2].trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
                title: match[2].trim(),
                level: match[1].length,
            }));
    }, [doc?.content]);

    const toc = useMemo(
        () => (doc?.tableOfContents && doc.tableOfContents.length > 0 ? doc.tableOfContents : autoToc),
        [autoToc, doc?.tableOfContents],
    );

    const handleScroll = useCallback(() => {
        if (typeof document === 'undefined') {
            return;
        }

        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
        setReadingProgress(progress);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    useEffect(() => {
        if (!toc.length) {
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '-10% 0px -70% 0px', threshold: 0 },
        );

        const headingElements = toc.map((item) => document.getElementById(item.id)).filter(Boolean);
        headingElements.forEach((element) => observer.observe(element));

        return () => {
            headingElements.forEach((element) => observer.unobserve(element));
        };
    }, [toc]);

    const handleProtectedAccess = () => {
        if (!user) {
            info('Please sign in to access this guide.');
            navigate('/login');
            return;
        }
        navigate('/pricing');
    };

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        setCopySuccess(code);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    const handleChatSubmit = async (event) => {
        event.preventDefault();
        if (!chatInput.trim() || isChatLoading || !doc?.content || !isPro) {
            return;
        }

        const question = chatInput.trim();
        setChatInput('');
        
        const currentHistory = [...chatHistory, { role: 'user', content: question }, { role: 'ai', content: '' }];
        setChatHistory(currentHistory);
        setIsChatLoading(true);

        try {
            const response = await aiService.askDocAIStream(doc.content, question, id);
            if (!response.ok) {
                throw new Error('Guide assistant is unavailable.');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';
            let lineBuffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                lineBuffer += chunk;

                const lines = lineBuffer.split('\n\n');
                lineBuffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('data:')) {
                        const dataContent = line.replace(/^data:\s*/, '');
                        if (dataContent) {
                            fullContent += dataContent;
                            setChatHistory((prev) => {
                                const next = [...prev];
                                next[next.length - 1] = { role: 'ai', content: fullContent };
                                return next;
                            });
                        }
                    }
                }
            }
        } catch (_err) {
            setChatHistory((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                    role: 'ai',
                                    content: `Error: ${_err.message || 'The response was interrupted'}. Please try again.`,
                };
                return next;
            });
        } finally {
            setIsChatLoading(false);
        }
    };


    const handlePrint = () => {
        window.print();
    };

    const scrollToSection = (event, sectionId) => {
        event.preventDefault();
        const element = document.getElementById(sectionId);
        if (!element) {
            return;
        }

        const offset = 120;
        const top = element.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
        window.history.pushState(null, null, `#${sectionId}`);
        setActiveId(sectionId);
    };

    const CodeBlock = ({ children, inline, ...props }) => {
        const code = String(children).replace(/\n$/, '');
        if (inline) {
            return (
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-900" {...props}>
                    {children}
                </code>
            );
        }

        return (
            <div className="my-8 overflow-hidden rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Code example</span>
                    <button type="button" onClick={() => handleCopy(code)} className="ds-button-ghost">
                        {copySuccess === code ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <pre className="overflow-x-auto bg-slate-950 p-5 text-sm leading-6 text-slate-100" {...props}>
                    {children}
                </pre>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="ds-page flex min-h-screen items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            </div>
        );
    }

    if (!doc) {
        return (
            <div className="ds-page min-h-screen px-6 py-24">
                <div className="ds-shell">
                    <div className="ds-card p-8 text-center">
                        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Guide not found</h2>
                        <Link to="/docs" className="ds-button-primary mt-6">
                            Back to docs
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const showLockCta = doc.locked && user?.role !== 'admin';
    const hasToc = toc.length > 0;
    const estimatedRead = Math.max(1, Math.ceil((doc.content?.length || 0) / 1000));

    return (
        <div className="ds-page px-6 pb-16 pt-32">
            <Meta
                title={doc.title}
                description={doc.description || doc.previewContent || 'BizCode technical guide for setup, deployment, and implementation support.'}
                canonical={absoluteUrl(`/docs/${doc.id}`)}
                type="article"
                jsonLd={[breadcrumbSchema([
                    { name: 'Home', path: '/' },
                    { name: 'Docs', path: '/docs' },
                    { name: doc.title, path: `/docs/${doc.id}` },
                ])]}
            />
            <div className="fixed left-0 top-0 z-[1001] h-1 w-full bg-slate-200">
                <div className="h-full bg-slate-900 transition-all" style={{ width: `${readingProgress}%` }} />
            </div>

            <div className="ds-shell space-y-8">
                <div className="space-y-4">
                    <Link to="/docs" className="ds-button-ghost px-0">
                        Back to docs
                    </Link>
                    <div className="flex flex-wrap gap-2">
                        {doc.category && <span className="ds-chip">{doc.category}</span>}
                        <span className="ds-chip">{estimatedRead} min read</span>
                        <span className="ds-chip">{showLockCta ? 'Preview only' : 'Full access'}</span>
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{doc.title}</h1>
                        {doc.description && <p className="max-w-3xl text-base leading-7 text-slate-600">{doc.description}</p>}
                    </div>
                </div>

                <div className={`grid gap-10 ${hasToc ? 'lg:grid-cols-[220px,minmax(0,1fr),240px]' : 'lg:grid-cols-[minmax(0,1fr),240px]'}`}>
                    {hasToc && (
                        <aside className="hidden lg:block">
                            <div className="ds-card sticky top-32 z-20 p-5">
                                <h2 className="text-sm font-semibold text-slate-900">On this page</h2>
                                <nav className="mt-4 space-y-2">
                                    {toc.map((item) => (
                                        <a
                                            key={item.id}
                                            href={`#${item.id}`}
                                            onClick={(event) => scrollToSection(event, item.id)}
                                            className={`block rounded-lg px-3 py-2 text-sm ${activeId === item.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                }`}
                                            style={{ marginLeft: `${Math.max(0, (item.level || 1) - 1) * 12}px` }}
                                        >
                                            {item.title}
                                        </a>
                                    ))}
                                </nav>
                            </div>
                        </aside>
                    )}

                    <main className="min-w-0">
                        <article className="ds-card p-6 md:p-8">
                            <div className={`markdown-content prose prose-slate max-w-none ${showLockCta ? 'max-h-[560px] overflow-hidden' : ''}`}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeSlug]}
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="mt-10 text-3xl font-semibold tracking-tight text-slate-900 first:mt-0" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="mt-10 border-b border-slate-200 pb-3 text-2xl font-semibold tracking-tight text-slate-900" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="mt-8 text-xl font-semibold tracking-tight text-slate-900" {...props} />,
                                        p: ({ node, ...props }) => <p className="text-base leading-7 text-slate-600" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="space-y-2 text-base leading-7 text-slate-600" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="space-y-2 text-base leading-7 text-slate-600" {...props} />,
                                        code: CodeBlock,
                                    }}
                                >
                                    {doc.content}
                                </ReactMarkdown>
                            </div>

                            {showLockCta && (
                                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8">
                                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Unlock the full guide</h2>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                        Get the complete deployment guide, configuration scripts, and direct technical help by upgrading your membership.
                                    </p>
                                    <div className="mt-8 flex flex-col gap-4">
                                        <div className="flex flex-wrap gap-3">
                                            <button type="button" onClick={handleProtectedAccess} className="ds-button-primary">
                                                Upgrade Now
                                            </button>
                                            <Link to="/pricing" className="ds-button-secondary bg-white">
                                                View pricing
                                            </Link>
                                        </div>
                                        <div className="pt-4 border-t border-slate-200">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Unsure what plan you need?</p>
                                            <Link to="/contact" className="text-sm font-bold text-blue-600 hover:underline">Talk to support for guidance</Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </article>
                    </main>

                    <aside className="hidden lg:block">
                        <div className="ds-card sticky top-32 z-20 p-5 space-y-5">
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guide details</h2>
                            <dl className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</dt>
                                    <dd className="text-[11px] font-black text-slate-900 uppercase">{doc.category || 'General'}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access</dt>
                                    <dd className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase">{showLockCta ? 'Preview' : 'Available'}</span>
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Read time</dt>
                                    <dd className="text-[10px] font-bold text-slate-900 font-mono">{estimatedRead} min</dd>
                                </div>
                            </dl>
                            <div className="pt-4 border-t border-slate-100">
                                <button onClick={handlePrint} className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all">
                                    Print / Save PDF
                                </button>
                            </div>
                            {config?.aiSettings?.enableDocsAi !== false && (
                                <div className="pt-4 border-t border-slate-100">
                                    <button onClick={() => setIsAssistantOpen(true)} className="w-full py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-indigo-100 transition-all flex items-center justify-center gap-2">
                                        <Terminal size={12} /> Ask AI Assistant
                                    </button>
                                </div>
                            )}
                        </div>
                    </aside>
            </div>
        </div>

        {/* Guide Assistant FAB - hidden when drawer is open */}
            {config?.aiSettings?.enableDocsAi !== false && !isAssistantOpen && (
                <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAssistantOpen(true)}
                    className="fixed bottom-28 right-8 z-[101] flex items-center gap-3 rounded-full border border-slate-200 bg-white/95 backdrop-blur-sm p-3.5 pr-5 shadow-xl transition-all hover:shadow-2xl hover:bg-white"
                >
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                        <Terminal size={16} />
                        {isPro && (
                            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-white bg-emerald-500" />
                        )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Guide Assistant</span>
                </motion.button>
            )}

            {/* Enterprise Offcanvas Drawer */}
            <AnimatePresence>
                {isAssistantOpen && config?.aiSettings?.enableDocsAi !== false && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAssistantOpen(false)}
                            className="fixed inset-0 z-[999] bg-slate-950/20 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed top-0 bottom-0 right-0 z-[1000] flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.08)]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                                        <Cpu size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold tracking-tight text-slate-900">Guide Assistant</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className={`h-1.5 w-1.5 rounded-full ${isPro ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                                {isPro ? 'Active' : 'Pro required'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {isPro && chatHistory.length > 0 && (
                                        <button
                                            onClick={handleClearChat}
                                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                            title="Clear conversation"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsAssistantOpen(false)}
                                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Conversation Domain */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {!isPro ? (
                                    <div className="flex h-full flex-col items-center justify-center px-6 text-center space-y-5">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-300">
                                            <Lock size={28} />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-lg font-bold text-slate-900 tracking-tight">Pro Access Required</h4>
                                            <p className="text-xs leading-relaxed text-slate-500 max-w-xs">
                                                Ask questions about this guide, get deployment help, and implementation advice.
                                            </p>
                                        </div>
                                        <Link to="/pricing" onClick={() => setIsAssistantOpen(false)} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">
                                            Upgrade to Pro
                                        </Link>
                                        <p className="text-[10px] text-slate-400">Starts at ₹29/month</p>
                                    </div>
                                ) : (
                                    <>
                                        {chatHistory.length === 0 && !isLoadingHistory && (
                                            <div className="flex h-40 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-100 bg-slate-50/50">
                                                <Sparkles size={28} className="mb-3 text-slate-300" />
                                                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Ask a question about this guide</p>
                                            </div>
                                        )}

                                        {isLoadingHistory && (
                                            <div className="flex h-40 items-center justify-center">
                                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                                            </div>
                                        )}

                                        {chatHistory.map((msg, i) => (
                                            <div key={i} className="space-y-2">
                                                <div className="flex items-center justify-between px-1">
                                                     <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                                        {msg.role === 'user' ? 'You' : 'Assistant'}
                                                     </span>
                                                     <span className="text-[8px] font-mono text-slate-300 uppercase">SYN_{i}</span>
                                                </div>
                                                <div className={`p-5 rounded-2xl text-[13px] leading-relaxed tracking-tight ${
                                                    msg.role === 'user'
                                                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10'
                                                        : 'bg-slate-50 border border-slate-100 text-slate-700'
                                                }`}>
                                                    <div className="prose prose-sm prose-slate max-w-none">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {msg.content}
                                                        </ReactMarkdown>
                                                        {isChatLoading && i === chatHistory.length - 1 && msg.role === 'ai' && (
                                                            <span className="inline-block h-4 w-1.5 animate-pulse rounded-full bg-slate-900 ml-1 translate-y-0.5" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {isChatLoading && (
                                            <div className="space-y-2 opacity-50">
                                                <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                                                <div className="h-16 w-full bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Transmission Interface */}
                            {isPro && (
                                <div className="border-t border-slate-100 bg-white p-6">
                                    <form onSubmit={handleChatSubmit} className="relative group">
                                        <textarea
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder="Ask this guide..."
                                            disabled={isChatLoading}
                                            rows="2"
                                            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-5 pr-14 text-sm font-medium transition-all group-hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-0"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isChatLoading || !chatInput.trim()}
                                            className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white transition-all shadow-lg shadow-slate-900/20 hover:bg-slate-800 disabled:opacity-30 disabled:shadow-none"
                                        >
                                            {isChatLoading ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={22} />}
                                        </button>
                                    </form>
                                    <div className="mt-4 flex items-center justify-center gap-4">
                                        <div className="h-px flex-1 bg-slate-100" />
                                        <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-300">BizCode guide assistant</span>
                                        <div className="h-px flex-1 bg-slate-100" />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DocViewer;
