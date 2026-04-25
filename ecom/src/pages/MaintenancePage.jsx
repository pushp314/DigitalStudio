import React from 'react';

const MaintenancePage = ({ message }) => {
    return (
        <div className="fixed inset-0 h-screen w-screen bg-white flex flex-col items-center justify-center p-6 text-center overflow-hidden selection:bg-black selection:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            {/* Soft Premium Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gray-50 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            
            <div className="relative z-10 max-w-xl w-full flex flex-col items-center">
                
                {/* Minimalist Brand Mark */}
                <div className="mb-12 group">
                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-2xl shadow-black/20 transform transition-transform group-hover:rotate-12 duration-500">
                        BC
                    </div>
                </div>

                {/* Politeness & Message */}
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">A Brief Intermission</p>
                    <h1 className="text-4xl md:text-6xl font-black text-black tracking-tighter leading-none mb-4">
                        Pardon our <span className="text-gray-300">progress.</span>
                    </h1>
                    
                    <div className="h-1 w-12 bg-black/10 rounded-full mx-auto mb-8">
                        <div className="h-full w-1/2 bg-black rounded-full animate-[loading_2s_ease-in-out_infinite]"></div>
                    </div>

                    <div className="space-y-4 px-4">
                        <p className="text-lg md:text-xl font-medium text-gray-500 leading-relaxed italic">
                            {message || "We're currently improving the BizCode buying and support experience. We'll be back online shortly."}
                        </p>
                        <p className="text-sm font-bold text-black/40 uppercase tracking-widest pt-4">
                            Thank you for your patience
                        </p>
                    </div>
                </div>

                {/* Action & Status */}
                <div className="mt-16 flex flex-col items-center gap-8 animate-in fade-in duration-1000 delay-500">
                    <button 
                        onClick={() => window.location.reload()}
                        className="group flex items-center gap-4 px-10 py-5 bg-black text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-primary transition-all shadow-2xl shadow-black/10 hover:-translate-y-1 active:translate-y-0"
                    >
                        Check Status
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse group-hover:bg-white"></span>
                    </button>
                    
                    <div className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.3em]">
                        BizCode &copy; {new Date().getFullYear()} - Ready apps and expert support
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}} />
        </div>
    );
};

export default MaintenancePage;
