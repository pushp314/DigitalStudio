import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
    MessageSquare, 
    Calendar, 
    User, 
    ArrowRight, 
    Clock, 
    CheckCircle2,
    Search,
    Shield,
    X,
    RotateCcw,
    CalendarPlus,
    Tag,
    Lock,
    Ticket
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const EliteAdminManager = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const navigate = useNavigate();
    const { error: toastError, success } = useToast();

    const fetchSessions = async () => {
        try {
            const data = await api.get('/support/sessions');
            setSessions(Array.isArray(data) ? data : []);
        } catch (err) {
            toastError("Failed to fetch administrative records.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleClose = async (sessionId) => {
        setActionLoading(sessionId);
        try {
            await api.patch(`/support/sessions/${sessionId}/close`);
            success("Record secured and closed.");
            fetchSessions();
        } catch (err) {
            toastError("Failed to finalize close action.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleResolve = async (sessionId) => {
        setActionLoading(sessionId);
        try {
            await api.patch(`/support/sessions/${sessionId}/resolve`);
            success("Inquiry marked as resolved.");
            fetchSessions();
        } catch (err) {
            toastError("Resolution update failed.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleExtend = async (sessionId) => {
        setActionLoading(sessionId);
        try {
            await api.patch(`/support/sessions/${sessionId}/extend`, { days: 30 });
            success("Client access extended (30 Days).");
            fetchSessions();
        } catch (err) {
            toastError("Extension grant failed.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleGiftDiscount = async (sessionId) => {
        setActionLoading(sessionId);
        try {
            // Logic: Create a random 50% coupon and send it as a message
            const code = `PRO50-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
            await api.post('/admin/marketing/coupons', {
                code: code,
                discountType: 'percentage',
                discountValue: 50,
                usageLimit: 1,
                active: true
            });
            
            // Send the code into the chat
            await api.post(`/support/sessions/${sessionId}/messages`, {
                message: `🎁 ADMINISTRATIVE OFFER: Use code ${code} for 50% OFF your Pro Membership! (One-time use)`
            });

            success(`Special Offer Transmitted: ${code}`);
        } catch (err) {
            toastError("Failed to issue special offer.");
        } finally {
            setActionLoading(null);
        }
    };

    const isExpired = (session) => {
        return session.status !== 'active' || new Date(session.expiresAt) < new Date();
    };

    const filteredSessions = sessions.filter(s => 
        s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusBadge = (session) => {
        if (session.status === 'resolved') {
            return { label: 'RESOLVED', styles: 'bg-blue-50 text-blue-600 border-blue-100' };
        }
        if (session.status === 'closed') {
            return { label: 'CLOSED', styles: 'bg-slate-50 text-slate-400 border-slate-100' };
        }
        if (isExpired(session)) {
            return { label: 'EXPIRED', styles: 'bg-red-50 text-red-600 border-red-100' };
        }
        return { label: 'ACTIVE', styles: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-slate-100">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                            <Shield size={16} fill="currentColor" className="text-amber-400" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Support Operations</h2>
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                        Manage paid expert help and post-purchase support sessions.
                    </p>
                </div>
                
                <div className="relative group max-w-sm w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search UUID, User, or Intent..."
                        className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm outline-none w-full focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all placeholder:text-slate-300"
                    />
                </div>
            </header>

            {loading ? (
                <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 rounded-3xl bg-white border border-slate-100 animate-pulse" />
                    ))}
                </div>
            ) : filteredSessions.length === 0 ? (
                <div className="bg-white rounded-[2rem] border border-slate-200 border-dashed p-24 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-slate-300">
                        <MessageSquare size={32} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">No Communications Found</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-xs mx-auto">Systems are quiet. Incoming sessions will appear in this registry.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredSessions.map(session => (
                        <div key={session.id} className="group bg-white rounded-[1.5rem] border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-8 transition-all hover:border-slate-900 hover:shadow-2xl hover:shadow-slate-200/50">
                            <div className="flex flex-col md:flex-row md:items-center gap-8 flex-grow min-w-0">
                                {/* Profile Context */}
                                <div className="flex items-center gap-4 shrink-0 w-64">
                                   <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shrink-0 group-hover:bg-slate-900 group-hover:border-slate-800 group-hover:text-white transition-all">
                                        {session.user?.avatarUrl ? (
                                            <img src={session.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                                        ) : <User size={20} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-slate-900 truncate tracking-tight">{session.user?.name || 'Anonymous'}</p>
                                        <p className="text-[10px] text-slate-400 font-bold tracking-widest truncate uppercase mt-0.5">{session.user?.email}</p>
                                    </div>
                                </div>

                                {/* Intent Context */}
                                <div className="min-w-0 flex-grow">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Tag size={12} className="text-amber-500" />
                                        <p className="text-xs font-black text-slate-900 truncate tracking-tight uppercase">{session.title}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-[9px] text-slate-400 font-black uppercase tracking-[0.1em]">
                                        <span className="flex items-center gap-1.5"><Clock size={10} /> {new Date(session.createdAt).toLocaleDateString()}</span>
                                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                                        <span className="flex items-center gap-1.5 text-slate-900"><Shield size={10} /> {session.source || 'Standard'}</span>
                                    </div>
                                </div>

                                {/* Status Context */}
                                <div className="shrink-0 flex flex-col items-start md:items-center gap-2">
                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusBadge(session).styles}`}>
                                        {statusBadge(session).label}
                                    </div>
                                    {session.status === 'active' && !isExpired(session) && (
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Expires {new Date(session.expiresAt).toLocaleDateString()}</p>
                                    )}
                                </div>
                            </div>

                            {/* Actions Group */}
                            <div className="flex items-center gap-3 shrink-0">
                                <button 
                                    onClick={() => navigate(`/support/chat/${session.id}`)}
                                    className="flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 group-hover:scale-[1.02]"
                                >
                                    Launch Hub <ArrowRight size={14} />
                                </button>
                                
                                <div className="flex items-center gap-2">
                                    {session.status === 'active' && (
                                        <>
                                            <div className="relative group/tooltip">
                                                <button 
                                                    onClick={() => handleGiftDiscount(session.id)}
                                                    disabled={actionLoading === session.id}
                                                    className="h-12 w-12 flex items-center justify-center rounded-2xl border border-slate-200 text-amber-500 hover:bg-amber-50 hover:border-amber-200 transition-all disabled:opacity-30"
                                                >
                                                    <Ticket size={18} />
                                                </button>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                                    Gift 50% Discount
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                                </div>
                                            </div>

                                            <div className="relative group/tooltip">
                                                <button 
                                                    onClick={() => handleResolve(session.id)}
                                                    disabled={actionLoading === session.id}
                                                    className="h-12 w-12 flex items-center justify-center rounded-2xl border border-slate-200 text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-30"
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                                    Mark Resolved
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                                </div>
                                            </div>

                                            <div className="relative group/tooltip">
                                                <button 
                                                    onClick={() => handleClose(session.id)}
                                                    disabled={actionLoading === session.id}
                                                    className="h-12 w-12 flex items-center justify-center rounded-2xl border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-30"
                                                >
                                                    <Lock size={18} />
                                                </button>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                                    Finalize & Lock
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {(isExpired(session) || session.status !== 'active') && (
                                        <div className="relative group/tooltip">
                                            <button 
                                                onClick={() => handleExtend(session.id)}
                                                disabled={actionLoading === session.id}
                                                className="h-12 w-14 flex items-center justify-center rounded-2xl border border-slate-200 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all disabled:opacity-30 font-black text-[9px] gap-2 px-6"
                                            >
                                                <CalendarPlus size={18} /> 
                                                <span className="hidden xl:inline">EXTEND</span>
                                            </button>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                                Grant 30 Days Extra
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EliteAdminManager;
