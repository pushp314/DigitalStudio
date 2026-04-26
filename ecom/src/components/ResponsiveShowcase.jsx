import React, { useContext, useMemo } from 'react';
import ConfigContext from '../context/ConfigContext';

const ResponsiveShowcase = ({ products = [] }) => {
    const { config } = useContext(ConfigContext);

    const showcaseItems = useMemo(() => {
        if (Array.isArray(config?.showcaseItems) && config.showcaseItems.length > 0) {
            return config.showcaseItems.slice(0, 3);
        }

        return products.slice(0, 3).map((product, index) => ({
            title: product.title,
            subtitle: product.category,
            description: product.description,
            image: product.previewImages?.[0]?.url || product.image,
            footer: ['Desktop', 'Tablet', 'Mobile'][index] || 'Preview',
        }));
    }, [config?.showcaseItems, products]);

    if (!showcaseItems.length) {
        return null;
    }

    return (
        <section className="ds-page px-6 py-12">
            <div className="ds-shell space-y-8">
                <div className="space-y-3">
                    <p className="ds-eyebrow">Preview gallery</p>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                        A quick look at how products present across screens
                    </h2>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {showcaseItems.map((item) => (
                        <div key={`${item.title}-${item.footer}`} className="ds-card overflow-hidden">
                            <div className="overflow-hidden border-b border-slate-200 bg-slate-100">
                                {item.image ? (
                                    <img src={item.image} alt={item.title} className="aspect-[4/3] w-full object-cover" />
                                ) : (
                                    <div className="aspect-[4/3] w-full bg-slate-100" />
                                )}
                            </div>
                            <div className="space-y-3 p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-lg font-semibold tracking-tight text-slate-900">{item.title}</h3>
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                                        {item.footer}
                                    </span>
                                </div>
                                {item.subtitle && <p className="text-sm font-medium text-slate-600">{item.subtitle}</p>}
                                {item.description && <p className="text-sm leading-6 text-slate-600">{item.description}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ResponsiveShowcase;
