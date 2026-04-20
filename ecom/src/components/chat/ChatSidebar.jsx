import React from 'react';
import { Crown, Users, Zap, Bell, Sparkles, Layout, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChatSidebar = ({ user, onlineCount }) => {
    const navigate = useNavigate();
    const isPro = user?.subscriptionPlan === 'pro';

    return (
        <div className="hidden lg:flex w-72 bg-white border-l border-slate-100 flex-col overflow-hidden shadow-[-1px_0_0_0_rgba(0,0,0,0.05)]">
            <div className="p-8 border-b border-slate-100">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8 flex justify-between items-center">
                    Workspace Nodes
                    <Bell size={12} className="cursor-pointer hover:text-blue-600 transition-colors" />
                </h3>
                
                <div className="space-y-6">
                    <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100 shadow-sm transition-transform active:scale-98 cursor-default group">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-[13px] font-black text-white shadow-xl shadow-blue-600/20">
                                {user?.name?.charAt(0)}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[12px] font-black text-slate-900 truncate tracking-tight">{user?.name}</p>
                            <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest leading-none mt-1">Verified Session</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
                {/* Active Buffers */}
                <div>
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4 ml-2">Active Buffers</p>
                   <div className="space-y-1">
                       <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-blue-50/50 text-blue-600 rounded-xl transition-all border border-blue-100/30">
                           <Users size={14} />
                           <span className="text-[11px] font-black tracking-tight uppercase">Public Stream</span>
                       </button>
                       <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100 group">
                           <Layout size={14} className="group-hover:text-slate-600" />
                           <span className="text-[11px] font-bold tracking-tight group-hover:text-slate-600">Pro Sandbox</span>
                       </button>
                   </div>
                </div>

                {/* Resource Links */}
                <div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4 ml-2">Quick Access</p>
                    <div className="space-y-1">
                        <button onClick={() => navigate('/docs')} className="w-full flex items-center justify-between px-3 py-2 text-slate-500 hover:text-blue-600 transition-colors">
                            <span className="text-[11px] font-bold">API Documentation</span>
                            <ArrowRight size={12} />
                        </button>
                        <button className="w-full flex items-center justify-between px-3 py-2 text-slate-500 hover:text-blue-600 transition-colors">
                            <span className="text-[11px] font-bold">Marketplace Assets</span>
                            <ArrowRight size={12} />
                        </button>
                    </div>
                </div>

                {!isPro && (
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white relative overflow-hidden group border border-slate-800 shadow-2xl">
                        <div className="absolute -top-4 -right-4 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Sparkles size={64} />
                        </div>
                        <h4 className="text-[13px] font-black tracking-tight mb-2 uppercase text-blue-400">Upgrade to Pro</h4>
                        <p className="text-[10px] text-slate-400 leading-relaxed mb-6 font-medium uppercase tracking-widest">Remove rate limits and unlock exclusive buffers.</p>
                        <button 
                            onClick={() => navigate('/pricing')}
                            className="w-full py-3 bg-white text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg hover:bg-blue-50 transition-all shadow-xl"
                        >
                            Elevate Account
                        </button>
                    </div>
                )}
            </div>

            <div className="p-8 border-t border-slate-100 mt-auto bg-slate-50/30">
                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                    <Activity size={12} className="text-emerald-500" />
                    {onlineCount} Nodes Active
                </div>
            </div>
        </div>
    );
};

export default ChatSidebar;
