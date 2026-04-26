import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TestimonialsGrid from '../components/TestimonialsGrid';
import BuildSitesHeader from '../components/BuildSitesHeader';
import TestimonialForm from '../components/common/TestimonialForm';
import ConfigContext from '../context/ConfigContext';

const Testimonials = () => {
    const { config } = useContext(ConfigContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (config && config.features && config.features.testimonials === false) {
            navigate('/');
        }
    }, [config, navigate]);

    return (
        <div className="ds-page">
            <BuildSitesHeader
                title="Customer"
                highlight="feedback"
                description="Read recent reviews from customers and share your own feedback after purchase."
            />
            <TestimonialsGrid />
            <section className="px-4 sm:px-6 pb-16">
                <div className="ds-shell">
                    <div className="ds-panel p-6 sm:p-10 border-slate-100 shadow-2xl shadow-slate-100/50">
                        <div className="space-y-2">
                            <p className="ds-eyebrow">Review</p>
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">Share your purchase experience</h2>
                            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 font-medium">
                                Reviews are tied to a purchased product so other customers can trust the feedback they see.
                            </p>
                        </div>
                        <div className="mt-8">
                            <TestimonialForm />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Testimonials;
