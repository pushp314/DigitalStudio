import React, { useContext, useMemo } from 'react';
import ConfigContext from '../context/ConfigContext';

const ResponsiveShowcase = ({ products = [] }) => {
  const { config } = useContext(ConfigContext);

  const showcaseItems = useMemo(() => {
    if (Array.isArray(config?.showcaseItems) && config.showcaseItems.length > 0) {
      return config.showcaseItems;
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
    <div className="w-full bg-[#F5F5F7] px-6 py-20 font-sans">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {showcaseItems.map((item) => (
          <div key={`${item.title}-${item.footer}`} className="flex flex-col gap-4 group">
            <div className="w-full aspect-[4/3.5] bg-white rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-500 ease-out group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] group-hover:-translate-y-2 relative border border-gray-100/50">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 via-white to-slate-200" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-xs uppercase tracking-[0.25em] text-white/70 mb-2">{item.footer}</p>
                <h3 className="text-2xl font-black tracking-tight">{item.title}</h3>
                {item.subtitle && <p className="text-sm text-white/80 mt-2">{item.subtitle}</p>}
                {item.description && <p className="text-sm text-white/75 mt-3 line-clamp-3">{item.description}</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm group-hover:shadow-md transition-shadow">
              <div>
                <div className="text-lg font-bold text-black">{item.footer}</div>
                {item.subtitle && <div className="text-sm text-gray-500">{item.subtitle}</div>}
              </div>
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" /></svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveShowcase;
