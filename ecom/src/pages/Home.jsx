import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import HeroSection from '../components/HeroSection';
import FeaturedHeader from '../components/FeaturedHeader';
import TemplateGrid from '../components/TemplateGrid';
import BrowseTemplatesCTA from '../components/BrowseTemplatesCTA';
import ResponsiveShowcase from '../components/ResponsiveShowcase';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import FAQSection from '../components/FAQSection';
import ProBanner from '../components/ProBanner';
import productService from '../services/productService';
import { normalizeProduct } from '../utils/normalizers';

import Meta from '../components/common/Meta';
import CarouselStack from '../components/CarouselStack';
import ConfigContext from '../context/ConfigContext';
import { useContext } from 'react';

const Home = () => {
    const { config } = useContext(ConfigContext);
    const { data, isLoading, error } = useQuery({
        queryKey: ['products', 'featured-home'],
        queryFn: () => productService.getAll({ featured: true, limit: 3 }),
    });

    const featuredProducts = useMemo(
        () => (Array.isArray(data) ? data.map(normalizeProduct) : []),
        [data],
    );

    return (
        <>
            <Meta 
                title="Developer Templates, Docs, and Code Assets"
                description="Browse developer templates, documentation, and code assets for teams shipping product work."
            />
            <HeroSection />
            
            {config?.carouselStack?.length > 0 && (
                <div className="bg-[#f5f5f7]">
                    <CarouselStack items={config.carouselStack} />
                </div>
            )}

            <FeaturedHeader />
            {isLoading ? (
                <LoadingSkeleton count={3} />
            ) : error ? (
                <div className="w-full bg-[#F5F5F7] px-6 pb-20">
                    <div className="max-w-[1400px] mx-auto rounded-3xl border border-red-100 bg-red-50 px-6 py-8 text-red-600">
                        Failed to load featured products. Please try again in a moment.
                    </div>
                </div>
            ) : (
                <TemplateGrid items={featuredProducts} limit={3} />
            )}
            <ProBanner />
            <BrowseTemplatesCTA />
            <FAQSection />
            <ResponsiveShowcase products={featuredProducts} />
        </>
    );
};

export default Home;
