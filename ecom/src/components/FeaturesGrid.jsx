import React from 'react';

const items = [
    {
        title: 'Clean starting points',
        description: 'Use products that give your team a clear structure, modern defaults, and room to customize without reworking the basics.',
    },
    {
        title: 'Faster delivery',
        description: 'Shorten setup time with ready-to-ship layouts, reusable patterns, and product details that match the actual implementation.',
    },
    {
        title: 'Reliable support',
        description: 'Use docs, account tools, and support flows designed to help teams stay confident after purchase.',
    },
];

const FeaturesGrid = () => {
    return (
        <section className="ds-page px-6 py-16">
            <div className="ds-shell space-y-8">
                <div className="space-y-3">
                    <p className="ds-eyebrow text-center">DigitalStudio Advantage</p>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                        A simpler path from discovery to launch
                    </h2>
                    <p className="max-w-3xl text-base leading-7 text-slate-600">
                        The platform is built to feel predictable: consistent product pages, clear checkout flows, and docs that match what customers actually buy.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {items.map((item) => (
                        <div key={item.title} className="ds-card p-6">
                            <h3 className="text-xl font-semibold tracking-tight text-slate-900">{item.title}</h3>
                            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesGrid;
