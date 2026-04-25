import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-6 py-20 bg-[#fafafa]" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="max-w-xl w-full text-center space-y-8">
                {/* Visual */}
                <div className="relative inline-block">
                    <div className="text-[12rem] font-black text-slate-100 select-none leading-none">404</div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl border border-slate-100 flex items-center justify-center text-slate-900 animate-bounce">
                            <Search size={40} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Endpoint Not Found</h1>
                    <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                        The technical asset or route you are looking for has been moved, archived, or never existed in our registry.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Link to="/" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3">
                        <Home size={16} /> Return to Base
                    </Link>
                    <button 
                        onClick={() => window.history.back()} 
                        className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                    >
                        <ArrowLeft size={16} /> Previous Route
                    </button>
                </div>

                {/* Quick Links */}
                <div className="pt-12 border-t border-slate-100 grid grid-cols-3 gap-4">
                    <QuickLink label="Inventory" to="/templates" />
                    <QuickLink label="Support" to="/support" />
                    <QuickLink label="Dashboard" to="/profile" />
                </div>
            </div>
        </div>
    );
};

const QuickLink = ({ label, to }) => (
    <Link to={to} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-300 transition-all group">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-900">{label}</p>
    </Link>
);

export default NotFound;
