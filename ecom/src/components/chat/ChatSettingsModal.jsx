import React from 'react';
import { 
    X, 
    Volume2, 
    VolumeX, 
    Monitor, 
    Zap, 
    Shield, 
    Crown, 
    EyeOff,
    CheckCircle2,
    Settings,
    Activity
} from 'lucide-react';

const ChatSettingsModal = ({ isOpen, onClose, settings, onUpdate, user }) => {
    if (!isOpen) return null;

    const isPro = user?.subscriptionPlan === 'pro' || user?.role === 'admin';

    const SettingToggle = ({ label, description, active, onChange, proOnly }) => (
        <div className={`flex items-center justify-between p-5 rounded-xl border border-transparent transition-all ${proOnly && !isPro ? 'opacity-50 bg-slate-50' : 'hover:bg-slate-50 hover:border-slate-100'}`}>
            <div className="flex-1 pr-6">
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-[12px] font-bold text-slate-900 tracking-tight">{label}</p>
                    {proOnly && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[8px] font-bold uppercase tracking-widest">Pro</span>}
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{description}</p>
            </div>
            
            {proOnly && !isPro ? (
                <div className="p-1 text-slate-300">
                    <Lock size={14} />
                </div>
            ) : (
                <button 
                    onClick={() => onChange(!active)}
                    className={`w-9 h-5 rounded-full transition-all relative ${active ? 'bg-slate-900' : 'bg-slate-200'}`}
                >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${active ? 'right-1' : 'left-1'}`}></div>
                </button>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-end p-6 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl h-full flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-500 border border-slate-200">
                <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Settings size={16} className="text-slate-900" />
                            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em]">Chat Settings</h2>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Community preferences</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200 rounded-lg">
                        <X size={18} strokeWidth={2.5} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    <section>
                        <h3 className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em] mb-6">Environment Audio</h3>
                        <SettingToggle 
                            label="Auditory Notifications"
                            description="Play sound effects for incoming messages."
                            active={settings.sounds}
                            onChange={(val) => onUpdate('sounds', val)}
                        />
                    </section>

                    <section>
                        <h3 className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em] mb-6">Identity Privacy</h3>
                        <div className="space-y-4">
                            <SettingToggle 
                            label="Hide Typing Status"
                            description="Keep your typing activity private."
                                active={settings.hideTyping}
                                onChange={(val) => onUpdate('hideTyping', val)}
                                proOnly
                            />
                            <SettingToggle 
                                label="Hide Read Receipts"
                                description="Suppress read receipts in community chat."
                                active={settings.hideReadReceipts}
                                onChange={(val) => onUpdate('hideReadReceipts', val)}
                                proOnly
                            />
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em] mb-6">Interface Layout</h3>
                        <SettingToggle 
                            label="Compact Mode"
                            description="Increase information density for faster scanning."
                            active={settings.compactMode}
                            onChange={(val) => onUpdate('compactMode', val)}
                            proOnly
                        />
                    </section>
                </div>

                <footer className="p-8 border-t border-slate-100 bg-slate-50/30 font-sans">
                    {!isPro ? (
                        <div className="bg-slate-900 rounded-xl p-6 text-white relative overflow-hidden shadow-xl">
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-bold tracking-[0.2em] text-blue-400 uppercase mb-2 flex items-center gap-2">
                                     Pro Chat Controls <Crown size={12} />
                                </h4>
                                <p className="text-[10px] text-slate-400 font-medium mb-6 leading-relaxed">
                                    Upgrade to unlock advanced community chat controls and unlimited messaging.
                                </p>
                                <button className="w-full py-2.5 bg-white text-slate-900 text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-100 transition-all shadow-lg active:scale-95">
                                    Upgrade to Pro
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 text-emerald-600 bg-emerald-50 p-5 rounded-xl border border-emerald-200">
                            <div className="p-2 bg-emerald-500 text-white rounded-lg">
                                <Shield size={16} />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-tight">Pro access active</p>
                                <p className="text-[9px] font-bold opacity-60">Advanced chat controls are available.</p>
                            </div>
                        </div>
                    )}
                </footer>
            </div>
        </div>
    );
};

const Lock = ({ size }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

export default ChatSettingsModal;
