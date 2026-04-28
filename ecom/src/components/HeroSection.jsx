import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfigContext from '../context/ConfigContext';

const HeroSection = () => {
    const { config } = useContext(ConfigContext);
    const navigate = useNavigate();

    const heroImages = Array.isArray(config?.heroImages) && config.heroImages.length > 0
        ? config.heroImages
        : [
            'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200',
        ];

    return (
        <section className="ds-page px-4 pb-12 pt-8 md:px-6 md:pb-20 md:pt-16 overflow-hidden">
            <div className="ds-shell grid gap-12 lg:grid-cols-[1fr,560px] lg:items-center">
                <div className="space-y-8 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600 shadow-sm animate-in fade-in slide-in-from-left-4 duration-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Trusted by 100+ founders
                    </div>

                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        <h1 className="text-3xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                            Launch Your SaaS <br className="hidden md:block" /> in Days, Not Months.
                        </h1>
                        <p className="max-w-2xl mx-auto lg:mx-0 text-base md:text-lg leading-relaxed text-slate-500 font-medium">
                            Production-ready apps, dashboards, APIs — deploy instantly or customize to fit your vision perfectly.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                        <button 
                            type="button" 
                            onClick={() => navigate('/assets')} 
                            className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                        >
                            Browse Products
                        </button>
                        <button 
                            type="button" 
                            onClick={() => navigate('/hire-developer')} 
                            className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Request Custom Build
                        </button>
                    </div>

                    {/* Merged Path */}
                    <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                        <div 
                            onClick={() => navigate('/support')}
                            className="group flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md transition-all cursor-pointer text-left max-w-md mx-auto lg:mx-0"
                        >
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Need Custom Development?</p>
                                <p className="text-xs font-semibold text-slate-600">Get expert help, post-purchase support, or a full custom build.</p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hero Visualization */}
                <div className="ds-panel p-2 md:p-3 animate-in fade-in zoom-in-95 duration-1000">
                    <div className="grid gap-2 md:gap-3 grid-cols-2">
                        <div className="overflow-hidden rounded-2xl md:rounded-3xl border border-slate-100 bg-slate-50 row-span-2 shadow-inner group h-[300px] md:h-[500px]">
                            <img src={heroImages[0]} alt="SaaS dashboard template" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        </div>
                        <div className="overflow-hidden rounded-2xl md:rounded-3xl border border-slate-100 bg-slate-50 shadow-inner group h-[145px] md:h-[245px]">
                            <img src={heroImages[1] || heroImages[0]} alt="Fullstack project" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        </div>
                        <div className="overflow-hidden rounded-2xl md:rounded-3xl border border-slate-100 bg-slate-50 shadow-inner group h-[145px] md:h-[245px]">
                            <img src={heroImages[2] || heroImages[0]} alt="Developer asset" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;

