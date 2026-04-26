import React from 'react';
import { X, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

/**
 * ConfirmationModal - A professional, high-fidelity alternative to window.confirm
 * Used for high-stakes actions like deletion, unpublishing, or status changes.
 */
const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Confirm Action", 
    cancelText = "Cancel",
    type = "warning", // warning, danger, success
    isLoading = false 
}) => {
    if (!isOpen) return null;

    const variants = {
        warning: {
            icon: <AlertTriangle size={24} className="text-amber-500" />,
            bg: "bg-amber-50",
            border: "border-amber-100",
            button: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
        },
        danger: {
            icon: <ShieldAlert size={24} className="text-rose-500" />,
            bg: "bg-rose-50",
            border: "border-rose-100",
            button: "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
        },
        success: {
            icon: <CheckCircle2 size={24} className="text-emerald-500" />,
            bg: "bg-emerald-50",
            border: "border-emerald-100",
            button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
        }
    };

    const style = variants[type] || variants.warning;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 antialiased">
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
                onClick={onClose} 
            />
            
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header Graphic */}
                <div className={`h-2 ${style.bg}`} />
                
                <div className="p-6 sm:p-8">
                    <div className="flex items-start justify-between mb-6">
                        <div className={`p-3 rounded-2xl ${style.bg} border ${style.border}`}>
                            {style.icon}
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-2 mb-8">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight uppercase">
                            {title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                            {message}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-all disabled:opacity-50 order-2 sm:order-1"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 py-3 text-white rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 order-1 sm:order-2 ${style.button}`}
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : null}
                            {confirmText}
                        </button>
                    </div>
                </div>

                {/* Technical Footnote */}
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                        <div className={`w-1 h-1 rounded-full ${type === 'danger' ? 'bg-rose-400' : 'bg-amber-400'}`} />
                        Security Check Active
                    </span>
                    <span className="text-[9px] font-mono text-slate-300">AUTH_GATE_V2</span>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
