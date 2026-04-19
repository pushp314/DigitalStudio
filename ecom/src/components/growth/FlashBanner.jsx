import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import { formatCurrency } from '../../utils/normalizers';

const FlashBanner = () => {
    const { user } = useContext(AuthContext);
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!user || !user.flashSaleExpiresAt) return;

        const updateTimer = () => {
            const expiry = new Date(user.flashSaleExpiresAt).getTime();
            const now = new Date().getTime();
            const diff = expiry - now;

            if (diff <= 0) {
                setTimeLeft(null);
            } else {
                setTimeLeft(diff);
            }
        };

        const interval = setInterval(updateTimer, 1000);
        updateTimer();

        return () => clearInterval(interval);
    }, [user]);

    if (!timeLeft) return null;

    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-black text-white p-6 rounded-[2.5rem] shadow-2xl shadow-black/30 border border-white/10 relative overflow-hidden group">
                {/* Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                
                <div className="relative z-10 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500 text-black rounded-2xl flex items-center justify-center text-xl animate-pulse">⚡</div>
                        <div>
                            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Limited Time Offer</h4>
                            <p className="text-sm font-bold tracking-tight">Enjoy <span className="text-emerald-400">40% OFF</span> your first purchase.</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="flex gap-1 font-mono text-2xl font-black text-white tracking-tighter">
                            <span>{String(minutes).padStart(2, '0')}</span>
                            <span className="opacity-30">:</span>
                            <span>{String(seconds).padStart(2, '0')}</span>
                        </div>
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Offer Ends</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlashBanner;
