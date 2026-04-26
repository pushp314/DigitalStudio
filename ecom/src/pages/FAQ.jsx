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
            <section className="ds-page px-6 pt-16">
                <div className="ds-shell max-w-4xl">
                    <p className="ds-eyebrow">FAQ</p>
                    <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                        Questions about SaaS templates, ready-made apps, and custom builds
                    </h1>
                </div>
            </section>
            <FAQSection />
        </>
    );
};

export default FAQ;
