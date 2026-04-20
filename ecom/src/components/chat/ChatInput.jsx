import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Send, Hash, Smile, Paperclip, Terminal as TerminalIcon, X, CornerDownRight, Zap, Image as ImageIcon, Loader2 } from 'lucide-react';

const ChatInput = ({ onSend, onTyping, status, user, isPro, messageCount, replyingTo, onCancelReply }) => {
    const [content, setContent] = useState('');
    const [uploading, setUploading] = useState(false);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const lastTypingSent = useRef(0);
    const [isEmojiOpen, setIsEmojiOpen] = useState(false);
    const { info, error: toastError } = useToast();

    const charLimit = 100;
    const isLimitReached = !isPro && messageCount >= 2;

    const handleFileClick = () => {
        if (!isPro) {
            info("Pro Membership required for image attachments.");
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !isPro) return;

        if (!file.type.startsWith('image/')) {
            toastError("Only image files are supported.");
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
            
            // Send as image message
            onSend("", { 
                url: res.url, 
                isImage: true 
            });
            info("Image uploaded.");
        } catch (err) {
            toastError("Image upload failed.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        const trimmed = content.trim();
        if (!trimmed || status !== 'online') return;

        if (isLimitReached) {
            info("Communication limit reached. Upgrade to Pro for unlimited messaging.");
            return;
        }

        if (!isPro && trimmed.length > charLimit) {
            toastError(`Character limit exceeded (${trimmed.length}/${charLimit})`);
            return;
        }
        
        onSend(trimmed);
        setContent('');
        
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

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }

        const now = Date.now();
        if (content && now - lastTypingSent.current > 2000) {
            onTyping();
            lastTypingSent.current = now;
        }
    }, [content, onTyping]);

    const remainingChars = charLimit - content.length;

    return (
        <div className={`bg-white border-t border-slate-100 px-6 py-6 pb-10 transition-opacity ${isLimitReached ? 'opacity-80' : ''}`}>
            <div className="max-w-4xl mx-auto">
                {isLimitReached && (
                    <div className="mb-4 p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2 duration-500 shadow-xl shadow-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-amber-500 text-slate-900 rounded-lg flex items-center justify-center">
                                <Zap size={20} fill="currentColor" />
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black uppercase tracking-widest">Freemium Limit Exhausted</h4>
                                <p className="text-[10px] text-slate-400 font-medium">You have sent 2/2 messages. Upgrade to Pro for unlimited access.</p>
                            </div>
                        </div>
                        <button className="px-6 py-2 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-100 transition-all">
                            Upgrade to Pro
                        </button>
                    </div>
                )}

                <div className={`bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-slate-400 focus-within:bg-white transition-all shadow-sm ${isLimitReached ? 'grayscale pointer-events-none' : ''}`}>
                     {/* Header Utility Bar */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100/50 bg-slate-50/50">
                        <div className="flex items-center gap-4 relative">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileChange}
                                accept="image/*"
                            />
                            <button 
                                onClick={handleFileClick}
                                className={`transition-colors ${isPro ? 'text-slate-400 hover:text-slate-900' : 'text-slate-200 cursor-not-allowed'}`} 
                                title={isPro ? "Attach Asset" : "Pro Exclusive"}
                            >
                                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} strokeWidth={2.5} />}
                            </button>
                            
                            <div className="relative">
                                <button 
                                    onClick={() => {
                                        if (!isPro) {
                                            info("Pro Membership required for emojis.");
                                            return;
                                        }
                                        setIsEmojiOpen(!isEmojiOpen);
                                    }}
                                    className={`transition-colors ${isEmojiOpen ? 'text-slate-900' : (isPro ? 'text-slate-400 hover:text-slate-900' : 'text-slate-200 cursor-not-allowed')}`} 
                                    title={isPro ? "Emojis" : "Pro Exclusive"}
                                >
                                    <Smile size={14} strokeWidth={2.5} />
                                </button>
                                
                                {isEmojiOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsEmojiOpen(false)}></div>
                                        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 z-50 grid grid-cols-6 gap-2 animate-in fade-in zoom-in-95 duration-200">
                                            {['⚡', '🔥', '🚀', '💻', '🛠️', '📦', '✨', '💎', '🎉', '🔒', '💡', '✅'].map(emoji => (
                                                <button 
                                                    key={emoji}
                                                    onClick={() => {
                                                        setContent(prev => prev + emoji);
                                                        setIsEmojiOpen(false);
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded-lg text-lg transition-all active:scale-95"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="w-px h-3 bg-slate-200"></div>
                            {!isPro && (
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${remainingChars < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                    {content.length}/{charLimit} Chars
                                </span>
                            )}
                        </div>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${isPro ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                            <TerminalIcon size={10} />
                            <span className="text-[8px] font-black uppercase tracking-tight">{isPro ? 'Pro Member' : `${messageCount}/2 Freemium`}</span>
                        </div>
                    </div>

                    {/* Reply Context Preview */}
                    {replyingTo && (
                        <div className="px-4 py-2 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center gap-3 min-w-0">
                                <CornerDownRight size={12} className="text-blue-500 flex-shrink-0" />
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex-shrink-0">Replying to @{replyingTo.username || replyingTo.userName}</span>
                                    <div className="w-1 h-1 rounded-full bg-blue-200 flex-shrink-0"></div>
                                    <p className="text-[10px] text-blue-500/70 truncate italic shrink">{replyingTo.content}</p>
                                </div>
                            </div>
                            <button 
                                onClick={onCancelReply}
                                className="p-1 hover:bg-blue-100 rounded-md text-blue-400 hover:text-blue-600 transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    <div className="flex items-end gap-2 p-3">
                        <div className="flex-1 min-w-0">
                            <textarea
                                ref={textareaRef}
                                rows="1"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={status === 'online' ? "Type a message..." : "Connecting..."}
                                disabled={status !== 'online' || isLimitReached}
                                className="w-full bg-transparent border-none text-[13px] font-medium placeholder:text-slate-300 focus:ring-0 outline-none p-1 resize-none max-h-64 custom-scrollbar leading-relaxed"
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!content.trim() || status !== 'online' || isLimitReached}
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                content.trim() && status === 'online' && !isLimitReached
                                ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-800'
                                : 'bg-slate-200 text-white'
                            }`}
                        >
                            <Send size={14} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Footer Guide */}
                    <div className="px-4 py-1.5 bg-slate-50/30 border-t border-slate-100/30 flex items-center justify-between">
                         <div className="flex items-center gap-1 text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                            <Hash size={10} /> Community_Chat
                         </div>
                         {!isPro && (
                             <div className="text-[7px] font-black text-amber-600 uppercase tracking-widest">
                                Unlimited text & images with Pro Upgrade
                             </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
