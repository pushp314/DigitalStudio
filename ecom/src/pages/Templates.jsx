import React, { useContext, useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import productService from '../services/productService';
import api from '../services/api';
import BuildSitesHeader from '../components/BuildSitesHeader';
import TemplateGrid from '../components/TemplateGrid';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import AIRecommendationModal from '../components/ui/AIRecommendationModal';
import { FEATURES } from '../config/features';
import { normalizeProduct } from '../utils/normalizers';
import ConfigContext from '../context/ConfigContext';
import { Search, ArrowRight } from 'lucide-react';

const PRODUCT_TYPES = [
    { value: 'all', label: 'All products' },
    { value: 'fullstack', label: 'Full-stack apps' },
    { value: 'api', label: 'APIs and backend kits' },
    { value: 'component', label: 'Components' },
    { value: 'ui_kit', label: 'UI kits' },
    { value: 'template', label: 'Templates' },
    { value: 'code_snippet', label: 'Code snippets' },
    { value: 'edu_module', label: 'Learning modules' },
];

const Templates = () => {
    const { config } = useContext(ConfigContext);
    const { slug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const keyword = searchParams.get('search') || '';
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedProductType, setSelectedProductType] = useState('all');
    const [showMembersOnly, setShowMembersOnly] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [categoryData, setCategoryData] = useState(null);

    // Fetch category metadata if we are on a category page
    useEffect(() => {
        if (slug) {
            api.get(`/categories/${slug}`).then(setCategoryData).catch(() => setCategoryData(null));
        } else {
            setCategoryData(null);
        }
    }, [slug]);

    const { ref: loadMoreRef, inView } = useInView();
    const PAGE_SIZE = 12;

    const { 
        data: infiniteData, 
        isLoading, 
        error, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage,
        refetch 
    } = useInfiniteQuery({
        queryKey: ['templates', keyword, slug, sortBy, selectedCategory, selectedProductType, showMembersOnly, searchParams.get('techStack'), searchParams.get('priceMin'), searchParams.get('priceMax')],
        queryFn: ({ pageParam = 1 }) => productService.getAll({ 
            keyword, 
            categorySlug: slug, 
            page: pageParam, 
            pageSize: PAGE_SIZE,
            sortBy,
            category: selectedCategory === 'all' ? undefined : selectedCategory,
            productType: selectedProductType === 'all' ? undefined : selectedProductType,
            requiresSubscription: showMembersOnly ? true : undefined,
            techStack: searchParams.get('techStack') || undefined,
            priceMin: searchParams.get('priceMin') || undefined,
            priceMax: searchParams.get('priceMax') || undefined,
        }),
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined;
        },
        initialPageParam: 1,
    });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    const templates = useMemo(() => {
        if (!infiniteData) return [];
        return infiniteData.pages.flat().map(normalizeProduct);
    }, [infiniteData]);

    const categoriesList = useMemo(
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
                title={categoryData ? categoryData.name : "Explore ready"}
                highlight={categoryData ? "" : "apps and kits"}
                description={categoryData ? categoryData.description : "Find production-ready apps, dashboards, APIs, UI kits, and technical assets with clear pricing, previews, documentation, and support options."}
            />

            <section className="px-6 pb-8">
                <div className="ds-shell grid gap-4 md:grid-cols-3">
                    <div className="ds-card p-6 border-slate-200">
                        <p className="ds-eyebrow mb-2">Know what you need?</p>
                        <p className="text-[11px] leading-relaxed text-slate-500 font-medium tracking-tight">Filter our registry by product type, tech stack, and category to find your ready-to-launch starting point.</p>
                    </div>
                    <div className="ds-card p-6 border-indigo-100 bg-indigo-50/20">
                        <p className="ds-eyebrow mb-2 text-indigo-600">Not sure yet?</p>
                        <p className="text-[11px] leading-relaxed text-slate-500 font-medium tracking-tight">Talk to an expert about your goals, stack, and timeline. We'll help you pick the right product or guide your strategy.</p>
                        <Link to="/support" className="inline-flex items-center gap-2 mt-5 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">
                            Talk to an Expert <ArrowRight size={14} />
                        </Link>
                    </div>
                    <div className="ds-card p-6 border-slate-200">
                        <p className="ds-eyebrow mb-2">Need a custom build?</p>
                        <p className="text-[11px] leading-relaxed text-slate-500 font-medium tracking-tight">If you need a specialized solution built from scratch or high-value customization, hire our core developers to lead the project.</p>
                        <Link to="/hire-developer" className="inline-flex items-center gap-2 mt-5 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:opacity-70 transition-all">
                            Hire Developer <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </section>

            <section
                className="relative z-30 border-y border-slate-200 bg-[#F5F5F7] px-6 py-2"
            >
                <div className="ds-shell">
                    <div className="ds-card p-3">
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),auto] lg:items-center">
                            <div className="flex flex-col gap-3">
                                <div className="grid gap-3 md:grid-cols-4">
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

                                    <select
                                        value={searchParams.get('techStack') || 'all'}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'all') {
                                                searchParams.delete('techStack');
                                            } else {
                                                searchParams.set('techStack', val);
                                            }
                                            setSearchParams(searchParams);
                                        }}
                                        className="ds-select"
                                    >
                                        <option value="all">Any Tech Stack</option>
                                        <option value="React">React</option>
                                        <option value="Next.js">Next.js</option>
                                        <option value="Tailwind">Tailwind</option>
                                        <option value="Go">Go / Gin</option>
                                        <option value="Node.js">Node.js</option>
                                        <option value="Python">Python / Django</option>
                                        <option value="Flutter">Flutter</option>
                                    </select>

                                    <select
                                        value={searchParams.get('priceRange') || 'all'}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'all') {
                                                searchParams.delete('priceRange');
                                                searchParams.delete('priceMin');
                                                searchParams.delete('priceMax');
                                            } else {
                                                const [min, max] = val.split('-');
                                                searchParams.set('priceRange', val);
                                                searchParams.set('priceMin', min);
                                                if (max) searchParams.set('priceMax', max);
                                                else searchParams.delete('priceMax');
                                            }
                                            setSearchParams(searchParams);
                                        }}
                                        className="ds-select"
                                    >
                                        <option value="all">Any Price</option>
                                        <option value="0-999">Under ₹1,000</option>
                                        <option value="1000-4999">₹1,000 - ₹5,000</option>
                                        <option value="5000-14999">₹5,000 - ₹15,000</option>
                                        <option value="15000">₹15,000+</option>
                                    </select>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {categoriesList.slice(0, 6).map((category) => (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => setSelectedCategory(category)}
                                            className={selectedCategory === category ? 'ds-button-primary' : 'ds-button-secondary'}
                                        >
                                                {category === 'all' ? 'All use cases' : category}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                                <span className="text-sm text-slate-500" aria-live="polite">
                                    {sortedTemplates.length} {sortedTemplates.length === 1 ? 'ready product' : 'ready products'}
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
                            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Ready products are temporarily unavailable</h2>
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
                        <div className="ds-panel p-10 md:p-16 text-center max-w-4xl mx-auto border-dashed border-2 bg-white">
                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-8">
                                <Search size={32} />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900">No matching ready products</h2>
                            <p className="mt-4 text-base leading-7 text-slate-600 max-w-2xl mx-auto">
                                We couldn't find a ready-to-use product matching your current filters. You can reset your search, or if you need something specific, our experts can help you choose or build a custom solution.
                            </p>
                            
                            <div className="mt-10 grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
                                <button type="button" onClick={clearFilters} className="ds-button-secondary py-6 flex flex-col items-center gap-3 bg-slate-50 border-slate-100 h-full">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Option 1</span>
                                    <span className="text-xs font-bold text-slate-900">Reset all filters</span>
                                </button>
                                <Link to="/hire-developer" className="ds-button-secondary py-6 flex flex-col items-center gap-3 bg-slate-50 border-slate-100 h-full">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Option 2</span>
                                    <span className="text-xs font-bold text-slate-900">Get expert advice</span>
                                </Link>
                                <Link to="/contact" className="ds-button-secondary py-6 flex flex-col items-center gap-3 bg-slate-50 border-slate-100 h-full">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Option 3</span>
                                    <span className="text-xs font-bold text-slate-900">Request custom build</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                <div className="mt-2 md:mt-4 space-y-12">
                    <TemplateGrid items={sortedTemplates} />
                    
                    {/* Infinite Scroll Trigger */}
                    <div ref={loadMoreRef} className="py-20 flex justify-center">
                        {isFetchingNextPage ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading next batch...</span>
                            </div>
                        ) : hasNextPage ? (
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Scroll for more</span>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-px w-24 bg-slate-200"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">You've reached the end of the catalog</span>
                            </div>
                        )}
                    </div>
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
