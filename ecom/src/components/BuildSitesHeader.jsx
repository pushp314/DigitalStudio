import React from 'react';

const BuildSitesHeader = ({
    title = 'Build faster with ready',
    highlight = 'apps',
    description = 'Browse production-ready apps, software kits, dashboards, guides, and expert help for a faster launch path.',
}) => {
    return (
        <section className="ds-page px-4 sm:px-6 pt-8 pb-10 md:pt-8 md:pb-12">
            <div className="ds-shell flex flex-col gap-4">
                <p className="ds-eyebrow">BizCode</p>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),auto] lg:items-end">
                    <div className="space-y-4 sm:space-y-6">
                        <h1 className="text-clamp-6xl font-black tracking-tighter text-slate-900 leading-[0.95] sm:leading-[0.9]">
                            {title} <span className="text-slate-400">{highlight}</span>
                        </h1>
                        <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl font-medium">{description}</p>
                    </div>
                    <div className="shrink-0 flex flex-wrap items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Not sure?</span>
                        <a href="/custom-request" className="text-[10px] font-black text-emerald-600 hover:opacity-80 uppercase tracking-widest">Request Custom Build</a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BuildSitesHeader;
