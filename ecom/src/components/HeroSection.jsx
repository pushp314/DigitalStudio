import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfigContext from '../context/ConfigContext';

const HeroSection = () => {
    const { config } = useContext(ConfigContext);
    const navigate = useNavigate();

    const trustedCompanies = Array.isArray(config?.socialProof?.trustedCompanies) ? config.socialProof.trustedCompanies : [];
    const heroImages = Array.isArray(config?.heroImages) && config.heroImages.length > 0
        ? config.heroImages
        : [
            'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200',
        ];

    // Double the companies for seamless infinite scrolling
    const marqueeCompanies = [...trustedCompanies, ...trustedCompanies];

    return (
        <section className="ds-page px-6 pb-12 pt-8 md:pb-24 md:pt-16 overflow-hidden">
            <style>
                {`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
                `}
            </style>
            
            <div className="ds-shell grid gap-12 lg:grid-cols-[minmax(0,1fr),560px] lg:items-center">
                <div className="space-y-10">
                    <div className="ds-chip animate-in fade-in slide-in-from-left-4 duration-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        DigitalStudio commerce and services
                    </div>

                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        <h1 className="text-5xl font-bold tracking-tight text-slate-900 md:text-7xl leading-[1.1]">
                            Buy ready apps. Customize them. Or let us build for you.
                        </h1>
                        <p className="max-w-2xl text-lg leading-relaxed text-slate-500 font-medium pt-2">
                            Skip months of development. Get production-ready apps, expert help, and deployment support in one place.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                        <button type="button" onClick={() => navigate('/apps')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10">
                            Explore Apps
                        </button>
                        <button type="button" onClick={() => navigate('/hire-developer')} className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-slate-50 transition-all">
                            Hire Developer
                        </button>
                        <button type="button" onClick={() => navigate('/support')} className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-slate-50 transition-all">
                            Get Expert Help
                        </button>
                    </div>

                    {/* Buyer decision paths */}
                    <div className="grid gap-4 sm:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Buy Ready</p>
                            <p className="text-xs font-semibold text-slate-600 leading-relaxed">Apps, dashboards, UI kits, APIs, and software kits you can launch from.</p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Get Help</p>
                            <p className="text-xs font-semibold text-slate-600 leading-relaxed">Use paid support, docs, and post-purchase deployment guidance when you need it.</p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Build Custom</p>
                            <p className="text-xs font-semibold text-slate-600 leading-relaxed">Request changes, custom features, deployment, or a full build from our team.</p>
                        </div>
                    </div>

                    {/* Infinite Scrolling Marquee Logic */}
                    {trustedCompanies.length > 0 && (
                        <div className="space-y-4 pt-6 animate-in fade-in duration-1000 delay-500">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Trusted by teams building with</p>
                            <div className="relative overflow-hidden w-full h-12 flex items-center">
                                <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#fafafa] to-transparent z-10" />
                                <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#fafafa] to-transparent z-10" />
                                <div className="flex whitespace-nowrap animate-marquee">
                                    {marqueeCompanies.map((company, idx) => (
                                        <div key={`${company}-${idx}`} className="flex items-center mx-10">
                                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest group cursor-default hover:text-slate-900 transition-colors">
                                                {company}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Hero Visualization - Dynamically Managed */}
                <div className="ds-panel p-4 animate-in fade-in zoom-in-95 duration-1000">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-100 sm:row-span-2 shadow-inner group">
                            <img src={heroImages[0]} alt="Hero Primary" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        </div>
                        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 shadow-inner group">
                            <img src={heroImages[1] || heroImages[0]} alt="Hero Secondary" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        </div>
                        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 shadow-inner group">
                            <img src={heroImages[2] || heroImages[0]} alt="Hero Tertiary" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
