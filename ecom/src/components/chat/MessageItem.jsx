import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Crown, Lock, Check, CheckCheck } from 'lucide-react';

const MessageItem = ({ msg, isMe, user }) => {
    const isSending = msg.status === 'sending';
    const isError = msg.status === 'error';
    const isDelivered = msg.status === 'delivered';
    const isRead = msg.status === 'read' || msg.isRead;
    const isSystem = msg.type === 'system';

    if (isSystem) {
        return (
            <div className="flex justify-center py-4 px-4 w-full">
                <div className="px-6 py-2 bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-400 rounded-full uppercase tracking-widest flex items-center gap-3 shadow-sm">
                    <Lock size={12} className="opacity-40" />
                    {msg.content}
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} w-full group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {/* Meta info */}
            <div className={`flex items-center gap-3 mb-2 px-1`}>
                <span className={`text-[11px] font-bold tracking-tight ${msg.isPro ? 'text-blue-600' : 'text-slate-500'}`}>
                    {msg.userName}
                    {msg.isPro && <Crown size={12} className="inline ml-1 mb-0.5 text-blue-500" />}
                </span>
                <span className="text-[10px] text-slate-300 font-medium">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                
                {isMe && (
                    <div className="flex items-center ml-1">
                        {isError ? (
                            <span className="text-[9px] text-rose-500 font-bold uppercase tracking-tighter">!</span>
                        ) : isSending ? (
                            <Check size={12} className="text-white/40" />
                        ) : isRead ? (
                            <CheckCheck size={12} className="text-blue-400" />
                        ) : isDelivered ? (
                            <CheckCheck size={12} className="text-white/50" />
                        ) : (
                            <Check size={12} className="text-white/50" />
                        )}
                    </div>
                )}
            </div>

            {/* Content Bubble */}
            <div className={`max-w-[85%] md:max-w-[70%] px-5 py-4 rounded-2xl text-[14px] leading-relaxed transition-all ${
                isMe 
                ? (isError ? 'bg-rose-500 text-white' : (isSending ? 'bg-blue-500/80 text-white' : 'bg-blue-600 text-white')) 
                : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none hover:border-slate-300 shadow-sm'
            } ${isSending ? 'opacity-70' : 'opacity-100'}`}>
                <div className={`prose prose-sm max-w-none ${isMe ? 'prose-invert' : 'prose-slate'}`}>
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({node, ...props}) => <p className="mb-0" {...props} />,
                            pre: ({node, ...props}) => <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg my-2 overflow-x-auto text-[13px] font-mono" {...props} />,
                            code: ({node, inline, ...props}) => (
                                inline 
                                ? <code className="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-[12px]" {...props} />
                                : <code {...props} />
                            )
                        }}
                    >
                        {msg.content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default React.memo(MessageItem);
