import React from 'react';
import { Link } from 'react-router-dom';

const BrowseTemplatesCTA = () => {
    return (
        <section className="ds-page px-6 py-16">
            <div className="ds-shell">
                <div className="ds-panel grid gap-8 p-6 md:p-8 lg:grid-cols-[360px,minmax(0,1fr)] lg:items-center">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                            <img
                                src="https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=800"
                                alt="Portfolio kit preview"
                                className="aspect-[4/3] w-full object-cover"
                            />
                        </div>
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                            <img
                                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800"
                                alt="Dashboard app preview"
                                className="aspect-[4/3] w-full object-cover"
                            />
                        </div>
                    </div>

                    <div className="space-y-5">
                        <p className="ds-eyebrow">Start with a ready product</p>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                            Find an app, customize it, or ask us what fits
                        </h2>
                        <p className="text-base leading-7 text-slate-600">
                            Explore apps, dashboards, UI kits, APIs, and software assets with clear pricing, documentation, and support paths after purchase.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link to="/apps" className="ds-button-primary">
                                Explore apps
                            </Link>
                            <Link to="/hire-developer" className="ds-button-secondary">
                                Talk to an expert
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BrowseTemplatesCTA;
