import React, { useContext } from 'react';
import ConfigContext from '../context/ConfigContext';

const FeaturedHeader = () => {
    const { config } = useContext(ConfigContext);
    const socialProof = config?.socialProof ?? {};
    const avatars = Array.isArray(socialProof.avatarImages) ? socialProof.avatarImages : [];

    return (
        <section className="ds-page px-6 pt-10 pb-6 md:pt-12 md:pb-8">
            <div className="ds-shell flex flex-col gap-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="ds-eyebrow mb-2">Featured apps and kits</p>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                            Popular ready-to-use products
                        </h2>
                    </div>
                    {(socialProof.rating || socialProof.summary || socialProof.creatorsLabel) && (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            {socialProof.rating && <p className="text-sm font-semibold text-slate-900">{socialProof.rating}</p>}
                            <p className="text-sm text-slate-600">{socialProof.creatorsLabel || socialProof.summary}</p>
                        </div>
                    )}
                </div>

                {avatars.length > 0 && (
                    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="flex -space-x-3">
                            {avatars.slice(0, 5).map((src, index) => (
                                <div
                                    key={`${src}-${index}`}
                                    className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-slate-100"
                                >
                                    <img src={src} alt={`Customer ${index + 1}`} className="h-full w-full object-cover" />
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-slate-600">Used by builders who want a faster path from idea to launch.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default FeaturedHeader;
