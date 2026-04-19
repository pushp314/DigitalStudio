import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { 
    Send, Code, Shield, Zap, Info, Loader2, User, Crown, 
    Users, Terminal, Home, Search, Hash, Settings, 
    MoreHorizontal, Paperclip, Smile, Command, Circle,
    Cpu, Activity, Globe, Lock
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const DevChat = () => {
    const { user } = useContext(AuthContext);
    const { success, error } = useToast();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [onlineCount, setOnlineCount] = useState(1);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState(null);
    const [status, setStatus] = useState('connecting');
    const [historyLoading, setHistoryLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const scrollRef = useRef(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Fetch History
        api.get('/chat/history')
            .then(data => {
                setMessages(Array.isArray(data) ? data : []);
                setHistoryLoading(false);
            })
            .catch(err => console.error('Failed to load history', err));

        // Connect WebSocket
        const token = localStorage.getItem('token');
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        
        // Target Go backend on port 8080
        const wsHost = window.location.hostname;
        const wsPort = 8080; 
        const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}/api/chat/ws?token=${token}`;
        
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setStatus('online');
            success("Intelligence Link Established");
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'presence') {
                    setOnlineCount(data.count);
                } else if (data.type === 'system' && data.content.includes("Rate limit")) {
                    error(data.content);
                } else {
                    setMessages(prev => [...prev, data]);
                }
            } catch (err) {
                console.error("Message Processing Error:", err);
            }
        };

        ws.onclose = () => setStatus('offline');
        ws.onerror = () => setStatus('error');

        setSocket(ws);

        return () => ws.close();
    }, [user, navigate, success, error]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;

        socket.send(input);
        setInput('');
    };

    const formatCode = (content) => content.replace(/```/g, '');

    const filteredMessages = messages.filter(m => 
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-screen w-full bg-[#F8F9FA] flex overflow-hidden font-sans text-gray-900 border-t border-gray-100">
            
            {/* 1. ULTRA-MINIMAL LEFT TACTIC RAIL */}
            <div className="w-20 bg-white border-r border-gray-100 flex flex-col items-center py-8 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <button 
                    onClick={() => navigate('/')}
                    className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm group relative"
                >
                    <Home size={20} />
                    <span className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Exit to Dashboard</span>
                </button>

                <div className="mt-12 flex flex-col gap-6 flex-grow">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20 cursor-pointer group relative">
                        <Terminal size={20} />
                        <span className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Global Stream</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-all cursor-pointer group relative">
                        <Cpu size={20} />
                        <span className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Node Insights</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-all cursor-pointer group relative">
                        <Activity size={20} />
                        <span className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">Network Pulse</span>
                    </div>
                </div>

                <div className="mt-auto flex flex-col gap-6">
                   <button className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-all cursor-pointer">
                        <Settings size={20} />
                    </button>
                    <div className="w-12 h-12 rounded-2xl border-2 border-emerald-500/30 p-1 flex items-center justify-center relative">
                        <div className="w-full h-full rounded-xl bg-blue-50 flex items-center justify-center text-[11px] font-black text-blue-600 uppercase tracking-tighter shadow-inner">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                    </div>
                </div>
            </div>

            {/* 2. CENTER STACK: FED & INPUT */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                
                {/* Tactical Workspace Header */}
                <header className="h-[5rem] border-b border-gray-100 flex items-center justify-between px-10 bg-white/95 backdrop-blur-md z-20">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <h2 className="text-[15px] font-black tracking-tight text-gray-900 uppercase">Comm_Intelligence_Stream</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${
                                    status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]' : 
                                    status === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500'
                                }`}></span>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                                    {status === 'online' ? 'Secure Protocol Active' : status === 'connecting' ? 'Establishing Handshake...' : 'Link Disconnected'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative group flex items-center">
                            <Search className="absolute left-3 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={14} />
                            <input 
                                type="text" 
                                placeholder="Sync through history..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-10 pr-4 text-[11px] font-bold focus:outline-none focus:bg-white focus:border-blue-600/20 transition-all w-48 md:w-80"
                            />
                        </div>
                        <div className="w-px h-6 bg-gray-100 mx-1"></div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/50">
                            <Globe size={14} strokeWidth={2.5} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{onlineCount} Nodes</span>
                        </div>
                    </div>
                </header>

                {/* Main Message Stream */}
                <main className="flex-1 overflow-y-auto px-10 md:px-20 py-12 space-y-12 scroll-smooth bg-[#FFFFFF]" ref={scrollRef}>
                    {historyLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-gray-50 border-t-blue-600 rounded-full animate-spin"></div>
                                <Terminal className="absolute inset-0 m-auto text-blue-600/20" size={24} />
                            </div>
                            <div className="text-center">
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em] mb-2">Syncing History</p>
                                <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest animate-pulse">Requesting shards from edge nodes...</p>
                            </div>
                        </div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-32 h-32 bg-gray-50/50 rounded-[3rem] flex items-center justify-center mb-8 border border-gray-50 animate-pulse">
                                <Search size={40} className="text-gray-200" />
                            </div>
                            <h3 className="text-lg font-black text-gray-300 uppercase tracking-widest mb-2">No Fragment Found</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">The query yielded zero intelligence logs</p>
                        </div>
                    ) : (
                        filteredMessages.map((msg, i) => {
                            const isMe = msg.userId === user?.id;
                            const isSystem = msg.type === 'system';

                            if (isSystem) return (
                                <div key={i} className="flex justify-center py-4">
                                    <div className="px-8 py-3 bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-400 rounded-2xl uppercase tracking-[0.2em] shadow-sm flex items-center gap-4">
                                        <Lock size={12} className="opacity-40" />
                                        {msg.content}
                                    </div>
                                </div>
                            );

                            return (
                                <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group animate-in slide-in-from-bottom-4 duration-500`}>
                                    <div className={`flex items-center gap-4 mb-3 px-4`}>
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${msg.isPro ? 'text-amber-500' : 'text-gray-400'}`}>
                                            {msg.userName}
                                        </span>
                                        {msg.isPro && <Crown size={14} className="text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]" />}
                                        <div className="w-1 h-1 bg-gray-100 rounded-full"></div>
                                        <span className="text-[10px] text-gray-300 font-black opacity-0 group-hover:opacity-100 transition-opacity">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className={`max-w-[85%] md:max-w-[75%] px-8 py-6 rounded-[2.5rem] text-[14px] font-medium leading-[1.7] tracking-tight transition-all ${
                                        isMe 
                                        ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/10 rounded-tr-none' 
                                        : 'bg-white text-gray-700 border border-gray-200 rounded-tl-none shadow-sm hover:border-blue-100'
                                    }`}>
                                        {msg.type === 'code' ? (
                                            <div className="bg-[#F8F9FA] p-6 rounded-2xl border border-gray-200 mt-2 mb-1 shadow-inner relative group">
                                                <div className="flex gap-2.5 mb-6 opacity-30">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/50"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50"></div>
                                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50"></div>
                                                </div>
                                                <pre className="font-mono text-[13px] text-blue-900/90 whitespace-pre-wrap overflow-x-auto leading-relaxed selection:bg-blue-100 selection:text-blue-900 border-l-2 border-blue-100 pl-4">
                                                    {formatCode(msg.content)}
                                                </pre>
                                                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                    <Code size={16} className="text-gray-300 hover:text-blue-500" />
                                                </div>
                                            </div>
                                        ) : (
                                            <p dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }}></p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </main>

                {/* Fixed Master Input Controller */}
                <div className="p-8 border-t border-gray-100 bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.02)] relative z-20">
                    <form onSubmit={handleSend} className="max-w-5xl mx-auto relative group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4 text-gray-300 group-focus-within:text-blue-600 transition-all">
                             <button type="button" className="hover:scale-110 transition-transform"><Paperclip size={18} /></button>
                             <div className="w-px h-6 bg-gray-100"></div>
                             <Command size={18} />
                        </div>
                        
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message or paste code block..."
                            className="w-full bg-[#FAFBFC] border border-gray-200 rounded-[2.2rem] py-6 pl-18 pr-48 text-[14px] font-medium placeholder:text-gray-300 focus:outline-none focus:bg-white focus:border-blue-600/30 transition-all focus:shadow-2xl focus:shadow-blue-500/10 placeholder:uppercase placeholder:text-[10px] placeholder:font-black placeholder:tracking-[0.2em]"
                        />

                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
                            <button type="button" className="p-3 text-gray-300 hover:text-amber-500 transition-colors hidden sm:block"><Smile size={18} /></button>
                            <div className="flex items-center gap-3 px-5 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${user?.subscriptionPlan === 'pro' ? 'text-amber-500' : 'text-gray-400'}`}>
                                    {user?.subscriptionPlan === 'pro' ? 'Elite_Speed' : '5msg_min'}
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={!input.trim()}
                                    className="bg-gray-950 text-white w-12 h-12 rounded-[1.2rem] flex items-center justify-center hover:bg-blue-600 hover:scale-105 active:scale-95 disabled:opacity-20 transition-all shadow-xl shadow-gray-900/10"
                                >
                                    <Send size={18} strokeWidth={3} />
                                </button>
                            </div>
                        </div>

                        {/* Advanced Hints */}
                        <div className="absolute -top-12 left-8 flex items-center gap-4 opacity-0 group-focus-within:opacity-100 transition-all transform group-focus-within:translate-y-0 translate-y-2">
                             <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg">
                                 <Send size={10} strokeWidth={3} /> Shift + Enter
                             </div>
                             <span className="text-[9px] text-gray-300 font-black uppercase tracking-widest">For New Line</span>
                        </div>
                    </form>
                    <div className="mt-6 flex justify-between items-center max-w-5xl mx-auto px-6 border-t border-gray-50 pt-6">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] flex items-center gap-3">
                           🔒 SHA-256 Intelligence Hash Verified
                        </p>
                        <div className="flex items-center gap-10">
                            <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-2">
                                <Code size={13} /> Snippet Mode
                            </button>
                            <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-2">
                                <Activity size={13} /> Protocol Stats
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. CONTEXTUAL PANEL: NODES & OPS */}
            <div className="hidden xl:flex w-80 bg-white border-l border-gray-100 flex-col overflow-hidden shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="p-10 border-b border-gray-100">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-10 flex justify-between items-center">
                        Active_Pro_Nodes
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 group cursor-pointer">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[12px] font-black text-blue-600">
                                    {user?.name?.charAt(0)}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex-1">
                                <p className="text-[12px] font-black text-gray-900 tracking-tight">{user?.name} (L5)</p>
                                <p className="text-[9px] text-emerald-500 font-extrabold uppercase tracking-widest">Online_Validated</p>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-50 opacity-40 grayscale group hover:opacity-100 hover:grayscale-0 transition-all cursor-not-allowed">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[12px] font-black text-gray-300">
                                    S
                                </div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">System_Analyzer_01</p>
                                    <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest italic">Listening...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 flex-grow overflow-y-auto">
                    <div className="p-8 rounded-[3rem] bg-gray-950 text-white shadow-2xl shadow-gray-900/10 relative overflow-hidden group border border-gray-800">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-700 animate-pulse">
                            <Crown size={48} />
                        </div>
                        <h4 className="text-xl font-black tracking-tight mb-4 leading-tight uppercase text-blue-400">Elite_Status</h4>
                        <p className="text-[10px] text-gray-400 leading-relaxed mb-10 font-bold uppercase tracking-widest">Access the full-velocity intelligence stream today.</p>
                        <button 
                            onClick={() => navigate('/pricing')}
                            className="w-full py-5 bg-white text-gray-950 text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all"
                        >
                            Elevate Now
                        </button>
                    </div>

                    <div className="mt-12 space-y-10 px-4">
                        <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6 border-b border-gray-50 pb-4">Stream_Context</h4>
                            <div className="space-y-8">
                                <div className="flex gap-5">
                                    <Zap size={16} className="text-blue-600" />
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-tighter">Throughput</p>
                                        <p className="text-[10px] text-gray-400 font-bold tracking-widest">
                                            {user?.subscriptionPlan === 'pro' ? 'UNLIMITED_BURST' : '5_MSG_PEAK'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-5">
                                    <Shield size={16} className="text-emerald-500" />
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-tighter">Security</p>
                                        <p className="text-[10px] text-emerald-600/80 font-bold tracking-widest uppercase italic">End-to-End Edge</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 mt-auto bg-[#FAFBFC] border-t border-gray-50">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.5em] flex items-center justify-center gap-3">
                        <Terminal size={12} /> Digital_Nexus_v2.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DevChat;
