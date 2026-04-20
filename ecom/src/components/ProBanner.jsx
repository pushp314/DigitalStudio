import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import ConfigContext from '../context/ConfigContext';

const ProBanner = () => {
    const { config } = useContext(ConfigContext);

    if (!config?.features?.subscriptions) {
        return null;
    }

    return (
        <section className="ds-page px-6 py-16">
            <div className="ds-shell">
                <div className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-sm md:p-10">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr),260px] lg:items-center">
                        <div className="space-y-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Membership</p>
                            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                                Get access to paid documentation and member tools
                            </h2>
                            <p className="max-w-2xl text-base leading-7 text-slate-300">
                                Upgrade when you want broader access across the marketplace. Keep the experience simple: one account, one plan, and clear member benefits.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Link to="/pricing" className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100">
                                View pricing
                            </Link>
                            <Link to="/docs" className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5">
                                Explore docs
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProBanner;
