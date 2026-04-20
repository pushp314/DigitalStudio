import React from 'react';

const BuildSitesHeader = ({
    title = 'Build faster with our',
    highlight = 'templates',
    description = 'Browse practical products built for teams that want a clean starting point and a faster launch path.',
}) => {
    return (
        <section className="ds-page px-6 py-12 md:py-16">
            <div className="ds-shell flex flex-col gap-6">
                <p className="ds-eyebrow">DigitalStudio</p>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),320px] lg:items-end">
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                        {title} <span className="text-slate-500">{highlight}</span>
                    </h1>
                    <p className="text-base leading-7 text-slate-600">{description}</p>
                </div>
            </div>
        </section>
    );
};

export default BuildSitesHeader;
