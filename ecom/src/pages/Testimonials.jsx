import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TestimonialsGrid from '../components/TestimonialsGrid';
import BuildSitesHeader from '../components/BuildSitesHeader';
import TestimonialForm from '../components/common/TestimonialForm';
import ConfigContext from '../context/ConfigContext';

const Testimonials = () => {
    const { config } = useContext(ConfigContext);
    const navigate = useNavigate();

    // Feature Enforcement
    useEffect(() => {
        if (config && config.features && config.features.testimonials === false) {
            navigate('/');
        }
    }, [config, navigate]);
    return (
        <div className="bg-[#F5F5F7]">
            <BuildSitesHeader
                title="Loved by thousands of"
                highlight="users"
                description="See what others are saying about our templates."
            />
            <TestimonialsGrid />
            <div className="max-w-[1400px] mx-auto pb-20 px-6">
                <TestimonialForm />
            </div>
        </div>
    );
};

export default Testimonials;
