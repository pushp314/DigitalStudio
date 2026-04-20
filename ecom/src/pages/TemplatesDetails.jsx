import React, { useContext, useEffect, useMemo } from 'react';
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

    const filteredRelated = useMemo(
        () => (Array.isArray(relatedProducts) ? relatedProducts.map(normalizeProduct) : [])
            .filter((item) => item.id !== product?.id)
            .slice(0, 3),
        [product?.id, relatedProducts],
    );

    if (isLoading) {
        return <div className="ds-page flex min-h-screen items-center justify-center text-slate-600">Loading product...</div>;
    }

    if (error || !product) {
        return (
            <div className="ds-page min-h-screen px-6 py-24">
                <div className="ds-shell">
                    <div className="ds-card p-8 text-center">
                        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Product unavailable</h2>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            We could not load this product from the API.
                        </p>
                        <Link to="/templates" className="ds-button-primary mt-6">
                            Back to products
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="ds-page">
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

            {filteredRelated.length > 0 && (
                <section className="border-t border-slate-200 px-6 py-12 md:py-16">
                    <div className="ds-shell space-y-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div className="space-y-2">
                                <p className="ds-eyebrow">Related products</p>
                                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                    Similar options in the catalog
                                </h2>
                            </div>
                            <Link to="/templates" className="ds-button-secondary">
                                View all products
                            </Link>
                        </div>
                        <TemplateGrid items={filteredRelated} />
                    </div>
                </section>
            )}
        </div>
    );
};

export default TemplatesDetails;
