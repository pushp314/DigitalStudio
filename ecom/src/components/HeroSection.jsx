import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import Button from './common/Button';
import ConfigContext from '../context/ConfigContext';

const HeroSection = () => {
    const { config } = useContext(ConfigContext);

    return (
        <div className="relative w-full bg-[#F5F5F7] min-h-[90vh] flex flex-col justify-center px-6 py-20 pt-52 overflow-hidden font-sans">

            {/* MAIN CONTENT WRAPPER */}
            <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-16  relative z-10">

                {/* 1. HERO HEADING (LEFT ALIGNED) */}
                <div className="flex flex-col items-start text-left">

                    {/* Line 1 - Dynamic from Config */}
                    <h1 className="text-6xl md:text-8xl lg:text-[6.4rem] leading-[0.9] font-black text-black tracking-tight mb-4 md:mb-6 animate-fade-in-up">
                        {config?.heroTitle?.split(' ').slice(0, 3).join(' ') || "Building quality Framer"}
                    </h1>

                    {/* Line 2: The complex line with inline images - Now Flex Start (Left) */}
                    <div className="flex flex-col md:flex-row items-center md:items-baseline justify-start gap-4 md:gap-8 w-full animate-fade-in-up delay-100">

                        {/* The 3D Framer Icon (Left) */}
                        <div className="hidden md:flex shrink-0 w-20 h-20 md:w-24 md:h-24 bg-white rounded-[1.8rem] shadow-[0_30px_60px_-15px_rgba(0,85,255,0.25)] items-center justify-center transform -rotate-6 hover:scale-110 hover:rotate-0 transition-all duration-500 ease-out relative top-2 cursor-pointer z-10 group">
                            {/* Framer Logo Gradient Background */}
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-[#0055FF] to-[#0033CC] flex items-center justify-center shadow-inner group-hover:shadow-[inset_0_4px_10px_rgba(0,0,0,0.2)] transition-shadow">
                                <svg viewBox="0 0 24 24" className="w-7 h-7 md:w-8 md:h-8 text-white fill-current">
                                    <path d="M4 0h16v8h-8zM4 8h8l8 8h-16zM4 16h8v8z" />
                                </svg>
                            </div>
                        </div>

                        {/* Text: "templates for" (Dynamic remainder) */}
                        <h1 className="text-6xl md:text-8xl lg:text-[6.2rem] leading-[0.9] font-black text-black tracking-tight">
                            {config?.heroTitle?.split(' ').slice(3).join(' ') || "templates for"}
                        </h1>

                        {/* The Tilted UI Card (Right) */}
                        <div className="hidden md:block shrink-0 relative w-32 h-20 md:w-40 md:h-24 bg-white rounded-xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] transform rotate-6 hover:rotate-3 transition-all duration-300 border border-white/50 overflow-hidden relative top-1 group cursor-pointer hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)]">
                            <div className="h-6 bg-[#2B6AFF] w-full flex items-center px-2">
                                <div className="w-10 h-1 bg-white/40 rounded-full"></div>
                            </div>
                            <div className="p-2 space-y-1">
                                <div className="flex gap-1">
                                    <div className="w-8 h-8 bg-orange-50 rounded md:w-10 md:h-10 shrink-0 flex items-center justify-center text-[10px]">✨</div>
                                    <div className="space-y-1 w-full">
                                        <div className="h-1.5 w-12 bg-gray-100 rounded"></div>
                                        <div className="h-1 w-8 bg-gray-50 rounded"></div>
                                    </div>
                                </div>
                                <div className="mt-2 h-4 w-full bg-blue-50/50 rounded flex items-center px-2">
                                    <span className="text-[6px] font-bold text-[#2B6AFF]">Verified Creator</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Line 3 - Subtitle */}
                    <h1 className="text-6xl md:text-8xl lg:text-[6.4rem] leading-[0.9] font-black text-black tracking-tight mt-4 md:mt-2 animate-fade-in-up delay-200">
                        {config?.heroSubtitle || "creators & founders."}
                    </h1>
                </div>

                {/* 2. BOTTOM SECTION */}
                <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between w-full mt-10 gap-12 xl:gap-0 animate-fade-in-up delay-300">

                    {/* Left: Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <Button to="/templates" variant="primary" className="w-full sm:w-auto text-lg shadow-[0_10px_30px_-10px_rgba(0,85,255,0.4)]">
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                            Browse Templates
                        </Button>

                        <Button to="/features" variant="white" className="w-full sm:w-auto text-lg border border-gray-100">
                            <span className="w-2.5 h-2.5 bg-[#0055FF] rounded-full animate-pulse mr-2"></span>
                            Framerstore Features
                        </Button>
                    </div>

                    {/* 
             Right: SCROLLING Logos 
             "Right bottom corner item below the template feature to be in scroll at that div only"
          */}
                    <div className="flex flex-col items-start xl:items-end gap-4 w-full xl:w-[450px]">
                        <span className="text-gray-400/80 font-bold text-xs tracking-widest uppercase pl-2 xl:pl-0">
                            Trusted by teams at
                        </span>

                        {/* The Scrolling Container */}
                        {/* overflow-hidden clips the content, mask-image creates the fade effect on edges */}
                        <div className="w-full overflow-hidden relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>

                            {/* The Inner Track (Double the logos for seamless loop) */}
                            <div className="flex gap-12 items-center animate-scroll w-max pr-12">
                                {/* SET 1 */}
                                <LogoItem name="Rise" />
                                <LogoItem name="Sitemark" />
                                <LogoItem name="PinPoint" />
                                <LogoItem name="Product." />

                                {/* SET 2 (Duplicate for infinite loop) */}
                                <LogoItem name="Rise" />
                                <LogoItem name="Sitemark" />
                                <LogoItem name="PinPoint" />
                                <LogoItem name="Product." />

                                {/* SET 3 (For ultra wide monitors check) */}
                                <LogoItem name="Rise" />
                                <LogoItem name="Sitemark" />
                                <LogoItem name="PinPoint" />
                                <LogoItem name="Product." />
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// Helper Component for Logos to keep code clean
const LogoItem = ({ name }) => (
    <div className="flex items-center gap-2 font-bold text-xl text-black/70 hover:text-black hover:scale-105 transition-all duration-300 opacity-60 hover:opacity-100 whitespace-nowrap cursor-pointer">
        {/* Generic Icon matching the name roughly */}
        {name === "Rise" && (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="10" width="4" height="10" rx="1" /><rect x="8" y="6" width="4" height="14" rx="1" /><rect x="14" y="2" width="4" height="18" rx="1" /></svg>
        )}
        {name === "Sitemark" && (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2-1 2 1-2 1-2-1zm0 2l-10 5 10 5 10-5-10-5z" /></svg>
        )}
        {name === "PinPoint" && (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="3" fill="none" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg>
        )}
        {name === "Product." && (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 15h-2v-2h2v2zm4 0h-2v-6h2v6z" /></svg>
        )}
        <span>{name}</span>
    </div>
);

export default HeroSection;