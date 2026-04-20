import React from 'react';
import { Globe, Search, MoreHorizontal, Activity, Shield } from 'lucide-react';

const ChatHeader = ({ status, onlineCount, searchQuery, onSearchChange }) => {
    return (
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-tight">Public Stream</h2>
                        <div className={`w-2 h-2 rounded-full ${
                            status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]' : 
                            status === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500'
                        }`}></div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative group flex items-center">
                    <Search className={`absolute left-3 transition-colors ${searchQuery ? 'text-blue-600' : 'text-slate-300'}`} size={13} />
                    <input 
                        type="text" 
                        placeholder="Search conversation..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="bg-slate-50 border border-transparent rounded-lg py-1.5 pl-9 pr-4 text-[11px] font-bold focus:outline-none focus:bg-white focus:border-slate-200 transition-all w-32 md:w-56"
                    />
                </div>
                
                <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 bg-blue-50/50 text-blue-600 rounded-lg border border-blue-100/30">
                    <Globe size={12} className="text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-wider">{onlineCount}</span>
                </div>

                <div className="w-px h-6 bg-slate-100 mx-1"></div>

                <div className="flex items-center gap-1">
                    <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><Shield size={16} /></button>
                    <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors"><MoreHorizontal size={16} /></button>
                </div>
            </div>
        </header>
    );
};

export default ChatHeader;
