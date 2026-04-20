import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
    Clock, 
    Edit3, 
    Trash2, 
    User, 
    Check, 
    CheckCheck, 
    ShieldCheck, 
    Zap,
    ExternalLink,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    X,
    Maximize2,
    Copy,
    AlertTriangle,
    Pin,
    Hash,
    MessageSquare
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const IMAGE_URL_REGEX = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))$/i;

const MessageItem = ({ msg, isMe, user, onDelete, onEdit, onReply }) => {
    const navigate = useNavigate();
    const { success, error, info } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(msg.content);
    const [selectedImage, setSelectedImage] = useState(null);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isSending = msg.status === 'sending';
    const isError = msg.status === 'error';
    const isRead = msg.status === 'read' || msg.isRead;
    const isAdmin = user?.role === 'admin';

    const handleUpdate = () => {
        if (editContent.trim() === msg.content) {
            setIsEditing(false);
            return;
        }
        onEdit(msg.id, editContent);
        setIsEditing(false);
    };

    const handleCopyId = () => {
        navigator.clipboard.writeText(msg.id);
        success("Message ID copied.");
        setIsMenuOpen(false);
    };

    const handleReport = async () => {
        try {
            await api.post(`/chat/messages/${msg.id}/report`);
            success("Report submitted.");
        } catch (err) {
            error("Reporting failed.");
        }
        setIsMenuOpen(false);
    };

    const handlePin = async () => {
        if (!isAdmin) {
            info("Pinning restricted to admin nodes.");
            return;
        }
        try {
            await api.post(`/chat/messages/${msg.id}/pin`);
            success(msg.isPinned ? "Message unpinned." : "Message pinned.");
        } catch (err) {
            error("Failed to pin message.");
        }
        setIsMenuOpen(false);
    };

    const getImages = () => {
        if (msg.isImage && msg.attachmentUrl) {
            return [msg.attachmentUrl];
        }
        if (msg.content && msg.content.startsWith('[IMAGES]')) {
            try {
                return JSON.parse(msg.content.replace('[IMAGES]', ''));
            } catch (e) {
                return [];
            }
        }
        if (msg.content && msg.content.startsWith('[IMAGE]')) {
            return [msg.content.replace('[IMAGE]', '')];
        }
        if (msg.content && IMAGE_URL_REGEX.test(msg.content.trim())) {
            return [msg.content.trim()];
        }
        return [];
    };

    const images = getImages();
    const hasImages = images.length > 0;
    const isOnlyImage = hasImages && (msg.isImage || (msg.content && (msg.content.startsWith('[IMAGES]') || msg.content.startsWith('[IMAGE]') || IMAGE_URL_REGEX.test(msg.content.trim()))));

    if (msg.type === 'system') {
        return (
            <div className="flex justify-center py-6 px-10">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">{msg.content}</p>
            </div>
        );
    }

    return (
        <div className={`group flex flex-col w-full px-6 md:px-10 py-3 transition-colors hover:bg-slate-50/50 relative animate-in fade-in duration-500 ${msg.isPinned ? 'bg-amber-50/30' : ''}`}>
            
            <div className={`flex items-start gap-4 ${isMe ? 'flex-row-reverse text-right' : 'flex-row'} relative group/msgbody`}>
                {/* Action Bar Dropdown Implementation - Now Centered and Closer for High Interaction */}
                <div className={`absolute top-[-14px] ${isMe ? 'right-0' : 'left-0'} opacity-0 group-hover/msgbody:opacity-100 transition-all flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-md z-20 hover:scale-105 transform origin-center`}>
                    {(isMe || isAdmin) && !isEditing && (
                        <>
                            <button onClick={() => setIsEditing(true)} title="Edit Message" className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors rounded-md hover:bg-slate-50">
                                <Edit3 size={12} strokeWidth={2.5} />
                            </button>
                            <button onClick={() => onDelete(msg.id)} title="Delete Message" className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-md hover:bg-rose-50">
                                <Trash2 size={12} strokeWidth={2.5} />
                            </button>
                        </>
                    )}
                    
                    <div className="w-px h-3 bg-slate-100 mx-0.5"></div>
                    
                    <div className="relative">
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`p-1.5 transition-colors rounded-md ${isMenuOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            <MoreHorizontal size={12} strokeWidth={2.5} />
                        </button>

                        {isMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                                <div className={`absolute top-full ${isMe ? 'right-0' : 'left-0'} mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 text-left`}>
                                    <button onClick={() => { onReply(msg); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                                        <MessageSquare size={13} className="text-blue-500" />
                                        Reply
                                    </button>
                                    <button onClick={handleCopyId} className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                                        <Hash size={13} className="text-slate-400" />
                                        Copy Message ID
                                    </button>
                                    {isAdmin && (
                                        <button onClick={handlePin} className={`w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold rounded-lg transition-colors ${msg.isPinned ? 'text-amber-600 bg-amber-50' : 'text-slate-600 hover:bg-slate-50'}`}>
                                            <Pin size={13} className={msg.isPinned ? 'text-amber-500' : 'text-slate-400'} />
                                            {msg.isPinned ? 'Unpin Message' : 'Pin Message'}
                                        </button>
                                    )}
                                    <div className="h-px bg-slate-100 my-1.5 mx-1"></div>
                                    <button onClick={handleReport} className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                        <AlertTriangle size={13} className="text-rose-400" />
                                        Report Message
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                {/* Avatar */}
                <Link 
                    to={`/@${msg.username || msg.userId}`}
                    className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 hover:border-slate-900 transition-all cursor-pointer group/avatar relative shadow-sm"
                >
                    {msg.userAvatar ? (
                        <img src={msg.userAvatar} alt={msg.userName} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[11px] font-bold uppercase">{msg.userName?.charAt(0)}</span>
                    )}

                    {/* Pro/Elite Tiny Badge on Avatar corner */}
                    {(msg.isPro || msg.role === 'admin' || msg.isBot) && (
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                            msg.isBot ? 'bg-indigo-600' : (msg.role === 'admin' ? 'bg-rose-600' : 'bg-amber-500')
                        }`}>
                            {msg.isBot ? <Zap size={8} className="text-white" fill="currentColor" /> : <Zap size={8} className="text-white" fill="currentColor" />}
                        </div>
                    )}
                </Link>

                <div className={`flex-1 min-w-0 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {msg.replyToContent && (
                        <div className={`mb-1 px-3 py-1.5 bg-slate-100/50 border-l-2 border-blue-500 rounded-r-lg max-w-md ${isMe ? 'text-right' : 'text-left'} cursor-pointer hover:bg-slate-100 transition-all`} onClick={() => {/* Scroll to Parent Logic */}}>
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-0.5">@{msg.replyToName}</p>
                            <p className="text-[10px] text-slate-500 truncate italic">{msg.replyToContent}</p>
                        </div>
                    )}
                    <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className={`text-[12px] font-bold text-slate-900 tracking-tight flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            {msg.userName}
                            {msg.isBot && (
                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-md border border-indigo-100 flex items-center gap-1">
                                    Intelligence
                                </span>
                            )}
                            {msg.role === 'admin' && !msg.isBot && (
                                <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-black uppercase tracking-widest rounded-md border border-rose-100 flex items-center gap-1">
                                    <ShieldCheck size={8} /> Admin
                                </span>
                            )}
                            {msg.isPro && !msg.isBot && msg.role !== 'admin' && (
                                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest rounded-md border border-amber-100 flex items-center gap-1">
                                    <Zap size={8} fill="currentColor" /> Pro
                                </span>
                            )}
                            {msg.isPinned && <Pin size={10} className="text-amber-500 fill-amber-500" />}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                        <span className={`text-[10px] font-bold text-slate-400 font-mono flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                             {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             {isMe && (
                                <span className="flex items-center translate-y-[0.5px]">
                                    {isRead ? <CheckCheck size={12} strokeWidth={3} className="text-blue-500" /> : <Check size={12} strokeWidth={3} className="text-slate-300" />}
                                </span>
                             )}
                        </span>
                    </div>

                    {isEditing ? (
                        <div className="w-full max-w-2xl bg-white border border-slate-900/20 rounded-xl overflow-hidden shadow-xl">
                             <textarea 
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-transparent border-none p-4 text-[13px] font-medium outline-none min-h-[100px] resize-none"
                                autoFocus
                            />
                            <div className="bg-slate-50 border-t border-slate-100 p-2 flex justify-end gap-2">
                                <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-900">Discard</button>
                                <button onClick={handleUpdate} className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold shadow-sm">Authorize Update</button>
                            </div>
                        </div>
                    ) : (
                        <div className={`w-full flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {hasImages && (
                                <div className={`flex flex-wrap gap-2 mb-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {images.slice(0, 4).map((img, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => { setSelectedImage(img); setCarouselIndex(idx); }}
                                            className="relative group/img cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-all hover:border-slate-400"
                                            style={{ 
                                                width: images.length === 1 ? '100%' : '140px',
                                                height: images.length === 1 ? 'auto' : '140px',
                                                maxWidth: '500px'
                                            }}
                                        >
                                            <img src={img} alt="Visual Node" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700" />
                                            {images.length > 4 && idx === 3 && (
                                                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                                                    <span className="text-white text-lg font-black">+{images.length - 4}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!isOnlyImage && (
                                <div className={`max-w-[85%] md:max-w-2xl px-5 py-4 rounded-[1.5rem] shadow-sm transition-all ${
                                    isMe 
                                        ? 'bg-slate-900 text-white border border-slate-800 rounded-tr-none' 
                                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                } ${msg.isPinned ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}>
                                    <div className={`prose prose-sm max-w-none prose-p:leading-relaxed ${
                                        isMe ? 'prose-invert text-white' : 'prose-slate text-slate-800'
                                    } prose-a:text-blue-400 prose-a:font-bold prose-code:text-pink-400`}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {selectedImage && (
                <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
                    <header className="p-6 flex items-center justify-between text-white border-b border-white/10">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold tracking-tight">{msg.userName}</span>
                            <span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">Visual Data Packet #{carouselIndex + 1}</span>
                        </div>
                        <button onClick={() => setSelectedImage(null)} className="p-3 hover:bg-white/10 rounded-full transition-all">
                            <X size={24} />
                        </button>
                    </header>

                    <div className="flex-1 flex items-center justify-center relative p-10 group/modal">
                        {images.length > 1 && (
                            <button 
                                onClick={() => {
                                    const newIdx = (carouselIndex - 1 + images.length) % images.length;
                                    setCarouselIndex(newIdx);
                                    setSelectedImage(images[newIdx]);
                                }}
                                className="absolute left-10 p-4 bg-white/5 hover:bg-white/20 text-white rounded-full transition-all focus:outline-none"
                            >
                                <ChevronLeft size={32} />
                            </button>
                        )}

                        <img 
                            src={selectedImage} 
                            alt="Lightbox Asset" 
                            className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-500"
                        />

                        {images.length > 1 && (
                            <button 
                                onClick={() => {
                                    const newIdx = (carouselIndex + 1) % images.length;
                                    setCarouselIndex(newIdx);
                                    setSelectedImage(images[newIdx]);
                                }}
                                className="absolute right-10 p-4 bg-white/5 hover:bg-white/20 text-white rounded-full transition-all focus:outline-none"
                            >
                                <ChevronRight size={32} />
                            </button>
                        )}
                    </div>

                    <footer className="p-8 flex items-center justify-center gap-4 bg-slate-950">
                        {images.map((img, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => { setCarouselIndex(idx); setSelectedImage(img); }}
                                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${carouselIndex === idx ? 'border-blue-500 scale-110 shadow-lg shadow-blue-500/20' : 'border-white/10 opacity-40 hover:opacity-100'}`}
                            >
                                <img src={img} className="w-full h-full object-cover" alt="Preview" />
                            </button>
                        ))}
                    </footer>
                </div>
            )}
        </div>
    );
};

export default React.memo(MessageItem);
