import React, { useState } from 'react';
import { 
    Globe, 
    Search, 
    MoreHorizontal, 
    Shield, 
    Trash2, 
    BellOff, 
    Bell,
    Circle,
    Layout
} from 'lucide-react';

        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-4 sm:px-8 bg-white/80 backdrop-blur-md sticky top-0 z-40">
            <div className="flex items-center gap-3">
                <button 
                    onClick={onOpenSidebar}
                    className="lg:hidden p-2 text-slate-400 hover:text-slate-900 transition-all rounded-lg hover:bg-slate-100"
                    title="View Online Users"
                >
                    <Globe size={18} />
                </button>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <h2 className="text-[10px] sm:text-xs font-bold text-slate-900 uppercase tracking-widest whitespace-nowrap">Community Chat</h2>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full shrink-0">
                            <Circle 
                                size={6} 
                                fill="currentColor" 
                                className={`${
                                    status === 'online' ? 'text-emerald-500' : 
                                    status === 'connecting' ? 'text-amber-400 animate-pulse' : 'text-rose-500'
                                }`} 
                            />
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                {status === 'online' ? 'Online' : status === 'connecting' ? 'Connecting' : 'Offline'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-6">
                {/* Enterprise Search Interface */}
                <div className="relative group hidden sm:flex items-center">
                    <Search className="absolute left-3 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={12} />
                    <input 
                        type="text" 
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="bg-slate-50 border border-slate-100 rounded-lg py-1.5 pl-9 pr-4 text-[11px] font-medium placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-300 transition-all w-32 md:w-64"
                    />
                </div>
                
                {/* Mobile Search Icon (optional, let's keep it simple for now) */}
                
                {/* Subject Visibility Counter */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 text-slate-600 rounded-lg border border-slate-200">
                    <Globe size={12} className="text-slate-400" />
                    <span className="text-[10px] font-bold tracking-tight">{onlineCount}</span>
                </div>

                <div className="hidden sm:block w-px h-4 bg-slate-200"></div>

                <div className="flex items-center gap-1 relative">
                    {isAdmin && (
                        <button 
                            onClick={() => onToggleSelection()}
                            className={`p-2 transition-all rounded-lg ${isSelectionMode ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                            title="Selection Mode"
                        >
                            <Layout size={16} strokeWidth={2.5} />
                        </button>
                    )}

                    <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors hidden sm:block" title="Guidelines">
                        <Shield size={16} strokeWidth={2.5} />
                    </button>
                    
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`p-2 transition-colors ${isMenuOpen ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900'}`}
                    >
                        <MoreHorizontal size={16} strokeWidth={2.5} />
                    </button>

                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <button className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                                    <Trash2 size={14} className="text-slate-400" />
                                    Clear History
                                </button>
                                <button 
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                    {isMuted ? <Bell size={14} className="text-emerald-500" /> : <BellOff size={14} className="text-slate-400" />}
                                    {isMuted ? 'Enable Sounds' : 'Disable Sounds'}
                                </button>
                                <div className="h-px bg-slate-100 my-2 mx-2"></div>
                                <div className="px-3 py-2">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Status</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <p className="text-[10px] font-bold text-slate-600">Secure Connection</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default ChatHeader;
