import React from 'react';
import { 
    Users, 
    Bell, 
    Sparkles, 
    ArrowRight, 
    Activity, 
    ShieldCheck, 
    Lock,
    Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

const ChatSidebar = ({ user, onlineCount, onlineUsers, isOpen, onClose }) => {
    const navigate = useNavigate();
    const { info } = useToast();
    const isPro = user?.subscriptionPlan === 'pro' || user?.role === 'admin';

    return (
        <div className={`
            fixed inset-y-0 right-0 z-[100] w-72 bg-white border-l border-slate-100 flex flex-col overflow-hidden transition-transform duration-500 ease-in-out
            lg:relative lg:translate-x-0 lg:z-0
            ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
            {/* Identity Module */}
            <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/20">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-6 sm:mb-8 flex justify-between items-center">
                    Profile
                    <div className="flex items-center gap-4">
                        <Bell 
                            size={12} 
                            className="cursor-pointer hover:text-slate-900 transition-colors" 
                            onClick={() => {
                                if ('Notification' in window && Notification.permission !== 'granted') {
                                    Notification.requestPermission().then(permission => {
                                        if (permission === 'granted') info("Desktop notifications enabled.");
                                    });
                                } else if ('Notification' in window && Notification.permission === 'granted') {
                                    info("Desktop notifications are active.");
                                } else {
                                    info("Desktop notifications are not supported in this browser.");
                                }
                            }}
                        />
                        <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-900 transition-colors">
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </h3>
                
                <div className="space-y-6">
                    <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-slate-300">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-[12px] font-bold text-white uppercase">
                                {user?.name?.charAt(0)}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[11px] font-bold text-slate-900 truncate tracking-tight">{user?.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1 flex items-center gap-1">
                                <ShieldCheck size={10} className="text-blue-600" /> Verified Profile
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white custom-scrollbar">
                {/* Active Network Registry */}
                <div>
                    <div className="flex items-center justify-between mb-5 px-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.25em]">Online Users</p>
                        {!isPro && <Lock size={10} className="text-slate-300" />}
                    </div>
                    
                    {isPro ? (
                        <div className="space-y-1">
                            {onlineUsers.filter(u => u.id !== user?.id).length > 0 ? (
                                onlineUsers.filter(u => u.id !== user?.id).map((node) => (
                                    <div 
                                        key={node.id} 
                                        onClick={() => navigate(`/@${node.username || node.id}`)}
                                        className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                            {node.name?.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 truncate tracking-tight">{node.name}</p>
                                            <p className="text-[8px] text-slate-300 font-bold uppercase overflow-hidden truncate">@{node.username || 'unidentified'}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-[9px] text-slate-300 font-bold uppercase text-center py-4 border border-dashed border-slate-100 rounded-lg">No Users Online</p>
                            )}
                        </div>
                    ) : (
                        <div className="p-5 bg-slate-50 rounded-lg border border-slate-100 text-center space-y-3 opacity-60">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Network View Locked</p>
                            <p className="text-[9px] text-slate-400 leading-normal px-2">Viewing online users requires a Pro Membership.</p>
                        </div>
                    )}
                </div>

                {/* Tactical Assets */}
                <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-4 px-1">Resources</p>
                    <div className="space-y-1">
                        <button onClick={() => navigate('/docs')} className="w-full flex items-center justify-between px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all group">
                            <span className="text-[11px] font-bold">Documentation</span>
                            <ArrowRight size={12} className="text-slate-300" />
                        </button>
                        <button onClick={() => navigate('/apps')} className="w-full flex items-center justify-between px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all group">
                            <span className="text-[11px] font-bold">Ready App Catalog</span>
                            <ArrowRight size={12} className="text-slate-300" />
                        </button>
                    </div>
                </div>

                {!isPro && (
                    <div className="bg-slate-900 rounded-xl p-6 text-white relative overflow-hidden group shadow-xl">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                            <Sparkles size={48} />
                        </div>
                        <h4 className="text-[11px] font-bold tracking-widest mb-2 uppercase text-blue-400 flex items-center gap-2">
                             Pro Upgrade <Crown size={12} />
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-tight mb-6 font-medium">
                            Unlock online user visibility and unlimited messaging.
                        </p>
                        <button 
                            onClick={() => navigate('/pricing')}
                            className="w-full py-2.5 bg-white text-slate-900 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-all shadow-lg active:scale-95"
                        >
                            Upgrade Account
                        </button>
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-slate-100 mt-auto bg-slate-50/50">
                <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    <Activity size={12} className="text-emerald-500 animate-[pulse_3s_infinite]" />
                    {onlineCount} Users Online
                </div>
            </div>
        </div>
    );
};

export default ChatSidebar;
