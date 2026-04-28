import React, { useMemo, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import HeroSection from '../components/HeroSection';
import FeaturedHeader from '../components/FeaturedHeader';
import TemplateGrid from '../components/TemplateGrid';
import BrowseTemplatesCTA from '../components/BrowseTemplatesCTA';
import ResponsiveShowcase from '../components/ResponsiveShowcase';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import FAQSection from '../components/FAQSection';
import productService from '../services/productService';
import { normalizeProduct } from '../utils/normalizers';
import Meta from '../components/common/Meta';
import ConfigContext from '../context/ConfigContext';
import { absoluteUrl, faqSchema, organizationSchema, websiteSchema } from '../utils/seo';
import UseCases from '../components/UseCases';
import TrustSection from '../components/TrustSection';

const Home = () => {
    const { config } = useContext(ConfigContext);
    const { data, isLoading, error } = useQuery({
        queryKey: ['products', 'featured-home'],
        queryFn: () => productService.getAll({ featured: true, limit: 6 }),
    });

    const featuredProducts = useMemo(
        () => (Array.isArray(data) ? data.map(normalizeProduct) : []),
        [data],
    );
    const homepageFaqs = Array.isArray(config?.faqs) ? config.faqs : [];

    return (
        <>
            <Meta 
                title="Launch Your SaaS in Days, Not Months | BizCode"
                description="Buy production-ready SaaS templates, dashboards, and APIs. Deploy instantly or customize with expert help."
                canonical={absoluteUrl('/')}
                jsonLd={[organizationSchema(), websiteSchema(), ...(homepageFaqs.length ? [faqSchema(homepageFaqs)] : [])]}
            />
            
            <HeroSection />

            <TrustSection />

            <section className="ds-page py-12 md:py-20">
                <FeaturedHeader />
                <div className="px-4 md:px-6">
                    {isLoading ? (
                        <LoadingSkeleton count={3} />
                    ) : error ? (
                        <div className="ds-shell">
                            <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-8 text-red-600">
                                Failed to load featured products. Please try again in a moment.
                            </div>
                        </div>
                    ) : (
                        <TemplateGrid items={featuredProducts} limit={6} />
                    )}
                </div>
            </section>

            <UseCases />

            <section className="bg-white border-y border-slate-100">
                <FAQSection />
            </section>

            <BrowseTemplatesCTA />
            
            <section className="py-12 md:py-20 bg-slate-900 text-white overflow-hidden">
                <ResponsiveShowcase products={featuredProducts.slice(0, 3)} />
            </section>
        </>
    );
};

export default Home;
