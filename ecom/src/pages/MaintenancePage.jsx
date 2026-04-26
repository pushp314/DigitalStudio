import React from 'react';

const MaintenancePage = ({ message }) => {
    return (
        <div className="fixed inset-0 h-screen w-screen bg-white flex flex-col items-center justify-center p-4 sm:p-6 text-center overflow-hidden selection:bg-black selection:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            {/* Soft Premium Background Elements */}
            <div className="absolute top-[-5%] right-[-5%] sm:top-[-10%] sm:right-[-10%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-blue-50/50 rounded-full blur-[80px] sm:blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-5%] left-[-5%] sm:bottom-[-10%] sm:left-[-10%] w-[350px] h-[350px] sm:w-[600px] sm:h-[600px] bg-gray-50 rounded-full blur-[100px] sm:blur-[140px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            
            <div className="relative z-10 max-w-xl w-full flex flex-col items-center">
                
                {/* Minimalist Brand Mark */}
                <div className="mb-8 sm:mb-12 group">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-black shadow-2xl shadow-black/20 transform transition-transform group-hover:rotate-12 duration-500">
                        BC
                    </div>
                </div>

                {/* Politeness & Message */}
                <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <p className="text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-2">A Brief Intermission</p>
                    <h1 className="text-clamp-6xl font-black text-black tracking-tighter leading-tight sm:leading-none mb-4 px-2">
                        Pardon our <span className="text-gray-300">progress.</span>
                    </h1>
                    
                    <div className="h-1 w-12 bg-black/5 rounded-full mx-auto mb-6 sm:mb-8 overflow-hidden">
                        <div className="h-full w-1/2 bg-black rounded-full animate-[loading_2s_ease-in-out_infinite]"></div>
                    </div>

                    <div className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                        <p className="text-base sm:text-xl font-medium text-gray-500 leading-relaxed italic">
                            {message || "We're currently improving the BizCode buying and support experience. We'll be back online shortly."}
                        </p>
                        <p className="text-[10px] sm:text-xs font-black text-black/30 uppercase tracking-[0.2em] pt-4">
                            Thank you for your patience
                        </p>
                    </div>
                </div>

                {/* Action & Status */}
                <div className="mt-10 sm:mt-16 flex flex-col items-center gap-6 sm:gap-8 animate-in fade-in duration-1000 delay-500">
                    <button 
                        onClick={() => window.location.reload()}
                        className="group flex items-center gap-4 px-8 py-4 sm:px-10 sm:py-5 bg-black text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-black/5 hover:-translate-y-1 active:translate-y-0"
                    >
                        Check Status
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse group-hover:bg-white"></span>
                    </button>
                    
                    <div className="text-[8px] sm:text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em] sm:tracking-[0.3em] px-4">
                        BizCode &copy; {new Date().getFullYear()} - Premium Templates & Expert Support
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
