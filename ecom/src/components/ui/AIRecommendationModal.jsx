import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import aiService from '../../services/aiService';
import { Sparkles, ArrowRight, Package, Users, Wrench, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const CTA_CONFIG = {
    'View Product': { icon: Package, path: '/apps', color: 'bg-slate-900 text-white hover:bg-slate-800' },
    'Talk to Expert': { icon: Users, path: '/support', color: 'bg-indigo-600 text-white hover:bg-indigo-700' },
    'Request Custom Build': { icon: Wrench, path: '/hire-developer', color: 'border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white' },
};

const AIRecommendationModal = ({ isOpen, onClose }) => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleAsk = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await aiService.recommendProducts(query.trim());
            setResult(res?.data || res);
        } catch (err) {
            if (err.message?.includes('limit reached') || err.message?.includes('429')) {
                setError('daily_limit');
            } else {
                setError(err.message || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAsk();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Sparkles size={16} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">AI Product Finder</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Describe what you need</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Not logged in */}
                    {!user ? (
                        <div className="text-center py-8 space-y-4">
                            <p className="text-sm text-slate-600 font-medium">Sign in to get personalized product recommendations.</p>
                            <button onClick={() => { onClose(); navigate('/login'); }} className="ds-button-primary">Sign in</button>
                        </div>
                    ) : (
                        <>
                            {/* Input */}
                            <div className="relative">
                                <textarea
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    rows={2}
                                    maxLength={500}
                                    placeholder="e.g. I need an LMS for my coaching institute with payment integration..."
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-medium resize-none transition-all"
                                />
                                <span className="absolute bottom-3 right-4 text-[10px] font-bold text-slate-300">{query.length}/500</span>
                            </div>

                            <button
                                onClick={handleAsk}
                                disabled={loading || !query.trim()}
                                className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-900/10"
                            >
                                {loading ? <><Loader2 size={14} className="animate-spin" /> Analyzing...</> : <><Sparkles size={14} /> Find Products</>}
                            </button>

                            {/* Error States */}
                            {error === 'daily_limit' && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center space-y-3">
                                    <AlertCircle size={24} className="text-amber-500 mx-auto" />
                                    <p className="text-sm font-bold text-slate-900">Daily AI limit reached</p>
                                    <p className="text-xs text-slate-500">Free accounts get 5 AI queries per day. Upgrade for unlimited access.</p>
                                    <button onClick={() => { onClose(); navigate('/pricing'); }} className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all">
                                        Upgrade to Pro
                                    </button>
                                </div>
                            )}

                            {error && error !== 'daily_limit' && (
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                                    <AlertCircle size={16} className="text-red-500 shrink-0" />
                                    <p className="text-sm text-red-700 font-medium flex-1">{error}</p>
                                    <button onClick={handleAsk} className="p-2 hover:bg-red-100 rounded-xl transition-colors">
                                        <RefreshCw size={14} className="text-red-500" />
                                    </button>
                                </div>
                            )}

                            {/* Structured Results */}
                            {result && (
                                <div className="space-y-4 animate-in fade-in duration-500">
                                    {/* Summary */}
                                    {result.summary && (
                                        <div className="bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100">
                                            <p className="text-sm text-slate-700 font-medium leading-relaxed">{result.summary}</p>
                                        </div>
                                    )}

                                    {/* Recommendation Cards */}
                                    {result.recommendations?.length > 0 && (
                                        <div className="space-y-3">
                                            {result.recommendations.map((rec, i) => {
                                                const ctaConfig = CTA_CONFIG[rec.cta] || CTA_CONFIG['View Product'];
                                                const Icon = ctaConfig.icon;
                                                return (
                                                    <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition-all group">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                                                        rec.type === 'product' ? 'bg-emerald-100 text-emerald-700' :
                                                                        rec.type === 'service' ? 'bg-blue-100 text-blue-700' :
                                                                        'bg-amber-100 text-amber-700'
                                                                    }`}>{rec.type?.replace('_', ' ')}</span>
                                                                </div>
                                                                <h3 className="text-sm font-bold text-slate-900 tracking-tight">{rec.title}</h3>
                                                                <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">{rec.reason}</p>
                                                            </div>
                                                            <Link
                                                                to={ctaConfig.path}
                                                                onClick={onClose}
                                                                className={`shrink-0 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${ctaConfig.color}`}
                                                            >
                                                                <Icon size={12} />
                                                                {rec.cta}
                                                            </Link>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Follow-up Questions */}
                                    {result.nextQuestions?.length > 0 && (
                                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Refine your search</p>
                                            <div className="flex flex-wrap gap-2">
                                                {result.nextQuestions.map((q, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => { setQuery(q); setResult(null); }}
                                                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:border-slate-900 hover:text-slate-900 transition-all flex items-center gap-1.5"
                                                    >
                                                        {q} <ArrowRight size={10} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIRecommendationModal;
