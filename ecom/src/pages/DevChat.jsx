import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useChat } from '../hooks/useChat';

// Components
import ChatHeader from '../components/chat/ChatHeader';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import ChatSidebar from '../components/chat/ChatSidebar';

// Icons for navigation rail
import { Home, Terminal, Settings, Layout, Search, Command } from 'lucide-react';

const DevChat = () => {
    const { user } = useContext(AuthContext);
    const { success, error } = useToast();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const {
        messages,
        onlineCount,
        status,
        historyLoading,
        typingUsers,
        sendMessage,
        sendTyping
    } = useChat(user);

    const handleSendMessage = (content) => {
        const success = sendMessage(content);
        if (!success) {
            error("Connection lost. Retrying...");
        }
    };

    if (!user) return null;

    return (
        <div className="h-[100dvh] w-full bg-slate-50 flex overflow-hidden font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
            
            {/* 1. TACTICAL RAIL (Slim Sidebar) */}
            <div className="hidden sm:flex w-[70px] bg-white border-r border-slate-100 flex-col items-center py-6 z-30 justify-between shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                <div className="flex flex-col gap-6 items-center w-full">
                    <button 
                        onClick={() => navigate('/')}
                        className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50/30 transition-all group relative"
                    >
                        <Home size={20} strokeWidth={2} />
                        <span className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none z-50 uppercase tracking-widest font-black shadow-xl">Dashboard</span>
                    </button>

                    <div className="w-8 h-px bg-slate-100"></div>

                    <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 cursor-pointer ring-4 ring-blue-50 transition-transform active:scale-95">
                        <Terminal size={20} strokeWidth={2} />
                    </div>
                    
                    <div className="w-11 h-11 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all cursor-pointer group relative">
                        <Layout size={20} strokeWidth={2} />
                        <span className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none z-50 uppercase tracking-widest font-black shadow-xl">Explore</span>
                    </div>
                </div>

                <div className="flex flex-col gap-6 items-center w-full">
                    <button className="w-11 h-11 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all cursor-pointer">
                        <Settings size={20} strokeWidth={2} />
                    </button>
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-[11px] font-black text-blue-600 border border-blue-200/50 shadow-inner">
                        {user?.name?.charAt(0)}
                    </div>
                </div>
            </div>

            {/* 2. CONVERSATION LAYER */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                <ChatHeader 
                    status={status} 
                    onlineCount={onlineCount} 
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />

                <div className="flex-1 overflow-hidden flex flex-col relative">
                    <MessageList 
                        messages={messages} 
                        user={user} 
                        historyLoading={historyLoading} 
                        searchQuery={searchQuery}
                        typingUsers={typingUsers}
                    />

                    {/* Disconnected Overlay */}
                    {status !== 'online' && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] pointer-events-none z-20 transition-all duration-500">
                             <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
                                 <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div>
                                 {status === 'connecting' ? 'Re-Establishing Uplink...' : 'Connection Interrupted'}
                             </div>
                        </div>
                    )}
                </div>

                <ChatInput 
                    onSend={handleSendMessage} 
                    onTyping={sendTyping}
                    status={status} 
                    user={user}
                />
            </div>

            {/* 3. INFORMATION LAYER */}
            <ChatSidebar user={user} onlineCount={onlineCount} />
            
        </div>
    );
};

export default DevChat;
