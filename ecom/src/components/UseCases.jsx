import React from 'react';
import { User, Building2, Rocket, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UseCases = () => {
    const navigate = useNavigate();

    const cases = [
        {
            title: 'For SaaS Founders',
            description: 'Launch your MVP in days with production-ready templates and save months of development time.',
            icon: Rocket,
            color: 'bg-blue-50 text-blue-600',
            link: '/assets'
        },
        {
            title: 'For Agencies',
            description: 'Scale your client delivery with high-quality assets and expert development support.',
            icon: Building2,
            color: 'bg-purple-50 text-purple-600',
            link: '/hire-developer'
        },
        {
            title: 'For Startups',
            description: 'Get custom-built solutions tailored to your unique business requirements and scale faster.',
            icon: User,
            color: 'bg-emerald-50 text-emerald-600',
            link: '/custom-request'
        }
    ];

    return (
        <section className="ds-page px-4 py-12 md:px-6 md:py-20">
            <div className="ds-shell">
                <div className="mb-12 text-center">
                    <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900">
                        Built for builders of all scales
                    </h2>
                    <p className="mt-4 text-sm md:text-base text-slate-500 max-w-2xl mx-auto">
                        Whether you're a solo founder or a scaling agency, BizCode provides the foundation you need.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {cases.map((item, idx) => (
                        <div 
                            key={idx}
                            onClick={() => navigate(item.link)}
                            className="group ds-card p-8 hover:border-slate-300 transition-all cursor-pointer"
                        >
                            <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${item.color}`}>
                                <item.icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                            <p className="text-sm leading-relaxed text-slate-500 mb-6">
                                {item.description}
                            </p>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 group-hover:gap-3 transition-all">
                                Explore solutions <ArrowRight size={16} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default UseCases;
