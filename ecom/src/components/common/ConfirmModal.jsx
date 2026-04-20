import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirm Action", 
    message = "Are you sure you want to proceed? This action may be irreversible.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "danger" // danger, warning, info
}) => {
    if (!isOpen) return null;

    const colors = {
        danger: {
            bg: "bg-rose-50",
            icon: "text-rose-600",
            button: "bg-rose-600 hover:bg-rose-700 shadow-rose-200",
            border: "border-rose-100"
        },
        warning: {
            bg: "bg-amber-50",
            icon: "text-amber-600",
            button: "bg-amber-600 hover:bg-amber-700 shadow-amber-200",
            border: "border-amber-100"
        },
        info: {
            bg: "bg-blue-50",
            icon: "text-blue-600",
            button: "bg-blue-600 hover:bg-blue-700 shadow-blue-200",
            border: "border-blue-100"
        }
    };

    const theme = colors[type] || colors.danger;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>
            
            {/* Modal */}
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${theme.bg} ${theme.icon} border ${theme.border} shrink-0`}>
                            <AlertCircle size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
                                <button 
                                    onClick={onClose}
                                    className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-6 py-2 ${theme.button} text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 uppercase tracking-widest`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
