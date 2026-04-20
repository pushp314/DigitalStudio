import React from 'react';
import { Link } from 'react-router-dom';
import BuildSitesHeader from '../components/BuildSitesHeader';
import FeaturesGrid from '../components/FeaturesGrid';

const valueCards = [
    {
        title: 'Clear product details',
        description: 'Each listing is designed to show what is included, how it is priced, and what a team should expect after purchase.',
    },
    {
        title: 'Practical documentation',
        description: 'Guides, setup notes, and account tools are organized to reduce support friction after launch.',
    },
    {
        title: 'Consistent buying flow',
        description: 'Cart, checkout, and account access follow the same patterns so customers can move through the platform without surprises.',
    },
];

const Features = () => {
    return (
        <div className="ds-page">
            <BuildSitesHeader
                title="What the platform"
                highlight="includes"
                description="DigitalStudio is built to help customers evaluate products quickly, buy with confidence, and manage their access in one place."
            />

            <section className="px-6 py-8 md:py-12">
                <div className="ds-shell grid gap-6 md:grid-cols-3">
                    {valueCards.map((card) => (
                        <article key={card.title} className="ds-card p-6">
                            <h2 className="text-xl font-semibold tracking-tight text-slate-900">{card.title}</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <FeaturesGrid />

            <section className="px-6 py-16">
                <div className="ds-shell">
                    <div className="ds-panel flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-3">
                            <p className="ds-eyebrow">Next step</p>
                            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                Review the catalog or compare membership access
                            </h2>
                            <p className="max-w-2xl text-base leading-7 text-slate-600">
                                Start with individual products, or review pricing if your team needs broader access across the platform.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link to="/templates" className="ds-button-primary">
                                Browse products
                            </Link>
                            <Link to="/pricing" className="ds-button-secondary">
                                View pricing
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Features;
