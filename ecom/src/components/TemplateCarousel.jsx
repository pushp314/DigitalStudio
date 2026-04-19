import React, { useMemo, useRef } from 'react';

const TemplateCarousel = ({ product }) => {
  const scrollRef = useRef(null);
  
  const mediaItems = useMemo(() => {
    const items = Array.isArray(product?.previewImages)
      ? product.previewImages
          .filter((item) => item?.url)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((item) => ({ ...item, type: 'image' }))
      : [];

    if (product?.videoUrl) {
      items.unshift({
        url: product.videoUrl,
        alt: `${product.title} video preview`,
        caption: 'Video walkthrough',
        sortOrder: -1,
        type: 'video',
      });
    }

    return items;
  }, [product]);

  if (!mediaItems.length) return null;

  return (
    <div className="w-full bg-[#F5F5F7] py-20 font-sans border-b border-gray-200/50">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4 uppercase text-[10px] tracking-[0.3em] lg:normal-case lg:text-[4rem]">
              Visual <span className="text-primary">Showcase</span>
            </h2>
            <p className="text-gray-500 font-medium text-lg max-w-xl">
              Take a deep dive into the interface and user experience of this template. High-fidelity previews of every core view.
            </p>
          </div>
          <div className="hidden md:flex gap-2">
            <button 
              onClick={() => scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors shadow-sm"
            >
              ←
            </button>
            <button 
              onClick={() => scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors shadow-sm"
            >
              →
            </button>
          </div>
        </div>

        {/* Play Store Style Horizontal Scroll */}
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {mediaItems.map((item, index) => (
            <div 
              key={index}
              className="flex-shrink-0 w-[300px] md:w-[600px] snap-center"
            >
              {/* Browser Window Frame */}
              <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-200 shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="ml-4 flex-grow bg-white rounded-lg border border-gray-200 py-1.5 px-4 text-[10px] text-gray-400 font-mono truncate">
                    https://digitalstudio.io/templates/{product.slug}/preview-{index + 1}
                  </div>
                </div>
                
                <div className="relative aspect-[4/3] md:aspect-video bg-gray-100">
                  {item.type === 'video' ? (
                    <video 
                      src={item.url} 
                      controls 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img 
                      src={item.url} 
                      alt={item.alt || product.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  {item.type === 'video' ? 'Interactable Video' : `View ${index + 1}`}
                </span>
                <h4 className="text-xl font-bold text-black">
                  {item.caption || (item.type === 'video' ? 'Product Walkthrough' : 'Interface Screenshot')}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
};

export default TemplateCarousel;
