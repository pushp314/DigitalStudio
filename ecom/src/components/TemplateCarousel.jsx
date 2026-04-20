import React, { useMemo, useRef } from 'react';

const TemplateCarousel = ({ product }) => {
    const scrollRef = useRef(null);

    const mediaItems = useMemo(() => {
        const items = Array.isArray(product?.previewImages)
            ? product.previewImages
                .filter((item) => item?.url)
                .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
                .map((item) => ({ ...item, type: 'image' }))
            : [];

        if (product?.videoUrl) {
            items.unshift({
                url: product.videoUrl,
                alt: `${product.title} video preview`,
                caption: 'Product walkthrough',
                sortOrder: -1,
                type: 'video',
            });
        }

        return items;
    }, [product]);

    if (!mediaItems.length) {
        return null;
    }

    return (
        <section className="ds-page border-b border-slate-200 px-6 py-12 md:py-16">
            <div className="ds-shell space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-2">
                        <p className="ds-eyebrow">Preview</p>
                        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Review the included screens</h2>
                        <p className="max-w-2xl text-base leading-7 text-slate-600">
                            Use the preview gallery to inspect the product before purchase.
                        </p>
                    </div>
                    <div className="hidden gap-3 md:flex">
                        <button type="button" onClick={() => scrollRef.current?.scrollBy({ left: -420, behavior: 'smooth' })} className="ds-button-secondary">
                            Previous
                        </button>
                        <button type="button" onClick={() => scrollRef.current?.scrollBy({ left: 420, behavior: 'smooth' })} className="ds-button-secondary">
                            Next
                        </button>
                    </div>
                </div>

                <div ref={scrollRef} className="flex gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {mediaItems.map((item, index) => (
                        <div key={`${item.url}-${index}`} className="w-[320px] flex-shrink-0 md:w-[620px]">
                            <div className="ds-card overflow-hidden">
                                <div className="aspect-[4/3] bg-slate-100 md:aspect-video">
                                    {item.type === 'video' ? (
                                        <video src={item.url} controls className="h-full w-full object-cover" />
                                    ) : (
                                        <img src={item.url} alt={item.alt || product.title} className="h-full w-full object-cover" />
                                    )}
                                </div>
                            </div>
                            <div className="mt-3 space-y-1">
                                <p className="text-sm font-medium text-slate-900">
                                    {item.caption || (item.type === 'video' ? 'Product walkthrough' : `Preview ${index + 1}`)}
                                </p>
                                <p className="text-sm text-slate-500">{item.type === 'video' ? 'Video' : 'Image preview'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TemplateCarousel;
