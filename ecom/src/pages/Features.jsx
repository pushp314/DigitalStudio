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
