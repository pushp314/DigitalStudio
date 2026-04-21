import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const SubscriptionManager = () => {
    const { error: toastError } = useToast();

    const { data: subscribers, isLoading } = useQuery({
        queryKey: ['admin-subscribers'],
        queryFn: async () => {
            const users = await api.get('/admin/users');
            // Filter users who are on the pro plan
            return users.filter(u => u.subscriptionPlan === 'pro');
        }
    });

    if (isLoading) return (
        <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Membership Data...</span>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 rounded-bl-full -translate-y-4 translate-x-4"></div>
                <div className="relative z-10">
                    <h2 className="text-xl font-black text-black tracking-tight leading-none mb-3">Membership Management</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-60">Subscriber Registry & Tier Management</p>
                </div>
                <div className="relative z-10 flex items-center gap-2.5 bg-black text-white px-5 py-2.5 rounded-xl shadow-lg shadow-black/10">
                    <span className="text-base leading-none">💎</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{subscribers?.length || 0} Pro Members</span>
                </div>
            </div>

            <div className="grid gap-4">
                {subscribers?.map((user) => (
                    <div key={user.id} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full group-hover:bg-amber-100 transition-colors"></div>
                        
                        <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-md">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <h3 className="text-base font-black text-black tracking-tight leading-none">{user.name}</h3>
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase rounded-lg border border-amber-100">Pro Member</span>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 mb-3">{user.email}</p>
                                
                                <div className="flex flex-wrap gap-3">
                                    <div className="px-3 py-1.5 bg-gray-50 rounded-lg flex items-center gap-2 border border-gray-100">
                                        <span className="text-[8px] font-bold text-gray-400 uppercase">Registry:</span>
                                        <span className="text-[8px] font-black text-black">{new Date(user.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="px-3 py-1.5 bg-gray-50 rounded-lg flex items-center gap-2 border border-gray-100">
                                        <span className="text-[8px] font-bold text-gray-400 uppercase">Status:</span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                                            <span className="text-[8px] font-black text-black uppercase">Authorized</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 pt-4 md:pt-0">
                                <button className="px-5 py-2.5 bg-black text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 shadow-md">
                                    Benefits
                                </button>
                                <button className="w-9 h-9 bg-white border border-gray-100 text-gray-400 rounded-lg hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {(!subscribers || subscribers.length === 0) && (
                    <div className="py-24 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-100">
                        <div className="text-4xl mb-4 grayscale opacity-20">💎</div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">No Pro members yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubscriptionManager;
