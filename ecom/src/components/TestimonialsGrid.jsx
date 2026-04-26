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
        <section className="ds-page px-4 sm:px-6 py-6 sm:py-8">
            <div className="ds-shell grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                {testimonials.map((item) => (
                    <article key={item.id} className="ds-card p-5 sm:p-6 border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-full border border-slate-100 bg-slate-50 flex-shrink-0">
                                    {item.user?.avatarUrl ? (
                                        <img src={item.user.avatarUrl} alt={item.user?.name || 'Customer'} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs font-black text-slate-400">
                                            {item.user?.name?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{item.user?.name || 'Verified customer'}</p>
                                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase tracking-widest truncate">{item.product?.title || 'BizCode purchase'}</p>
                                </div>
                            </div>
                            <div className="flex gap-0.5 text-amber-400">
                                {[...Array(5)].map((_, index) => (
                                    <svg key={index} className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${index < item.rating ? 'opacity-100' : 'opacity-10'}`} viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                ))}
                            </div>
                        </div>

                        <p className="mt-4 sm:mt-5 text-[13px] sm:text-sm leading-relaxed text-slate-600 font-medium">"{item.content}"</p>

                        <div className="mt-6 border-t border-slate-50 pt-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-300">
                            {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default TestimonialsGrid;
