import React from 'react';

const BuildSitesHeader = ({
    title = 'Build faster with ready',
    highlight = 'apps',
    description = 'Browse production-ready apps, software kits, dashboards, guides, and expert help for a faster launch path.',
}) => {
    return (
        <section className="ds-page px-6 pt-6 pb-8 md:pt-8 md:pb-12">
            <div className="ds-shell flex flex-col gap-4">
                <p className="ds-eyebrow">BizCode</p>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),auto] lg:items-end">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                            {title} <span className="text-slate-500">{highlight}</span>
                        </h1>
                        <p className="text-base leading-7 text-slate-600 max-w-2xl">{description}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Not sure?</span>
                        <a href="/custom-request" className="text-[10px] font-bold text-emerald-600 hover:underline uppercase tracking-widest">Request Custom Build</a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BuildSitesHeader;
