import React from 'react';
import testimonialService from '../services/testimonialService';

const TestimonialsGrid = () => {
    const [testimonials, setTestimonials] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const data = await testimonialService.getApproved();
                setTestimonials(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to fetch testimonials:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTestimonials();
    }, []);

    if (loading) {
        return (
            <section className="ds-page px-6 py-16">
                <div className="ds-shell flex justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                </div>
            </section>
        );
    }

    if (testimonials.length === 0) {
        return null;
    }

    return (
        <section className="ds-page px-6 py-8">
            <div className="ds-shell grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {testimonials.map((item) => (
                    <article key={item.id} className="ds-card p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                                    {item.user?.avatarUrl ? (
                                        <img src={item.user.avatarUrl} alt={item.user?.name || 'Customer'} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-600">
                                            {item.user?.name?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{item.user?.name || 'Verified customer'}</p>
                                    <p className="text-sm text-slate-500">{item.product?.title || 'DigitalStudio purchase'}</p>
                                </div>
                            </div>
                            <div className="flex gap-1 text-amber-500">
                                {[...Array(5)].map((_, index) => (
                                    <svg key={index} className={`h-4 w-4 ${index < item.rating ? 'opacity-100' : 'opacity-20'}`} viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                ))}
                            </div>
                        </div>

                        <p className="mt-5 text-sm leading-7 text-slate-600">"{item.content}"</p>

                        <div className="mt-6 border-t border-slate-200 pt-4 text-sm text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default TestimonialsGrid;
