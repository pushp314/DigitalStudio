import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import ConfigContext from '../../context/ConfigContext';
import AuthContext from '../../context/AuthContext';
import { 
    MessageSquare, 
    ArrowRight, 
    Zap, 
    Shield,
    Briefcase, 
    ChevronLeft, 
    Search, 
    Clock, 
    Sparkles, 
    HelpCircle,
    CheckCircle2,
    ShoppingCart,
    Lightbulb,
    Target
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const EliteHub = () => {
    const { intent } = useParams();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchingIntent, setFetchingIntent] = useState(!!intent);
    const [activeIntent, setActiveIntent] = useState(null);
    const [paying, setPaying] = useState(false);
    const [activeTab, setActiveTab] = useState('expert'); // 'expert' or 'history'
    const navigate = useNavigate();
    const { error: toastError, success } = useToast();
    const { config } = useContext(ConfigContext);
    const { user } = useContext(AuthContext);
    const isPro = user?.isPro || user?.subscriptionPlan === 'pro' || user?.role === 'admin';
    const baseFee = config?.eliteSettings?.negotiationFee || 9;

    const currentFee = useMemo(() => {
        if (activeIntent?.isPaid) return activeIntent.baseFee;
        return baseFee;
    }, [activeIntent, baseFee]);

    useEffect(() => {
        if (intent) {
            const fetchIntent = async () => {
                try {
                    const data = await api.get(`/intents/expert/${intent}`);
                    setActiveIntent(data);
                } catch (err) {
                    console.error("Expert intent discovery failed:", err);
                } finally {
                    setFetchingIntent(false);
                }
            };
            fetchIntent();
        }
    }, [intent]);


    const fetchSessions = React.useCallback(async () => {
        try {
            const data = await api.get('/support/sessions');
            setSessions(Array.isArray(data) ? data : []);
        } catch (err) {
            setSessions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSessions();
        window.addEventListener('bc_support_read', fetchSessions);
        return () => window.removeEventListener('bc_support_read', fetchSessions);
    }, [fetchSessions]);

    const [searchTerm, setSearchTerm] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [appliedDiscount, setAppliedDiscount] = useState(null);

    const filteredSessions = sessions.filter(s => 
        s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toString().includes(searchTerm)
    );

    const isExpired = (session) => {
        return session.status !== 'active' || (session.expiresAt && new Date(session.expiresAt) < new Date());
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsValidating(true);
        try {
            const data = await api.get(`/marketing/validate?code=${couponCode}&totalAmount=${currentFee}&scope=support`);
            setAppliedDiscount(data);
            success(`Support promo applied: ${couponCode}.`);
        } catch (err) {
            toastError("Invalid or expired support code.");
            setAppliedDiscount(null);
        } finally {
            setIsValidating(false);
        }
    };

    const handleStartConsultation = async (productId = 0) => {
        if (!user) {
            toastError("Please log in to talk to an expert.");
            navigate('/login');
            return;
        }

        setPaying(true);
        try {
            const data = await api.post(`/support/create-order/${productId}`, {
                couponCode: appliedDiscount?.code || "",
                intent: intent || "expert_consultation",
                expertIntentId: activeIntent?.id || null
            });
            
            if (data.isFree || data.alreadyActive) {
                success(data.message || "Connecting you with an expert.");
                navigate(`/support/chat/${data.sessionId}`);
                return;
            }

            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: "BizCode Expert Help",
                description: activeIntent?.headline || "1:1 Consultation with a Developer",
                order_id: data.orderId,
                handler: async function (response) {
                    try {
                        const verifyData = await api.post('/support/verify-payment', {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            productId: productId,
                        });
                        if (verifyData.sessionId) {
                            success("Consultation unlocked! Opening your workspace.");
                            navigate(`/support/chat/${verifyData.sessionId}`);
                        }
                    } catch (err) {
                        toastError("Payment verification failed.");
                    }
                },
                prefill: { name: user?.name, email: user?.email },
                theme: { color: "#0F172A" },
                modal: { ondismiss: () => setPaying(false) }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            toastError(err.message || "Failed to start consultation.");
        } finally {
            setPaying(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] selection:bg-slate-900 selection:text-white font-sans flex flex-col overflow-hidden">
            {/* Enterprise Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/')}
                            className="group p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-slate-500 hover:text-slate-900 shadow-sm"
                        >
                            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="h-8 w-px bg-slate-200" />
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Support Central</h2>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {isPro && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/10">
                                <Zap size={12} fill="currentColor" className="text-amber-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Priority Access</span>
                            </div>
                        )}
                        <button 
                            onClick={() => navigate('/hire-developer')}
                            className="hidden md:flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            Hire a Dev <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar">
                <div className="max-w-6xl mx-auto px-6 py-12">
                    
                    {/* Intro Section */}
                    <header className="mb-12">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
                            {activeIntent?.headline || <>How can we <span className="text-slate-400 underline decoration-slate-200">help you today?</span></>}
                        </h1>
                        <p className="text-slate-500 font-medium max-w-2xl">
                            {activeIntent?.subheadline || activeIntent?.description || "Whether you need help choosing a product or technical assistance with an existing purchase, our experts are here to guide your success."}
                        </p>
                    </header>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit mb-10">
                        <button 
                            onClick={() => setActiveTab('expert')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'expert' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Talk to Expert
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Support Inbox {sessions.filter(s => s.unreadCount > 0).length > 0 && <span className="ml-2 h-2 w-2 bg-rose-500 rounded-full inline-block animate-pulse" />}
                        </button>
                    </div>

                    {activeTab === 'expert' ? (
                        /* EXPERT PATH */
                        <div className="grid lg:grid-cols-2 gap-8">
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-8 border border-indigo-100">
                                        {activeIntent?.slug === 'help-choosing' ? <ShoppingCart size={24} /> :
                                         activeIntent?.slug === 'pre-purchase-questions' ? <HelpCircle size={24} /> :
                                         activeIntent?.slug === 'product-recommendation' ? <Lightbulb size={24} /> :
                                         <Sparkles size={24} />}
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">
                                        {activeIntent?.name || "Expert Consultation"}
                                    </h2>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
                                        {activeIntent?.description || "Perfect for pre-purchase questions, architecture advice, or finding the right product for your specific use-case."}
                                    </p>
                                    <ul className="space-y-4 mb-10">
                                        {[
                                            "Direct 1:1 chat with a senior developer",
                                            "Product recommendations matching your stack",
                                            "Pre-purchase technical validation",
                                            "Setup & Deployment mentorship"
                                        ].map((li, i) => (
                                            <li key={i} className="flex items-start gap-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                                {li}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[2rem] border border-slate-100 italic">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Consultation Fee</span>
                                        <span className="text-2xl font-black text-slate-900 tracking-tighter">
                                            {isPro ? "FREE" : (appliedDiscount ? `₹${currentFee - appliedDiscount.discount}` : `₹${currentFee}`)}
                                        </span>
                                    </div>
                                    
                                    {!isPro && (
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder="PROMO CODE"
                                                className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] focus:border-slate-900 transition-all outline-none"
                                            />
                                            <button 
                                                onClick={handleApplyCoupon}
                                                disabled={isValidating || !couponCode.trim()}
                                                className="px-6 bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                            >
                                                {isValidating ? '...' : 'Verify'}
                                            </button>
                                        </div>
                                    )}

                                    <button 
                                        onClick={() => handleStartConsultation(0)}
                                        disabled={paying}
                                        className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-indigo-600 shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {paying ? 'Synchronizing...' : (activeIntent?.cta || 'Start Expert Consultation')}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Shield size={120} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-4">Post-Purchase Help?</h3>
                                    <p className="text-slate-400 text-xs font-medium leading-relaxed mb-8">
                                        If you already own a product and are facing technical issues, bugs, or need deployment help, you can use one of your support tickets.
                                    </p>
                                    <button 
                                        onClick={() => setActiveTab('history')}
                                        className="inline-flex items-center gap-3 px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Browse Support Tickets <ArrowRight size={14} />
                                    </button>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 flex items-center justify-between group cursor-pointer hover:border-slate-900 transition-all" onClick={() => navigate('/hire-developer')}>
                                    <div className="flex items-center gap-6">
                                        <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                                            <Briefcase size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Scale your project</p>
                                            <p className="text-sm font-black text-slate-900 uppercase">Hire a Developer</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={20} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* HISTORY PATH */
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
                                <div className="relative group flex-grow max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={16} />
                                    <input 
                                        type="text" 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by case ID or title..."
                                        className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm outline-none w-full focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all"
                                    />
                                </div>
                                <button 
                                    onClick={() => setActiveTab('expert')}
                                    className="px-8 py-3.5 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                                >
                                    <Plus size={14} /> Open Support Request
                                </button>
                            </div>

                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-28 bg-white border border-slate-100 rounded-3xl animate-pulse" />
                                    ))}
                                </div>
                            ) : filteredSessions.length === 0 ? (
                                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-20 text-center shadow-sm">
                                    <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                                        <HelpCircle size={32} />
                                    </div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No support requests found in this registry.</p>
                                    <button onClick={() => setActiveTab('expert')} className="mt-8 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline decoration-2">Start your first consultation</button>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {filteredSessions.map((session) => (
                                        <div 
                                            key={session.id}
                                            onClick={() => !isExpired(session) && navigate(`/support/chat/${session.id}`)}
                                            className={`group bg-white border border-slate-200 p-6 rounded-[2.5rem] transition-all duration-300 flex flex-col md:flex-row md:items-center gap-8 ${
                                                !isExpired(session) ? 'hover:border-slate-900 hover:shadow-xl cursor-pointer translate-y-0 hover:-translate-y-1' : 'opacity-60 grayscale-[0.5]'
                                            }`}
                                        >
                                            <div className="flex flex-1 items-center gap-6 min-w-0">
                                                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-500 shrink-0 ${
                                                    isExpired(session) 
                                                    ? 'bg-slate-50 border-slate-100 text-slate-300' 
                                                    : 'bg-slate-900 text-white group-hover:bg-slate-900'
                                                }`}>
                                                    <MessageSquare size={20} />
                                                </div>

                                                <div className="min-w-0 flex-grow">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest truncate">
                                                            {session.title || "Support Consultation"}
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            {session.unreadCount > 0 && (
                                                                <span className="flex h-5 items-center justify-center rounded-full bg-rose-600 px-2.5 text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-rose-600/30">
                                                                    {session.unreadCount} NEW
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                                        <span className="text-slate-900 font-black">CASE ID: {String(session.id).padStart(6, '0')}</span>
                                                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                                                        <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(session.createdAt).toLocaleDateString()}</span>
                                                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                                                        <span className={`inline-flex px-3 py-1 rounded-full border ${
                                                            !isExpired(session) ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                                                        }`}>
                                                            {isExpired(session) ? 'EXPIRED' : session.status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between md:justify-end gap-10 shrink-0 border-t md:border-t-0 border-slate-100 pt-6 md:pt-0">
                                                <div className="hidden lg:block text-right">
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Access Until</p>
                                                    <p className="text-[10px] text-slate-900 font-black italic">
                                                        {session.expiresAt ? new Date(session.expiresAt).toLocaleDateString('en-GB') : '∞'}
                                                    </p>
                                                </div>
                                                <div className={`p-4 rounded-2xl border transition-all ${
                                                    !isExpired(session) ? 'bg-slate-50 group-hover:bg-slate-900 group-hover:text-white border-slate-100' : 'bg-slate-50/50 border-slate-100 text-slate-200'
                                                }`}>
                                                    <ArrowRight size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

const Plus = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

export default EliteHub;

