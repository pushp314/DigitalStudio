import React, { useRef, useEffect } from 'react';
import MessageItem from './MessageItem';
import { Terminal, Search } from 'lucide-react';

const MessageList = ({ messages, user, historyLoading, searchQuery, typingUsers = {} }) => {
    const scrollRef = useRef(null);
    const lastMessageRef = useRef(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const filteredMessages = React.useMemo(() => {
        if (!searchQuery) return messages;
        const lowQuery = searchQuery.toLowerCase();
        return messages.filter(m => 
            m.content.toLowerCase().includes(lowQuery) || 
            m.userName.toLowerCase().includes(lowQuery)
        );
    }, [messages, searchQuery]);

    if (historyLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-white">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-slate-100 rounded-xl"></div>
                    <div className="absolute inset-0 w-12 h-12 border-4 border-blue-600 rounded-xl animate-pulse"></div>
                    <Terminal size={20} className="absolute inset-x-0 mx-auto top-3.5 text-blue-600 animate-bounce" />
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] animate-pulse">Syncing Conversation Buffers</p>
                </div>
            </div>
        );
    }

    if (filteredMessages.length === 0 && searchQuery) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Search size={32} className="text-slate-200" />
                </div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">No matches found</h3>
                <p className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">Refine your search parameters</p>
            </div>
        );
    }

    return (
        <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-6 md:px-12 py-10 space-y-8 scroll-smooth bg-white"
        >
            {filteredMessages.map((msg, i) => (
                <MessageItem 
                    key={msg.id ? `db-${msg.id}` : `opt-${msg.cid || i}`} 
                    msg={msg} 
                    isMe={msg.userId === user?.id} 
                    user={user}
                />
            ))}

            {/* Typing Indicator */}
            {Object.keys(typingUsers).length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in duration-500">
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-200"></span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {Object.values(typingUsers).map(u => u.name).join(', ')} {Object.keys(typingUsers).length > 1 ? 'are' : 'is'} typing...
                    </span>
                </div>
            )}
            
            <div ref={lastMessageRef} />
        </div>
    );
};

export default MessageList;
