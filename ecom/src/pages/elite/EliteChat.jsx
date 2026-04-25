import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Send, Shield, Terminal, User, Lock, Clock, Info, ExternalLink, Paperclip, Smile, Loader2, ChevronLeft } from 'lucide-react';

const EliteChat = () => {
    const { id: sessionId } = useParams();
    const { user } = useContext(AuthContext);
    const [session, setSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isEmojiOpen, setIsEmojiOpen] = useState(false);
    
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const { error: toastError, info, success } = useToast();

    const playReceiveSound = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) {}
    };

    const playSendSound = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.05);
            gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.05);
        } catch (e) {}
    };

    const isSessionActive = (s) => {
        if (!s) return false;
        if (s.status !== 'active') return false;
        if (new Date(s.expiresAt) < new Date()) return false;
        return true;
    };

    const markRead = async () => {
        try {
            await api.patch(`/support/sessions/${sessionId}/read`);
            window.dispatchEvent(new CustomEvent('bc_support_read'));
        } catch (err) {}
    };

    const fetchMessages = async () => {
        try {
            const data = await api.get(`/support/sessions/${sessionId}/messages`);
            if (data.session) setSession(data.session);
            if (data.messages) {
                const newMsgs = Array.isArray(data.messages) ? data.messages : [];
                // If we got more messages than before, mark as read
                if (newMsgs.length > messages.length) {
                    markRead();
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (lastMsg.senderId !== user?.id) {
                        playReceiveSound();
                    }
                }
                setMessages(newMsgs);
            }
        } catch (err) {}
    };

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const data = await api.get(`/support/sessions/${sessionId}/messages`);
                if (!data.session) {
                    navigate('/support');
                    return;
                }
                setSession(data.session);
                setMessages(Array.isArray(data.messages) ? data.messages : []);
            } catch (err) {
                toastError("Unauthorized access to workspace.");
                navigate('/support');
            } finally {
                setLoading(false);
            }
        };
        fetchInitial();
        markRead();

        const handleVisibility = () => {
            if (!document.hidden) markRead();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        const interval = setInterval(fetchMessages, 5000);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [sessionId, navigate, toastError]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || sending) return;
        setSending(true);
        try {
            const data = await api.post(`/support/sessions/${sessionId}/messages`, {
                message: newMessage.trim()
            });
            setMessages(prev => [...prev, data]);
            setNewMessage('');
            setIsEmojiOpen(false);
            playSendSound();
        } catch (err) {
            toastError("Failed to deliver message.");
        } finally {
            setSending(false);
        }
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toastError("Only image assets are supported.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('scope', 'public-image');

        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const imgMsg = `[IMAGE]${res.url}`;
            const data = await api.post(`/support/sessions/${sessionId}/messages`, {
                message: imgMsg
            });
            setMessages(prev => [...prev, data]);
            playSendSound();
            success("Visual asset transmitted.");
        } catch (err) {
            toastError("Asset uplink failed.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 animate-progress w-full origin-left" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Opening support workspace...</div>
                </div>
            </div>
        );
    }

    const isAdmin = user?.role === 'admin';
    const active = isSessionActive(session);
    const canSend = active || isAdmin;
    const expiresAt = session?.expiresAt ? new Date(session.expiresAt) : null;

    const renderMessage = (msgContent) => {
        if (msgContent?.startsWith('[IMAGE]')) {
            const url = msgContent.replace('[IMAGE]', '');
            return <img src={url} alt="Attachment" className="max-w-xs md:max-w-md rounded-lg shadow-sm" />;
        }
        return msgContent;
    };

    return (
        <div className="h-screen bg-[#F5F5F7] text-slate-900 flex flex-col font-sans selection:bg-indigo-100 overflow-hidden">
            {/* Minimal Sub-Header */}
            <header className="h-20 border-b border-slate-200 flex items-center justify-between px-8 bg-white shrink-0 z-30">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/support')}
                        className="group p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-slate-500 hover:text-slate-900 shadow-sm"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div className="h-8 w-px bg-slate-200" />
                    <nav className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-900 transition-colors">Hub</button>
                        <span className="text-slate-300 text-[14px] font-light">/</span>
                        <button onClick={() => navigate('/support')} className="text-slate-400 hover:text-slate-900 transition-colors">Support Center</button>
                        <span className="text-slate-300 text-[14px] font-light">/</span>
                        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-indigo-50/50 text-indigo-600 rounded-xl border border-indigo-100/30 backdrop-blur-sm">
                            <Terminal size={12} className="opacity-80" />
                            <span>Case #{String(sessionId).padStart(6, '0')}</span>
                        </div>
                    </nav>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        canSend ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                        {canSend ? 'Active Access' : session?.status}
                    </div>
                    <div className="h-10 w-px bg-slate-200 mx-2" />
                    <div className="hidden md:flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Support Lead</div>
                            <div className="text-[11px] text-slate-900 font-bold">BizCode Specialist</div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 overflow-hidden">
                           <User size={20} />
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-grow flex overflow-hidden">
                {/* Details Sidebar */}
                <aside className="hidden lg:flex w-80 border-r border-slate-200 flex-col bg-slate-50/50 p-8 shrink-0 overflow-y-auto">
                    <div className="space-y-10">
                        <section>
                            <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Info size={12} /> Workspace Info
                            </h3>
                            <div className="space-y-3">
                                <div className="p-4 rounded-xl bg-white border border-slate-200/50 shadow-sm">
                                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Session ID</div>
                                    <div className="text-xs text-slate-900 font-mono">#{String(sessionId).padStart(6, '0')}</div>
                                </div>
                                <div className="p-4 rounded-xl bg-white border border-slate-200/50 shadow-sm">
                                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Expires On</div>
                                    <div className="text-xs text-slate-900 font-bold">
                                        {expiresAt ? expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-white border border-slate-200/50 shadow-sm">
                                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Source</div>
                                    <div className="text-xs text-slate-900 font-bold capitalize">{session?.source}</div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Shield size={12} /> Service Guarantees
                            </h3>
                            <div className="space-y-4">
                                {[
                                    'Product fit and customization guidance',
                                    'Deployment guidance',
                                    'Priority support requests',
                                    '1-on-1 senior technical help'
                                ].map((benefit) => (
                                    <div key={benefit} className="flex items-center gap-3 text-[11px] font-bold text-slate-600">
                                        <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                                        {benefit}
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="pt-10">
                            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100">
                                <div className="text-[10px] text-amber-700 font-black uppercase tracking-widest mb-2">Technical Note</div>
                                <p className="text-[11px] text-amber-800/70 leading-relaxed font-medium">
                                    Include project snippets, screenshots, or terminal output for faster resolution.
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Chat Flow */}
                <section className="flex-grow flex flex-col min-w-0 bg-[#F8FAFC] relative">
                    <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 md:p-12 space-y-10 relative z-10 scroll-smooth">
                        <div className="max-w-3xl mx-auto">
                            <div className="text-center py-12">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 shadow-sm">
                                    <Clock size={10} /> Beginning of support thread
                                </div>
                                <div className="h-px bg-slate-200 mt-6" />
                            </div>

                            <div className="space-y-8">
                                {messages.map((msg, idx) => {
                                    const isMe = msg.senderId === user?.id;
                                    const isSupport = msg.isAdmin;
                                    return (
                                        <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                            <div className={`flex gap-4 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                                    isSupport 
                                                        ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' // Enhanced visibility for Support
                                                        : (isMe ? 'bg-slate-900 border-slate-800 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-900 shadow-sm')
                                                }`}>
                                                    {isSupport ? <Shield size={14} /> : <User size={14} />}
                                                </div>
                                                <div className="space-y-1.5 min-w-0">
                                                    <div className={`px-5 py-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                                                        isSupport 
                                                        ? 'bg-indigo-50 border border-indigo-100 text-indigo-900 font-medium' 
                                                        : (isMe 
                                                            ? 'bg-slate-900 border border-slate-800 text-white font-medium' 
                                                            : 'bg-white border border-slate-200 text-slate-900')
                                                    }`}>
                                                        {renderMessage(msg.message)}
                                                    </div>
                                                    <div className={`text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        <span>·</span>
                                                        {isMe ? (isSupport ? 'You (Support)' : 'You') : (isSupport ? 'Support Lead' : 'Client Agent')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Input System */}
                    <div className="p-6 md:p-12 shrink-0 relative z-20 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent">
                        <div className="max-w-3xl mx-auto">
                            {canSend ? (
                                <div className="relative group/form flex-grow max-w-full">
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                    
                                    <form 
                                        onSubmit={handleSend}
                                        className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-3xl focus-within:border-slate-900 transition-all shadow-2xl shadow-slate-200/50 group"
                                    >
                                        <div className="flex items-center gap-1 pl-2">
                                            <button 
                                                type="button" 
                                                onClick={handleFileClick}
                                                disabled={uploading || sending}
                                                className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
                                            >
                                                {uploading ? <Loader2 size={18} className="animate-spin text-blue-500" /> : <Paperclip size={18} />}
                                            </button>
                                            
                                            <div className="relative">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setIsEmojiOpen(prev => !prev)}
                                                    className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
                                                >
                                                    <Smile size={18} />
                                                </button>
                                                {isEmojiOpen && (
                                                    <div className="absolute bottom-full left-0 mb-4 z-50 animate-in fade-in slide-in-from-bottom-5">
                                                        <div className="fixed inset-0 z-40" onClick={() => setIsEmojiOpen(false)}></div>
                                                        <div className="relative z-50">
                                                        { /* We can integrate an actual EmojiPicker here if available, fallback to simple emoji buttons for MVP */ }
                                                            <div className="bg-white border flex flex-wrap gap-2 p-3 w-64 border-slate-200 shadow-2xl rounded-2xl">
                                                                {['👍','👎','😄','😊','🚀','🔥','✅','🛑','🤔','💡','👀','🛠️'].map(emoji => (
                                                                    <button 
                                                                        key={emoji}
                                                                        type="button"
                                                                        onClick={() => { setNewMessage(prev => prev + emoji); setIsEmojiOpen(false); }}
                                                                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl text-lg transition-colors focus:bg-slate-200"
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <input 
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Discuss requirements, send code snippets, or request help..."
                                            className="flex-grow bg-transparent border-none outline-none text-sm px-2 py-4 text-slate-900 placeholder:text-slate-400 font-medium min-w-0"
                                            disabled={sending || uploading}
                                            maxLength={5000}
                                        />
                                        <button 
                                            type="submit"
                                            disabled={!newMessage.trim() || sending || uploading}
                                            className="h-14 w-14 shrink-0 flex items-center justify-center rounded-2xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-30 transition-all shadow-lg shadow-slate-200 group-focus-within:scale-[1.02]"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between gap-6 shadow-2xl shadow-slate-900/40">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center text-red-500">
                                            <Lock size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-white text-sm font-bold uppercase tracking-widest">Support Thread Read-Only</h4>
                                            <p className="text-slate-400 text-[11px] mt-1 font-medium">Access for this support session has expired or been finalized.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/support')}
                                        className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all shadow-xl shadow-white/10 flex items-center gap-2"
                                    >
                                        Open New Request <ExternalLink size={14} />
                                    </button>
                                </div>
                            )}
                            <div className="mt-4 text-center">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Private support conversation</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default EliteChat;
