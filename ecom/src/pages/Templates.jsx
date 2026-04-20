import React, { useContext, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import productService from '../services/productService';
import BuildSitesHeader from '../components/BuildSitesHeader';
import TemplateGrid from '../components/TemplateGrid';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import AIRecommendationModal from '../components/ui/AIRecommendationModal';
import { FEATURES } from '../config/features';
import { normalizeProduct } from '../utils/normalizers';
import ConfigContext from '../context/ConfigContext';

const PRODUCT_TYPES = [
    { value: 'all', label: 'All products' },
    { value: 'fullstack', label: 'Full-stack' },
    { value: 'api', label: 'API' },
    { value: 'component', label: 'Components' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'template', label: 'Templates' },
    { value: 'tool', label: 'Tools' },
];

const Templates = () => {
    const { config } = useContext(ConfigContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const keyword = searchParams.get('search') || '';
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedProductType, setSelectedProductType] = useState('all');
    const [showMembersOnly, setShowMembersOnly] = useState(false);
    const [sortBy, setSortBy] = useState('newest');

    const { data: rawTemplates, isLoading, error, refetch } = useQuery({
        queryKey: ['templates', keyword],
        queryFn: () => productService.getAll(keyword),
    });

    const templates = useMemo(
        () => (Array.isArray(rawTemplates) ? rawTemplates.map(normalizeProduct) : []),
        [rawTemplates],
    );

    const categories = useMemo(
        () => ['all', ...new Set(templates.map((template) => template.category).filter(Boolean))],
        [templates],
    );

    const sortedTemplates = useMemo(() => {
        const filtered = templates.filter((template) => {
            if (selectedCategory !== 'all' && template.category !== selectedCategory) {
                return false;
            }
            if (selectedProductType !== 'all' && template.productType !== selectedProductType) {
                return false;
            }
            if (showMembersOnly && !template.requiresSubscription) {
                return false;
            }
            return true;
        });

        return [...filtered].sort((left, right) => {
            switch (sortBy) {
                case 'price-low':
                    return left.price - right.price;
                case 'price-high':
                    return right.price - left.price;
                case 'rating':
                    return (right.rating || 0) - (left.rating || 0);
                case 'popular':
                    return (right.numSales || 0) - (left.numSales || 0);
                case 'newest':
                default:
                    return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
            }
        });
    }, [selectedCategory, selectedProductType, showMembersOnly, sortBy, templates]);

    const clearFilters = () => {
        setSelectedCategory('all');
        setSelectedProductType('all');
        setShowMembersOnly(false);
        setSortBy('newest');
        setSearchParams({});
    };

    return (
        <>
            <BuildSitesHeader
                title="Browse practical"
                highlight="products"
                description="Find templates, components, and tools with clear pricing, clean previews, and product details that match what you receive."
            />

            <section
                className={`sticky z-40 border-y border-slate-200 bg-[#F5F5F7]/95 px-6 py-4 backdrop-blur ${
                    config?.showAnnouncement && config?.announcements?.length > 0 ? 'top-[88px] md:top-[112px]' : 'top-[64px] md:top-[88px]'
                }`}
            >
                <div className="ds-shell">
                    <div className="ds-card p-4">
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),auto] lg:items-center">
                            <div className="flex flex-col gap-3">
                                <div className="grid gap-3 md:grid-cols-3">
                                    <select
                                        value={selectedProductType}
                                        onChange={(event) => setSelectedProductType(event.target.value)}
                                        className="ds-select"
                                    >
                                        {PRODUCT_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={sortBy}
                                        onChange={(event) => setSortBy(event.target.value)}
                                        className="ds-select"
                                    >
                                        <option value="newest">Newest</option>
                                        <option value="popular">Most popular</option>
                                        <option value="rating">Highest rated</option>
                                        <option value="price-low">Price: low to high</option>
                                        <option value="price-high">Price: high to low</option>
                                    </select>


                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {categories.slice(0, 6).map((category) => (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => setSelectedCategory(category)}
                                            className={selectedCategory === category ? 'ds-button-primary' : 'ds-button-secondary'}
                                        >
                                            {category === 'all' ? 'All categories' : category}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                                <span className="text-sm text-slate-500" aria-live="polite">
                                    {sortedTemplates.length} {sortedTemplates.length === 1 ? 'product' : 'products'}
                                </span>
                                <button type="button" onClick={clearFilters} className="ds-button-ghost">
                                    Clear filters
                                </button>
                                {FEATURES.ai && (
                                    <button type="button" onClick={() => setIsAIModalOpen(true)} className="ds-button-secondary">
                                        Ask AI
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {isLoading ? (
                <LoadingSkeleton count={6} />
            ) : error ? (
                <section className="ds-page px-6 py-16">
                    <div className="ds-shell">
                        <div className="ds-card p-8 text-center">
                            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Products are temporarily unavailable</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                We could not load the catalog from the API. Please try again.
                            </p>
                            <button type="button" onClick={() => refetch()} className="ds-button-primary mt-6">
                                Try again
                            </button>
                        </div>
                    </div>
                </section>
            ) : sortedTemplates.length === 0 ? (
                <section className="ds-page px-6 py-16">
                    <div className="ds-shell">
                        <div className="ds-card p-8 text-center">
                            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">No matching products</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                Adjust your filters or search terms to see more results.
                            </p>
                            <button type="button" onClick={clearFilters} className="ds-button-primary mt-6">
                                Reset filters
                            </button>
                        </div>
                    </div>
                </section>
            ) : (
                <div className="mt-8 md:mt-12">
                    <TemplateGrid items={sortedTemplates} />
                </div>
            )}

            {FEATURES.ai && (
                <AIRecommendationModal
                    isOpen={isAIModalOpen}
                    onClose={() => setIsAIModalOpen(false)}
                    selectedTechStack={selectedCategory}
                />
            )}
        </>
    );
};

export default Templates;
