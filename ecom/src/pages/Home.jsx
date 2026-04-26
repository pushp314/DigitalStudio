import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import { absoluteUrl, faqSchema, organizationSchema, websiteSchema } from '../utils/seo';
import { CATEGORY_ROUTES } from '../data/seoContent';

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
    const homepageFaqs = Array.isArray(config?.faqs) ? config.faqs : [];

    return (
        <>
            <Meta 
                title="SaaS Templates, Dashboards & Fullstack Projects"
                description="Buy SaaS templates, dashboards, fullstack projects, website kits, and ready-made apps. Hire developers or request custom builds."
                canonical={absoluteUrl('/')}
                jsonLd={[organizationSchema(), websiteSchema(), ...(homepageFaqs.length ? [faqSchema(homepageFaqs)] : [])]}
            />
            <HeroSection />

            <section className="ds-page px-6 pb-12">
                <div className="ds-shell">
                    <div className="grid gap-4 md:grid-cols-5">
                        {CATEGORY_ROUTES.map((category) => (
                            <Link key={category.slug} to={`/assets/${category.slug}`} className="ds-card p-5 hover:border-slate-300">
                                <h2 className="text-base font-semibold tracking-tight text-slate-900">{category.title}</h2>
                                <p className="mt-2 text-xs leading-5 text-slate-500">{category.metaDescription}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
            
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
