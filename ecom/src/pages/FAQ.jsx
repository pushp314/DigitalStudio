import React from 'react';
import FAQSection from '../components/FAQSection';
import Meta from '../components/common/Meta';
import { absoluteUrl, breadcrumbSchema } from '../utils/seo';

const FAQ = () => {
    return (
        <>
            <Meta
                title="BizCode FAQ for Templates, Apps and Support"
                description="Answers about buying SaaS templates, dashboard templates, fullstack projects, developer assets, custom builds, and support on BizCode."
                canonical={absoluteUrl('/faq')}
                jsonLd={[breadcrumbSchema([
                    { name: 'Home', path: '/' },
                    { name: 'FAQ', path: '/faq' },
                ])]}
            />
            <section className="ds-page px-4 sm:px-6 pt-12 sm:pt-16">
                <div className="ds-shell max-w-4xl">
                    <p className="ds-eyebrow">FAQ</p>
                    <h1 className="mt-3 text-clamp-5xl font-black tracking-tighter text-slate-900 leading-[0.95] sm:leading-[0.9]">
                        Questions about templates, apps, and <span className="text-slate-400">custom builds.</span>
                    </h1>
                </div>
            </section>
            <FAQSection />
        </>
    );
};

export default FAQ;
