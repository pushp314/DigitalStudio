import React from 'react';

const TrustSection = () => {
    const stats = [
        { label: 'Products Launched', value: '150+' },
        { label: 'Happy Founders', value: '1,200+' },
        { label: 'Success Rate', value: '99%' },
        { label: 'Support Response', value: '< 12h' }
    ];

    const logos = ['MARK', 'PINPOINT', 'PRODUCT.', 'RISE', 'FLARE', 'CORE'];

    return (
        <section className="ds-page px-4 py-12 md:px-6 md:py-20 bg-white border-y border-slate-100">
            <div className="ds-shell">
                <div className="grid gap-12 lg:grid-cols-[1fr,400px] items-center">
                    <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 text-center lg:text-left">
                            Trusted by teams at
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-12 opacity-50 grayscale">
                            {logos.map((logo, idx) => (
                                <div key={idx} className="flex items-center justify-center lg:justify-start">
                                    <span className="text-xl font-black text-slate-900 tracking-tighter italic">{logo}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="ds-card p-6 text-center lg:text-left">
                                <p className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TrustSection;
