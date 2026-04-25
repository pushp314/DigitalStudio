import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = ({ message = "Synchronizing Workspace", progress = 0 }) => {
    return (
        <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
        >
            {/* Soft Premium Background Decor */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gray-50 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1s' }}></div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 flex flex-col items-center"
            >
                {/* Logo with slight breathing effect */}
                <motion.div 
                    animate={{ 
                        y: [0, -4, 0],
                    }}
                    transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                    }}
                    className="mb-8"
                >
                    <img src="/logo.png" alt="BizCode" className="h-28 w-auto" />
                </motion.div>

                {/* Slogan */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="flex flex-col items-center"
                >
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] mb-12">
                        Where code meets business
                    </p>

                    {/* Professional Progress Indicator */}
                    <div className="flex flex-col items-center gap-5">
                        <div className="flex items-center justify-between w-40 mb-[-12px]">
                            <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest animate-pulse">
                                {message}
                            </span>
                            <span className="text-[10px] font-black text-slate-900 tabular-nums">
                                {Math.round(progress)}%
                            </span>
                        </div>
                        <div className="relative w-40 h-[3px] bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ 
                                    type: "spring",
                                    stiffness: 50,
                                    damping: 20
                                }}
                                className="absolute inset-y-0 left-0 bg-slate-900 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                            />
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Bottom Branding */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-12 text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]"
            >
                BizCode &copy; {new Date().getFullYear()}
            </motion.div>
        </motion.div>
    );
};

export default LoadingScreen;
