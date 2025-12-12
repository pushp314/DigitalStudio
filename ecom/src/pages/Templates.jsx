import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import productService from '../services/productService';
import BuildSitesHeader from '../components/BuildSitesHeader';
import TemplateGrid from '../components/TemplateGrid';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

const Templates = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const keyword = searchParams.get('search') || '';
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedProductType, setSelectedProductType] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        fetchTemplates();
    }, [keyword]);

    const fetchTemplates = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await productService.getAll(keyword);
            setTemplates(data);
        } catch (err) {
            console.error("Failed to fetch templates", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Client-side filtering
    const filteredTemplates = templates.filter(template => {
        if (selectedCategory !== 'all' && template.category !== selectedCategory) {
            return false;
        }
        if (selectedProductType !== 'all' && template.productType !== selectedProductType) {
            return false;
        }
        return true;
    });

    // Sorting
    const sortedTemplates = [...filteredTemplates].sort((a, b) => {
        switch (sortBy) {
            case 'price-low':
                return parseFloat(a.price.replace(/[^0-9.]/g, '')) - parseFloat(b.price.replace(/[^0-9.]/g, ''));
            case 'price-high':
                return parseFloat(b.price.replace(/[^0-9.]/g, '')) - parseFloat(a.price.replace(/[^0-9.]/g, ''));
            case 'rating':
                return (b.rating || 0) - (a.rating || 0);
            case 'popular':
                return (b.numSales || 0) - (a.numSales || 0);
            case 'newest':
            default:
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
    });

    // Get unique categories and types
    const categories = ['all', ...new Set(templates.map(t => t.category))];
    const productTypes = [
        { value: 'all', label: 'All Products' },
        { value: 'fullstack', label: 'Full-Stack Projects' },
        { value: 'api', label: 'API Collections' },
        { value: 'component', label: 'Component Libraries' },
        { value: 'mobile', label: 'Mobile Apps' },
        { value: 'template', label: 'Templates' },
        { value: 'tool', label: 'Developer Tools' }
    ];

    return (
        <>
            <BuildSitesHeader
                title="Explore our professional"
                highlight="marketplace"
                description="Production-ready code, full-stack projects, APIs, and components built for developers."
            />

            {/* Filter Bar */}
            <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-[1400px] mx-auto px-6 py-4">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        {/* Left: Filters */}
                        <div className="flex flex-wrap gap-3">
                            {/* Product Type Filter */}
                            <select
                                value={selectedProductType}
                                onChange={(e) => setSelectedProductType(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {productTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>

                            {/* Category Pills */}
                            <div className="flex gap-2 flex-wrap">
                                {categories.slice(0, 5).map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category
                                                ? 'bg-black text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {category === 'all' ? 'All' : category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: Sort & Count */}
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">
                                {sortedTemplates.length} {sortedTemplates.length === 1 ? 'product' : 'products'}
                            </span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="newest">Newest</option>
                                <option value="popular">Most Popular</option>
                                <option value="rating">Highest Rated</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            {loading ? (
                <LoadingSkeleton count={6} />
            ) : error ? (
                <div className="min-h-[40vh] flex flex-col items-center justify-center p-6">
                    <div className="text-center max-w-md">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h3>
                        <p className="text-gray-500 mb-6">{error}</p>
                        <button
                            onClick={fetchTemplates}
                            className="bg-[#0055FF] text-white px-6 py-3 rounded-full font-bold hover:bg-blue-600 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            ) : sortedTemplates.length === 0 ? (
                <div className="min-h-[40vh] flex flex-col items-center justify-center p-6">
                    <div className="text-center max-w-md">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
                        <button
                            onClick={() => {
                                setSelectedCategory('all');
                                setSelectedProductType('all');
                                setSearchParams({});
                            }}
                            className="bg-[#0055FF] text-white px-6 py-3 rounded-full font-bold hover:bg-blue-600 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            ) : (
                <TemplateGrid items={sortedTemplates} />
            )}
        </>
    );
};

export default Templates;
