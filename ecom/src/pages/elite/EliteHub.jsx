
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ConfigContext from '../../context/ConfigContext';
import AuthContext from '../../context/AuthContext';
import { MessageSquare, Calendar, ArrowRight, Zap, Shield, Lock, Briefcase, ChevronLeft, Package, Search, Clock } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const EliteHub = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const navigate = useNavigate();
    const { error: toastError, success } = useToast();
    const { config } = useContext(ConfigContext);
    const { user } = useContext(AuthContext);
    const isPro = user?.isPro || user?.subscriptionPlan === 'pro' || user?.role === 'admin';
    const fee = config?.eliteSettings?.negotiationFee || 9;

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
        window.addEventListener('ds_support_read', fetchSessions);
        return () => window.removeEventListener('ds_support_read', fetchSessions);
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
            const data = await api.get(`/marketing/validate?code=${couponCode}&totalAmount=${fee}&scope=support`);
            setAppliedDiscount(data);
            success(`Support Protocol Activated: ${couponCode} Applied.`);
        } catch (err) {
            toastError("Invalid or expired support code.");
            setAppliedDiscount(null);
        } finally {
            setIsValidating(false);
        }
    };

    const handleStartNegotiation = async (productId = 0) => {
        if (!user) {
            toastError("Please log in to continue.");
            navigate('/login');
            return;
        }

        setPaying(true);
        try {
            const data = await api.post(`/support/create-order/${productId}`, {
                couponCode: appliedDiscount?.code || ""
            });
            
            // Handle Pro Free Access or Existing Session or Coupon Free
            if (data.isFree || data.alreadyActive) {
                success(data.message || "Opening your support workspace.");
                navigate(`/support/chat/${data.sessionId}`);
                return;
            }

            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: "DigitalStudio Support",
                description: "Direct Expert Access",
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
                            success("Access granted! Opening your workspace.");
                            navigate(`/support/chat/${verifyData.sessionId}`);
                        }
                    } catch (err) {
                        toastError("Verification failed.");
                    }
                },
                prefill: { name: user?.name, email: user?.email },
                theme: { color: "#F59E0B" },
                modal: { ondismiss: () => setPaying(false) }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            toastError(err.message || "Failed to initialize protocol.");
        } finally {
            setPaying(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] selection:bg-slate-900 selection:text-white font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Enterprise Header / Registry Command Bar */}
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
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <Shield size={14} className="text-slate-900" />
                                <span className="font-black text-[12px] text-slate-900 uppercase tracking-widest">Support Registry</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Enterprise Communication Node</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/templates')}
                            className="hidden md:flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <Package size={14} /> Marketplace
                        </button>
                        {isPro && (
                            <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/10">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified_Pro</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-16">
                <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-16">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-[0.2em]">
                            <Zap size={10} fill="currentColor" className="text-amber-500" /> Active Operations
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
                            Secure <span className="text-slate-300">Negotiations_</span>
                        </h1>
                    </div>

                    <div className="relative group max-w-sm w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={14} />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search Session UUID / Title..."
                            className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-sm outline-none w-full focus:border-slate-900 transition-all placeholder:text-slate-300"
                        />
                    </div>
                </header>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-28 bg-white border border-slate-100 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : filteredSessions.length === 0 && sessions.length > 0 ? (
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-20 text-center shadow-sm">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">No matching records found in registry.</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="bg-white rounded-[3rem] border border-slate-200 p-20 text-center shadow-sm relative overflow-hidden group">
                        <div className="relative z-10 max-w-md mx-auto">
                            <div className="h-16 w-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mx-auto mb-8 text-slate-400">
                                <MessageSquare size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">No Active Uplinks</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-12">
                                {isPro 
                                    ? "Enterprise access detected. You have immediate authorization to initiate priority support protocols for any technical challenge."
                                    : "You lack an active support session. Initialize a 30-day dedicated communication uplink to our specialized technical team."
                                }
                            </p>
                            
                            <div className="bg-slate-50 rounded-[2rem] p-10 border border-slate-200 shadow-inner">
                                <div className="flex items-center justify-between mb-8">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Fee</span>
                                    <div className="text-right">
                                        <span className="text-3xl font-black text-slate-900 tracking-tighter">
                                            {isPro ? "₹0_PRO" : (appliedDiscount ? `₹${fee - appliedDiscount.discount}` : `₹${fee}`)} 
                                        </span>
                                    </div>
                                </div>

                                {!isPro && (
                                    <div className="mb-8 flex gap-3">
                                        <input 
                                            type="text" 
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            placeholder="PROTO_CODE"
                                            className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-[0.2em] focus:border-slate-900 transition-all outline-none"
                                        />
                                        <button 
                                            onClick={handleApplyCoupon}
                                            disabled={isValidating || !couponCode.trim()}
                                            className="px-6 bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-30"
                                        >
                                            {isValidating ? '...' : 'Apply'}
                                        </button>
                                    </div>
                                )}

                                <button 
                                    onClick={() => handleStartNegotiation(0)}
                                    disabled={paying}
                                    className="w-full py-5 bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    <Zap size={14} fill="currentColor" className="text-amber-400" />
                                    {paying ? 'INITIALIZING...' : (appliedDiscount ? 'Protocol Authorized' : 'Establish Secure Uplink')}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredSessions.map((session) => (
                            <div 
                                key={session.id}
                                onClick={() => !isExpired(session) && navigate(`/support/chat/${session.id}`)}
                                className={`group bg-white border border-slate-200 p-6 rounded-[2rem] transition-all duration-300 flex flex-col md:flex-row md:items-center gap-8 ${
                                    !isExpired(session) ? 'hover:border-slate-900 hover:shadow-2xl hover:shadow-slate-200/50 cursor-pointer translate-y-0 hover:-translate-y-1' : 'opacity-60 grayscale-[0.5]'
                                }`}
                            >
                                <div className="flex flex-1 items-center gap-8 min-w-0">
                                    {/* Abstract Visual Identity */}
                                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-500 shrink-0 ${
                                        isExpired(session) 
                                        ? 'bg-slate-50 border-slate-100 text-slate-300' 
                                        : 'bg-slate-950 text-white group-hover:bg-blue-600 transition-colors'
                                    }`}>
                                        <MessageSquare size={20} strokeWidth={2.5} />
                                    </div>

                                    {/* Registry Content */}
                                    <div className="min-w-0 flex-grow">
                                        <div className="flex items-center gap-4 mb-2">
                                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate">
                                                {session.user?.name || "Anonymous_Terminal"}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                    session.title?.toLowerCase().includes('priority')
                                                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                                }`}>
                                                    {session.title?.toLowerCase().includes('priority') ? 'PRIORITY_HUB' : 'GENERAL_SYNC'}
                                                </span>
                                                {session.unreadCount > 0 && (
                                                    <span className="flex h-5 items-center justify-center rounded-full bg-rose-600 px-2.5 text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-rose-600/30 animate-pulse">
                                                        {session.unreadCount} NEW
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(session.createdAt).toLocaleDateString()}</span>
                                            <span className="h-1 w-1 rounded-full bg-slate-200" />
                                            <span className="text-slate-900 font-black">UUID_{String(session.id).padStart(6, '0')}</span>
                                            <span className="flex items-center gap-1.5 text-slate-900 font-black">
                                                <MessageSquare size={12} className="text-slate-400" /> {session.messageCount || 0} MSGS
                                            </span>
                                            <span className="h-1 w-1 rounded-full bg-slate-200" />
                                            <span className={`inline-flex px-3 py-1 rounded-full border ${
                                                !isExpired(session) ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                                            }`}>
                                                {isExpired(session) ? 'EXPIRED' : session.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Registry Entry Status */}
                                <div className="flex items-center justify-between md:justify-end gap-10 shrink-0 border-t md:border-t-0 border-slate-100 pt-6 md:pt-0">
                                    <div className="hidden lg:block text-right">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Valid_Until</p>
                                        <p className="text-xs text-slate-900 font-black">
                                            {session.expiresAt ? new Date(session.expiresAt).toLocaleDateString('en-GB') : '∞'}
                                        </p>
                                    </div>
                                    <div className={`p-4 rounded-2xl border transition-all ${
                                        !isExpired(session) ? 'bg-slate-50 group-hover:bg-slate-950 group-hover:text-white border-slate-200 group-hover:border-slate-950' : 'bg-slate-50/50 border-slate-100 text-slate-200'
                                    }`}>
                                        <ArrowRight size={18} strokeWidth={3} />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Tactical Expansion Node */}
                        <div className="space-y-4">
                            {!isPro && (
                                <div className="max-w-md mx-auto flex gap-3 p-2 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
                                    <input 
                                        type="text" 
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder="PROMO_CODE"
                                        className="flex-1 px-6 py-2 text-[10px] font-black uppercase tracking-widest outline-none"
                                    />
                                    <button 
                                        onClick={handleApplyCoupon}
                                        disabled={isValidating || !couponCode.trim()}
                                        className="px-6 py-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
                                    >
                                        {isValidating ? '...' : (appliedDiscount ? 'Applied' : 'Verify')}
                                    </button>
                                </div>
                            )}
                            <button 
                                onClick={() => handleStartNegotiation(0)}
                                className="w-full group p-8 rounded-[2.5rem] bg-white border-2 border-dashed border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center gap-4 text-slate-400 hover:text-slate-900"
                            >
                                <div className="h-10 w-10 rounded-xl border border-dashed border-slate-300 flex items-center justify-center group-hover:border-slate-400 group-hover:rotate-45 transition-all">
                                    <Zap size={16} fill="currentColor" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-widest">
                                    {appliedDiscount ? `Authorized_Code: ${appliedDiscount.code}` : 'Initialize Additional Support Node'}
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EliteHub;
