import React, { useState, useRef, useEffect } from 'react';
import { Send, Hash, Command, Smile, Paperclip } from 'lucide-react';

const ChatInput = ({ onSend, onTyping, status, user }) => {
    const [content, setContent] = useState('');
    const textareaRef = useRef(null);
    const lastTypingSent = useRef(0);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (!content.trim() || status !== 'online') return;
        
        onSend(content.trim());
        setContent('');
        
        // Reset height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }

        // Typing trigger
        const now = Date.now();
        if (content && now - lastTypingSent.current > 2000) {
            onTyping();
            lastTypingSent.current = now;
        }
    }, [content, onTyping]);

    const isPro = user?.subscriptionPlan === 'pro';

    return (
        <div className="px-6 py-6 border-t border-slate-100 bg-white">
            <div className="max-w-5xl mx-auto relative">
                <div className="relative group">
                    <textarea
                        ref={textareaRef}
                        rows="1"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={status === 'online' ? "Join the discussion..." : "Connecting..."}
                        disabled={status !== 'online'}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-4 pl-14 pr-32 text-[14px] font-medium placeholder:text-slate-300 focus:outline-none focus:bg-white focus:border-blue-600/30 transition-all resize-none max-h-48 scrollbar-hide"
                    />

                    {/* Left Actions */}
                    <div className="absolute left-4 top-4 text-slate-300">
                        <Hash size={18} />
                    </div>

                    {/* Right Actions */}
                    <div className="absolute right-3 bottom-2 flex items-center gap-2">
                         <div className={`hidden sm:flex items-center px-2 py-1 rounded-lg ${isPro ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'} text-[10px] font-bold uppercase tracking-widest mr-2`}>
                            {isPro ? 'Pro Active' : 'Basic'}
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={!content.trim() || status !== 'online'}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                content.trim() && status === 'online'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95'
                                : 'bg-slate-100 text-slate-300'
                            }`}
                        >
                            <Send size={16} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                        <button title="Attach file" className="text-slate-300 hover:text-slate-600 transition-colors"><Paperclip size={16} /></button>
                        <button title="Emoji" className="text-slate-300 hover:text-slate-600 transition-colors"><Smile size={16} /></button>
                        <div className="w-px h-3 bg-slate-100 mx-2"></div>
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.1em]">Markdown Supported</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-slate-300 font-bold uppercase tracking-widest">
                        <Command size={10} className="mb-0.5" /> + Enter to send
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
