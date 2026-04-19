import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
    if (!isOpen) return null;

    const colors = {
        danger: 'bg-red-600 hover:bg-red-700 shadow-red-500/20',
        primary: 'bg-primary hover:bg-blue-600 shadow-blue-500/20',
        black: 'bg-black hover:bg-gray-800 shadow-black/20'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            ></div>
            
            {/* Modal */}
            <div className="relative bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in zoom-in duration-200">
                <div className="p-8 text-center">
                    <div className={`w-16 h-16 ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-primary'} rounded-full flex items-center justify-center mx-auto mb-6 text-2xl`}>
                        {type === 'danger' ? '⚠️' : '❓'}
                    </div>
                    
                    <h3 className="text-xl font-black text-black mb-2">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-8">{message}</p>
                    
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${colors[type] || colors.primary}`}
                        >
                            {confirmText}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-xl font-bold text-gray-400 hover:text-black hover:bg-gray-50 transition-all"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
