import React from 'react';
import HeroSection from '../components/HeroSection';
import FeaturedHeader from '../components/FeaturedHeader';
import TemplateGrid from '../components/TemplateGrid';
import BrowseTemplatesCTA from '../components/BrowseTemplatesCTA';
import ResponsiveShowcase from '../components/ResponsiveShowcase';

const Home = () => {
    return (
        <>
            <HeroSection />
            <FeaturedHeader />
            <TemplateGrid limit={3} />
            <BrowseTemplatesCTA />
            <ResponsiveShowcase />
        </>
    );
};

export default Home;
