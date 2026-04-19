import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfigContext from '../context/ConfigContext';

const HeroSection = () => {
    const { config } = useContext(ConfigContext);
    const navigate = useNavigate();
    const [activeIndex, setActiveIndex] = React.useState(0);
    const trustedCompanies = Array.isArray(config?.socialProof?.trustedCompanies) ? config.socialProof.trustedCompanies : [];

    // Protocol: Asset Rotation Loop
    React.useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % 3);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    const stackImages = Array.isArray(config?.heroImages) && config.heroImages.length > 0
        ? config.heroImages
        : [
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200",
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
        ];

    return (
        <div className="relative w-full bg-[#F8FAFC] min-h-[90vh] lg:h-screen lg:max-h-[950px] flex flex-col justify-center px-6 md:px-12 overflow-hidden font-sans">
            
            {/* ATMOSPHERIC LAYERS */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-400/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* MAIN CONTENT WRAPPER */}
            <div className="max-w-[1400px] mx-auto w-full relative z-10 pt-12 lg:pt-0">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-center gap-12 lg:gap-20">
                    
                    {/* LEFT SECTOR: INTELLIGENCE & HEADING */}
                    <div className="text-left animate-in slide-in-from-left-8 duration-700">
                        {/* Live Signal Badge */}
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full mb-6 shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Marketplace Protocol: 50+ Verified Assets</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] leading-[0.9] font-black text-slate-900 tracking-tighter mb-6">
                            {config?.heroTitle || "High-Performance Marketplace for Modern Teams"}
                        </h1>

                        <p className="max-w-xl text-lg text-slate-400 font-medium leading-relaxed mb-10">
                            {config?.heroSubtitle || "Discover, acquire, and launch pixel-perfect React templates and SaaS modules in minutes."}
                        </p>

                        <div className="flex flex-wrap items-center gap-5">
                            <button 
                                onClick={() => navigate('/templates')}
                                className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-xl shadow-blue-500/20 outline-none"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                </svg>
                                Browse Templates
                            </button>
                            <button 
                                onClick={() => navigate('/docs')}
                                className="px-8 py-4 bg-white border border-slate-100 text-slate-900 rounded-full font-bold text-lg flex items-center gap-3 hover:bg-slate-50 transition-all font-sans outline-none"
                            >
                                <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></span>
                                Protocol
                            </button>
                        </div>
                    </div>

                    {/* RIGHT SECTOR: POLYMORPHIC INTELLIGENCE VISUALS */}
                    <div className="relative animate-in zoom-in-95 duration-1000 hidden lg:block h-[500px]">
                        
                        {/* 1. Protocol: PERSPECTIVE STACK */}
                        {(config?.heroVisualEffect === 'stack' || !config?.heroVisualEffect) && stackImages.map((src, idx) => {
                            const position = (idx - activeIndex + 3) % 3;
                            const styles = {
                                0: "z-30 scale-100 opacity-100 translate-x-[0%] translate-y-[0%] rotate-0 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)]",
                                1: "z-20 scale-[0.92] opacity-60 translate-x-[8%] translate-y-[-12%] rotate-[2deg] blur-[0.5px]",
                                2: "z-10 scale-[0.84] opacity-30 translate-x-[16%] translate-y-[-24%] rotate-[4deg] blur-[1px]"
                            };
                            return (
                                <div key={idx} className={`absolute top-[15%] left-[0%] w-[520px] aspect-[16/10] bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden transition-all duration-[1200ms] ${styles[position]}`} style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                                    <img src={src} className="w-full h-full object-cover" alt={`Template ${idx}`} />
                                    {position === 0 && <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-100 shadow-sm animate-fade-in"><span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Asset {idx + 1} — Verified</span></div>}
                                </div>
                            );
                        })}

                        {/* 2. Protocol: CINEMATIC CROSS-FADE */}
                        {config?.heroVisualEffect === 'fade' && stackImages.map((src, idx) => (
                            <div key={idx} className={`absolute inset-0 w-full h-full rounded-[3.5rem] overflow-hidden transition-opacity duration-[2000ms] ease-in-out ${idx === activeIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'}`}>
                                <img src={src} className="w-full h-full object-cover" alt={`Template ${idx}`} />
                                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/40 via-transparent to-transparent"></div>
                                <div className="absolute bottom-10 left-10 text-white animate-in slide-in-from-bottom-4 duration-1000">
                                     <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Featured Intelligence</p>
                                     <h3 className="text-3xl font-black tracking-tighter">Asset Node 0{idx + 1}</h3>
                                </div>
                            </div>
                        ))}

                        {/* 3. Protocol: FLOATING SCATTER */}
                        {config?.heroVisualEffect === 'scatter' && stackImages.map((src, idx) => {
                             const offsets = [
                                { top: '0%', left: '10%', scale: 'scale-100', delay: '0s' },
                                { top: '30%', left: '40%', scale: 'scale-90', delay: '1s' },
                                { top: '50%', left: '5%', scale: 'scale-95', delay: '2.5s' }
                             ];
                             const pos = offsets[idx % 3];
                             return (
                                <div key={idx} className={`absolute ${pos.top} ${pos.left} w-[380px] aspect-video bg-white rounded-[2rem] shadow-2xl border border-slate-100 transition-all duration-[3000ms] ${pos.scale} animate-float`} style={{ animationDelay: pos.delay }}>
                                    <img src={src} className="w-full h-full object-cover rounded-[2rem]" alt={`Template ${idx}`} />
                                    <div className="absolute -bottom-4 -right-4 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg">0{idx+1}</div>
                                </div>
                             );
                        })}

                        {/* Universal Interaction Node (Shared) */}
                        <div className="absolute -bottom-10 right-10 p-6 bg-white rounded-[2rem] shadow-2xl border border-slate-50 z-40 animate-bounce-slow">
                            <span className="text-2xl font-black text-primary">$49</span>
                        </div>
                    </div>

                </div>

                {/* LOGO MARQUEE (Trust Layer) */}
                <div className="mt-20 pt-10 border-t border-slate-100/80">
                    <div className="w-full overflow-hidden relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
                        <div className="flex gap-16 items-center animate-scroll w-max">
                            {[...trustedCompanies, ...trustedCompanies, ...trustedCompanies].map((name, index) => (
                                <div key={index} className="flex items-center gap-4 transition-all cursor-pointer group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-500 transition-colors"></span>
                                    <span className="text-lg font-black uppercase tracking-tighter text-slate-300 group-hover:text-slate-900 transition-colors">{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0) rotate(12deg); }
                    50% { transform: translateY(-15px) rotate(15deg); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 4s ease-in-out infinite;
                }
                @keyframes scroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(-33.33%); }
                }
                .animate-scroll {
                    animation: scroll 30s linear infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    33% { transform: translateY(-10px) rotate(2deg); }
                    66% { transform: translateY(5px) rotate(-2deg); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default HeroSection;
