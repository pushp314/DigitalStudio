import React from 'react';
import BuildSitesHeader from '../components/BuildSitesHeader';
import FeaturesGrid from '../components/FeaturesGrid';
import { Link } from 'react-router-dom';

const Features = () => {
    return (
        <div className="bg-[#F5F5F7]">
            <BuildSitesHeader
                title="Supercharging your"
                highlight="development workflow"
                description="DigitalStudio is more than just a marketplace. We provide the tools, support, and community you need to scale from zero to production."
            />
            
            {/* Context Section: Why wait? */}
            <div className="px-6 py-12">
                <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <div className="text-3xl mb-6">🎯</div>
                        <h3 className="text-2xl font-black text-black mb-4">The Purpose</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            We bridge the gap between "buying a template" and "shipping a product." Every feature is designed to reduce your friction and increase your speed.
                        </p>
                    </div>
                    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <div className="text-3xl mb-6">🚀</div>
                        <h3 className="text-2xl font-black text-black mb-4">The Strategy</h3>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            Leverage AI-driven roadmaps to choose the right stack, and follow our Pro Documentation to customize your site in minutes, not days.
                        </p>
                    </div>
                    <div className="bg-black p-10 rounded-[2.5rem] text-white shadow-2xl">
                        <div className="text-3xl mb-6">💎</div>
                        <h3 className="text-2xl font-black mb-4">The Value</h3>
                        <p className="text-gray-400 font-medium leading-relaxed mb-8">
                            Join the Pro Membership to eliminate all purchase barriers and keep 100% of your earnings when selling on our platform.
                        </p>
                        <Link to="/pricing" className="text-primary font-black hover:underline group flex items-center gap-2">
                            Explore Pro Tiers <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                    </div>
                </div>

                {/* AI & Premium Insights Surface */}
                <div className="max-w-[1400px] mx-auto mt-24 mb-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-gradient-to-br from-indigo-50 to-white p-12 rounded-[3.5rem] border border-indigo-100 flex flex-col justify-between overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000"></div>
                        <div className="relative z-10">
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] bg-indigo-100/50 px-5 py-2 rounded-full mb-8 inline-block">Pro Intelligence</span>
                            <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-6">
                                AI-Driven Stack <br /> <span className="text-indigo-400">Recommendations.</span>
                            </h3>
                            <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md">
                                Stop guessing. Our integrated AI analyzes your project goals and suggests the perfect combination of templates and modules to ensure technical success.
                            </p>
                        </div>
                        <div className="mt-12 flex items-center gap-4">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-white border-2 border-white">React</div>
                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white border-2 border-white">AI</div>
                            </div>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Only for Pro Members</span>
                        </div>
                    </div>

                    <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                        <div className="relative z-10">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] bg-emerald-50 px-5 py-2 rounded-full mb-8 inline-block">Elite Community</span>
                            <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-6">
                                Real-Time Dev <br /> <span className="text-emerald-400">Collaborations.</span>
                            </h3>
                            <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md">
                                Access private chat channels where senior engineers share insights, debug complex logic, and release exclusive early-access drops.
                            </p>
                        </div>
                        <div className="mt-12">
                             <Link to="/chat" className="text-slate-900 font-black flex items-center gap-3 hover:translate-x-2 transition-transform duration-300">
                                Open Community Chat <span>→</span>
                             </Link>
                        </div>
                    </div>
                </div>
            </div>

            <FeaturesGrid />

            {/* Call to action */}
            <div className="py-32 px-6 text-center">
                <h2 className="text-5xl md:text-7xl font-black text-black mb-8 tracking-tight">Ready to build <br/> something <span className="text-primary">epic?</span></h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Link to="/templates" className="px-10 py-5 bg-black text-white font-black rounded-2xl hover:bg-primary transition-all">
                        Browse the Marketplace
                    </Link>
                    <Link to="/pricing" className="px-10 py-5 bg-white text-black font-black border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all">
                        Compare Memberships
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Features;
