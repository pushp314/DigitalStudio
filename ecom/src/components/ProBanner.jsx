import React from 'react';
import { Link } from 'react-router-dom';

const ProBanner = () => {
    return (
        <section className="bg-[#F5F5F7] py-20 px-6">
            <div className="max-w-[1400px] mx-auto">
                <div className="bg-black rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden group">
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full group-hover:bg-indigo-600/30 transition-all duration-700"></div>
                    <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-slate-400/10 blur-[100px] rounded-full"></div>

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10 mb-8 backdrop-blur-md">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                                <span className="text-xs font-bold tracking-widest text-white/80">Pro Membership Available Now</span>
                            </div>
                            
                            <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1] tracking-tight text-white">
                                One pass. <br />
                                <span className="text-indigo-400 font-black">Everything</span> unlocked.
                            </h2>
                            
                            <p className="text-xl text-slate-400 font-medium mb-12 max-w-lg leading-relaxed">
                                Join the elite tier of developers and creators. Get unlimited access to premium technical guides, AI tools, and zero-commission sales.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <Link 
                                    to="/pricing" 
                                    className="w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 transition-all duration-300 shadow-xl shadow-indigo-600/20 outline-none"
                                >
                                    View Pro Tiers
                                </Link>
                                <span className="text-slate-500 font-bold hidden sm:block">Starting at ₹2,499/mo</span>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="grid grid-cols-2 gap-4">
                                <FeatureCard icon="⚡" title="All-Access Docs" desc="Every guide, now fully unlocked" />
                                <FeatureCard icon="✨" title="AI Roadmap" desc="Personalized curation engine" />
                                <FeatureCard icon="🎨" title="Pro Templates" desc="Source files for core assets" />
                                <FeatureCard icon="🤝" title="0% Commission" desc="Keep 100% of your earnings" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm hover:border-white/20 transition-all hover:bg-white/10 group/card">
        <div className="text-3xl mb-4 group-hover/card:scale-110 transition-transform">{icon}</div>
        <h4 className="text-lg font-black text-white mb-2">{title}</h4>
        <p className="text-sm text-gray-500 font-medium leading-normal">{desc}</p>
    </div>
);

export default ProBanner;
