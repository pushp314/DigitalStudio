import React from 'react';
import { Link } from 'react-router-dom';

const ProBanner = () => {
    return (
        <section className="ds-page px-6 py-16">
            <div className="ds-shell">
                <div className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-sm md:p-10">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr),260px] lg:items-center">
                        <div className="space-y-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Pro Membership</p>
                            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                                Get broader access, priority help, and community chat
                            </h2>
                            <p className="max-w-2xl text-base leading-7 text-slate-300">
                                Upgrade when you need premium guides, unlimited community messaging, member support benefits, and a clearer path through setup and deployment.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Link to="/pricing" className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100">
                                Compare plans
                            </Link>
                            <Link to="/docs" className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5">
                                View docs
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProBanner;
