import React from 'react';
import TestimonialsGrid from '../components/TestimonialsGrid';
import BuildSitesHeader from '../components/BuildSitesHeader';

const Testimonials = () => {
    return (
        <>
            <BuildSitesHeader
                title="Loved by thousands of"
                highlight="users"
                description="See what others are saying about our templates."
            />
            <TestimonialsGrid />
        </>
    );
};

export default Testimonials;
