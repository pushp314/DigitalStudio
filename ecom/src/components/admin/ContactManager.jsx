import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { MessageSquare, Mail, Send, CheckCircle, Clock } from 'lucide-react';

const ContactManager = () => {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();
    const [replyText, setReplyText] = useState({});
    const [replyingTo, setReplyingTo] = useState(null);

    const { data: inquiries, isLoading } = useQuery({
        queryKey: ['admin-inquiries'],
        queryFn: () => api.get('/admin/contact/').then(res => Array.isArray(res) ? res : [])
    });

    const replyMutation = useMutation({
        mutationFn: ({ id, reply }) => api.patch(`/admin/contact/${id}/reply`, { reply }),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-inquiries']);
            success('Reply saved successfully');
            setReplyingTo(null);
        },
        onError: () => toastError('Failed to send reply')
    });

    const handleReply = (id) => {
        if (!replyText[id]?.trim()) return;
        replyMutation.mutate({ id, reply: replyText[id] });
    };

    if (isLoading) return <div className="p-10 text-center animate-pulse font-black text-gray-400">Loading inquiries...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-700 relative" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 rounded-bl-full -translate-y-4 translate-x-4"></div>
                <div className="relative z-10">
                    <h2 className="text-xl font-black text-black tracking-tight leading-none mb-3">Communication Hub</h2>
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest">{inquiries?.length || 0} Inquiries</span>
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                            Live Support Stream
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {(inquiries || []).map((inquiry) => (
                    <div key={inquiry.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all group">
                        <div className="flex flex-col lg:flex-row justify-between gap-6 mb-6">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-black shadow-inner group-hover:scale-105 transition-transform">
                                    <Mail size={16} strokeWidth={2.5} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-black text-base text-black tracking-tight leading-none mb-2">{inquiry.subject}</h3>
                                    <div className="flex items-center gap-3">
                                        <p className="text-[10px] font-black text-black uppercase tracking-widest">{inquiry.name}</p>
                                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{inquiry.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* AI Triage */}
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                                    inquiry.priority >= 8 ? 'bg-red-50 text-red-600 border-red-100 ring-4 ring-red-500/10' : 
                                    inquiry.priority >= 5 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                    'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                    <span className="opacity-40">Lv.</span>{inquiry.priority || 1}
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest shadow-sm transition-all duration-500 ${
                                    inquiry.sentiment === 'urgent' ? 'bg-rose-600 text-white border-rose-600' :
                                    inquiry.sentiment === 'frustrated' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                    inquiry.sentiment === 'happy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    inquiry.sentiment === 'confused' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                    'bg-gray-50 text-gray-400 border-gray-100'
                                }`}>
                                    {inquiry.sentiment === 'happy' && '✨'}
                                    {inquiry.sentiment === 'frustrated' && '⚠️'}
                                    {inquiry.sentiment === 'urgent' && '🚨'}
                                    {inquiry.sentiment === 'confused' && '❓'}
                                    {inquiry.sentiment === 'calm' && '🔹'}
                                    {inquiry.sentiment || 'Pending'}
                                </div>

                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all duration-300 ${
                                    inquiry.status === 'replied' 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                    {inquiry.status}
                                </span>
                                <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-300 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    <Clock size={10} strokeWidth={3} />
                                    {new Date(inquiry.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50/50 rounded-xl p-6 mb-6 border border-gray-100 italic relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 text-2xl opacity-5 select-none text-black">"</div>
                            <p className="text-gray-700 leading-relaxed font-bold text-xs">“{inquiry.message}”</p>
                        </div>

                        {inquiry.reply ? (
                            <div className="border-t border-gray-50 pt-6">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shadow-lg">
                                        <Send size={14} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[8px] font-black text-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                                            Admin Response
                                        </p>
                                        <div className="bg-black/5 border border-black/5 p-5 rounded-xl">
                                            <p className="text-gray-600 font-bold text-xs leading-relaxed">{inquiry.reply}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="border-t border-gray-50 pt-6">
                                {replyingTo === inquiry.id ? (
                                    <div className="space-y-4">
                                        <textarea 
                                            value={replyText[inquiry.id] || ''}
                                            onChange={(e) => setReplyText({ ...replyText, [inquiry.id]: e.target.value })}
                                            placeholder="Specify official response..."
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-5 outline-none focus:bg-white focus:ring-4 focus:ring-black/5 focus:border-black transition-all font-bold text-xs min-h-[120px] shadow-inner"
                                        />
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => handleReply(inquiry.id)}
                                                className="bg-black text-white px-6 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20"
                                            >
                                                Send Response
                                            </button>
                                            <button 
                                                onClick={() => setReplyingTo(null)}
                                                className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-all"
                                            >
                                                Abort
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setReplyingTo(inquiry.id)}
                                        className="inline-flex items-center gap-3 bg-black text-white px-5 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest hover:scale-105 transition-all shadow-md"
                                    >
                                        Reply Now <Send size={12} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {inquiries?.length === 0 && (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-100">
                        <div className="text-4xl mb-6 grayscale opacity-20">📭</div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">Inquiry Registry Clean</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactManager;
