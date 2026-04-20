import React, { useContext, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ProductHeader from '../components/ProductHeader';
import TemplateCarousel from '../components/TemplateCarousel';
import TemplateDetails from '../components/TemplateDetails';
import TemplateGrid from '../components/TemplateGrid';
import ProductReviews from '../components/ProductReviews';
import productService from '../services/productService';
import { normalizeProduct } from '../utils/normalizers';
import ConfigContext from '../context/ConfigContext';
import Meta from '../components/common/Meta';

const TemplatesDetails = () => {
    const { id } = useParams();
    const { config } = useContext(ConfigContext);
    const reviewsEnabled = config?.features?.reviews !== false;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    const { data, isLoading, error } = useQuery({
        queryKey: ['product', id],
        queryFn: () => productService.getById(id),
        enabled: Boolean(id),
    });

    const product = data ? normalizeProduct(data) : null;

    const { data: relatedProducts } = useQuery({
        queryKey: ['related-products', product?.category],
        queryFn: () => productService.getAll({ category: product?.category, limit: 4 }),
        enabled: Boolean(product?.category),
    });

    // Filter out the current product from related list
    const filteredRelated = (relatedProducts || [])
        .filter(p => p.id !== product?.id)
        .slice(0, 3);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">Loading...</div>;
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7] px-6 text-center">
                <h2 className="text-3xl font-bold mb-4">Product unavailable</h2>
                <p className="text-gray-500 mb-6 max-w-lg">
                    We could not load this product from the live API.
                </p>
                <Link to="/templates" className="text-primary font-bold underline">Back to templates</Link>
            </div>
        );
    }

    return (
        <div className="bg-[#F8FAFC]">
            <Meta 
                title={product.title}
                description={product.description}
                image={product.image}
                type="product"
            />
            <ProductHeader product={product} />
            <TemplateCarousel product={product} />
            <TemplateDetails product={product} />
            
            {reviewsEnabled && <ProductReviews productId={product.id} />}

            {/* Related Designs Section */}
            {filteredRelated.length > 0 && (
                <div className="py-24 px-6 border-t border-slate-100 bg-white">
                    <div className="max-w-[1400px] mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                            <div className="flex flex-col gap-4 text-left">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">More for You</span>
                                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Related <span className="text-primary">Designs</span></h2>
                            </div>
                            <Link to="/templates" className="bg-slate-50 text-slate-900 px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all border border-slate-100 mb-2">
                                View All Products
                            </Link>
                        </div>
                        
                        <div className="grid grid-cols-1">
                            <TemplateGrid items={filteredRelated} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplatesDetails;
