import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useChat } from '../hooks/useChat';
import api from '../services/api';
import { normalizeUser } from '../utils/normalizers';

// Components
import ChatHeader from '../components/chat/ChatHeader';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatSettingsModal from '../components/chat/ChatSettingsModal';

// Calibrated Lucide Icons (2.5px weighted)
import { 
    Home, 
    Terminal, 
    Settings, 
    Layout, 
    ArrowRight,
    Circle,
    User,
    Compass,
    Pin,
    MessageSquare,
    Package,
    Shield
} from 'lucide-react';

const DevChat = () => {
    const { user, setUser } = useContext(AuthContext);
    const { info, error, success } = useToast();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [usernameInput, setUsernameInput] = useState('');
    const [isPromptingUsername, setIsPromptingUsername] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    
    const [chatSettings, setChatSettings] = useState({
        sounds: true,
        hideTyping: false,
        hideReadReceipts: false,
        compactMode: false
    });
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const {
        messages,
        onlineCount,
        onlineUsers,
        status,
        historyLoading,
        typingUsers,
        sendMessage,
        deleteMessage,
        editMessage,
        sendTyping
    } = useChat(user);

    // ... (rest of the logic remains same)

    return (
        <div className="h-[100dvh] w-full bg-white flex overflow-hidden font-sans text-slate-900 antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            {/* Professional Identity Gating */}
            {isPromptingUsername && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-8 sm:p-10 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-500">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-lg flex items-center justify-center mb-6">
                            <Terminal size={24} />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight mb-2">Create Your Profile</h2>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                            Select a unique handle for the BizCode community chat. Your identity will be tied to your verified profile.
                        </p>
                        
                        <div className="relative group mb-8">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                            <input 
                                type="text"
                                placeholder="handle"
                                value={usernameInput}
                                onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-4 pl-10 pr-6 text-sm font-bold outline-none focus:border-slate-900 transition-all"
                            />
                        </div>

                        <button 
                            onClick={handleSetUsername}
                            className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                        >
                            Confirm Profile
                        </button>
                    </div>
                </div>
            )}

            {/* Tactical Navigation Rail */}
            <nav className="hidden sm:flex w-16 bg-slate-50 border-r border-slate-200 flex-col items-center py-6 z-30 justify-between">
                <div className="flex flex-col gap-6 items-center w-full">
                    <button 
                        onClick={() => navigate('/')}
                        className="p-2.5 text-slate-400 hover:text-slate-900 transition-all rounded-lg hover:bg-slate-100 group relative"
                        title="Return to BizCode"
                    >
                        <Home size={20} strokeWidth={2.5} />
                        <span className="absolute left-16 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">Back to Home</span>
                    </button>

                    <div className="w-8 h-px bg-slate-200"></div>

                    <button 
                        onClick={() => navigate('/chat')}
                        className="p-2.5 bg-slate-900 text-white rounded-lg shadow-sm group relative"
                        title="Community Chat"
                    >
                        <Terminal size={20} strokeWidth={2.5} />
                        <span className="absolute left-16 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">Developer Chat</span>
                    </button>
                    
                    <button 
                        onClick={() => navigate('/assets')}
                        className="p-2.5 text-slate-400 hover:text-slate-900 transition-all rounded-lg hover:bg-slate-100 group relative"
                        title="Explore Assets"
                    >
                        <Package size={20} strokeWidth={2.5} />
                        <span className="absolute left-16 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">Explore Assets</span>
                    </button>

                    <button 
                        onClick={() => navigate('/support')}
                        className="p-2.5 text-slate-400 hover:text-indigo-600 transition-all rounded-lg hover:bg-indigo-50 group relative"
                        title="Support"
                    >
                        <Shield size={20} strokeWidth={2.5} />
                        <span className="absolute left-16 px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">Support</span>
                    </button>
                </div>

                <div className="flex flex-col gap-6 items-center w-full">
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className={`p-2.5 rounded-lg transition-all ${isSettingsOpen ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                    >
                        <Settings size={20} strokeWidth={2.5} />
                    </button>
                    <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-300">
                        {user?.name?.charAt(0)}
                    </div>
                </div>
            </nav>

            {/* Conversation Deck */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                <ChatHeader 
                    status={status} 
                    onlineCount={onlineCount} 
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    isSelectionMode={isSelectionMode}
                    onToggleSelection={() => setIsSelectionMode(!isSelectionMode)}
                    onOpenSidebar={() => setSidebarOpen(true)}
                    user={user}
                />

                <div className="flex-1 overflow-hidden flex flex-col relative">
                    {/* Header Pinned Bar */}
                    {pinnedMessages.length > 0 && (
                        <div className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-100 px-4 sm:px-8 py-2 flex items-center gap-4 overflow-x-auto no-scrollbar animate-in slide-in-from-top duration-500 shrink-0">
                            <div className="flex items-center gap-2 text-[9px] font-black text-amber-600 uppercase tracking-[0.2em] bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex-shrink-0">
                                <Pin size={10} className="fill-amber-500" /> Pinned
                            </div>
                            <div className="flex gap-4">
                                {pinnedMessages.map(m => (
                                    <button 
                                        key={m.id} 
                                        onClick={() => scrollToMessage(m.id)}
                                        className="whitespace-nowrap flex items-center gap-2 group transition-all"
                                    >
                                        <p className="text-[10px] font-bold text-slate-900 group-hover:text-blue-600 truncate max-w-[150px] sm:max-w-[300px]">{m.content}</p>
                                        <ArrowRight size={10} className="text-slate-300 group-hover:text-blue-500" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {isSelectionMode && user?.role === 'admin' && (
                        <div className="bg-slate-900 text-white px-4 sm:px-8 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300 sticky top-0 z-20 shrink-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest">{selectedIds.length} <span className="hidden sm:inline">Messages</span> Selected</p>
                            <div className="flex gap-4">
                                <button onClick={() => { setSelectedIds([]); setIsSelectionMode(false); }} className="text-[10px] font-bold uppercase hover:text-slate-300 transition-all">Cancel</button>
                                <button onClick={handleBulkDelete} className="bg-rose-600 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all">Delete</button>
                            </div>
                        </div>
                    )}

                    <MessageList 
                        messages={messages} 
                        user={user} 
                        historyLoading={historyLoading} 
                        searchQuery={searchQuery}
                        typingUsers={typingUsers}
                        onDelete={deleteMessage}
                        onEdit={editMessage}
                        onReply={setReplyingTo}
                        isSelectionMode={isSelectionMode}
                        onToggleSelection={(id) => {
                            if (!isSelectionMode) setIsSelectionMode(true);
                            setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
                        }}
                        selectedIds={selectedIds}
                    />

                    {/* Connection Status Indicator */}
                    {(status !== 'online' && !historyLoading) && (
                         <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-slate-900/90 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-xl flex items-center gap-3 animate-pulse z-20">
                             <Circle size={8} fill="currentColor" className="text-amber-500" />
                             {status === 'connecting' ? 'Connecting...' : 'Reconnecting...'}
                         </div>
                    )}
                </div>

                <ChatInput 
                    onSend={handleSendMessage} 
                    onTyping={sendTyping}
                    status={status} 
                    user={user}
                    isPro={isPro}
                    messageCount={userMessageCount}
                    replyingTo={replyingTo}
                    onCancelReply={() => setReplyingTo(null)}
                />
            </div>

            {/* Mobile Sidebar Backdrop */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[50] lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <ChatSidebar 
                user={user} 
                onlineCount={onlineCount} 
                onlineUsers={onlineUsers}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <ChatSettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)}
                settings={chatSettings}
                onUpdate={handleUpdateSettings}
                user={user}
            />
            
        </div>
    );
};

export default DevChat;
