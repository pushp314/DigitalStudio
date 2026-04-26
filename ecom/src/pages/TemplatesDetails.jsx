import React, { useContext, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
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
import { BLOG_POSTS } from '../data/blogPosts';
import { CATEGORY_SEO } from '../data/seoContent';
import {
    absoluteUrl,
    breadcrumbSchema,
    productCanonicalPath,
    productCategorySlug,
    productSchema,
    productSeoDescription,
    productSeoTitle,
} from '../utils/seo';

const TemplatesDetails = () => {
    const { id, productSlug } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { config } = useContext(ConfigContext);
    const reviewsEnabled = config?.features?.reviews !== false;
    const productLookup = productSlug || id;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [productLookup]);

    const { data, isLoading, error } = useQuery({
        queryKey: ['product', productLookup],
        queryFn: () => productSlug ? productService.getBySlug(productSlug) : productService.getById(id),
        enabled: Boolean(productLookup),
    });

    const product = data ? normalizeProduct(data) : null;
    const canonicalPath = product ? productCanonicalPath(product) : '';
    const categorySlug = product ? productCategorySlug(product) : '';
    const category = categorySlug ? CATEGORY_SEO[categorySlug] : null;

    useEffect(() => {
        if (product && canonicalPath && location.pathname.startsWith('/assets/') && location.pathname !== canonicalPath) {
            navigate(canonicalPath, { replace: true });
        }
    }, [canonicalPath, location.pathname, navigate, product]);

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

    const relatedBlogs = useMemo(
        () => BLOG_POSTS
            .filter((post) => post.relatedCategories.includes(categorySlug))
            .slice(0, 3),
        [categorySlug],
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
                        <Link to="/assets" className="ds-button-primary mt-6">
                            Back to assets
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="ds-page">
            <Meta
                title={productSeoTitle(product)}
                description={productSeoDescription(product)}
                image={product.ogImage || product.image}
                canonical={absoluteUrl(canonicalPath)}
                type="product"
                jsonLd={[
                    productSchema(product),
                    breadcrumbSchema([
                        { name: 'Home', path: '/' },
                        { name: 'Assets', path: '/assets' },
                        { name: category?.title || product.category || 'Developer Assets', path: `/assets/${categorySlug}` },
                        { name: product.title, path: canonicalPath },
                    ]),
                ]}
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
                                    Similar ready products
                                </h2>
                            </div>
                            <Link to={categorySlug ? `/assets/${categorySlug}` : '/assets'} className="ds-button-secondary">
                                View category
                            </Link>
                        </div>
                        <TemplateGrid items={filteredRelated} />
                    </div>
                </section>
            )}

            {relatedBlogs.length > 0 && (
                <section className="border-t border-slate-200 px-6 py-12 md:py-16">
                    <div className="ds-shell space-y-6">
                        <div className="space-y-2">
                            <p className="ds-eyebrow">Implementation guides</p>
                            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                Learn before you customize
                            </h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            {relatedBlogs.map((post) => (
                                <Link key={post.slug} to={`/blog/${post.slug}`} className="ds-card p-6 hover:border-slate-300">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{post.targetKeyword}</p>
                                    <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">{post.title}</h3>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">{post.description}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default TemplatesDetails;
