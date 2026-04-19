import React, { useState, useEffect } from 'react';
import testimonialService from '../../services/testimonialService';

const TestimonialManager = () => {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            const data = await testimonialService.adminList();
            setTestimonials(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await testimonialService.approve(id);
            setTestimonials(testimonials.map(t => t.id === id ? { ...t, status: 'approved' } : t));
        } catch (err) {
            console.error(err);
        }
    };

    const handleReject = async (id) => {
        try {
            await testimonialService.reject(id);
            setTestimonials(testimonials.map(t => t.id === id ? { ...t, status: 'rejected' } : t));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanently remove this testimonial?")) return;
        try {
            await testimonialService.delete(id);
            setTestimonials(testimonials.filter(t => t.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'rejected': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-amber-50 text-amber-700 border-amber-100';
        }
    };

    if (loading) return (
         <div className="bg-white border border-gray-100 rounded-[2.5rem] p-20 text-center animate-pulse">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Retrieving Social Proof...</p>
        </div>
    );
    
    if (error) return (
         <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-12 text-red-500">
            <h3 className="text-xs font-bold uppercase tracking-widest">Sync Error</h3>
            <p className="text-sm font-medium">{error}</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-black tracking-tight leading-none">Testimonial List</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{testimonials.length} reviews in queue</p>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <th className="px-10 py-6">Customer Context</th>
                                <th className="px-10 py-6">Message Content</th>
                                <th className="px-10 py-6 text-center">Verification</th>
                                <th className="px-10 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {testimonials.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50/50 transition-all group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-100 overflow-hidden flex items-center justify-center font-bold text-gray-400 uppercase text-xs">
                                                {t.user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-black text-sm truncate">{t.user?.name || 'Anonymous'}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t.user?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <p className="text-sm text-gray-500 font-medium line-clamp-2 max-w-sm leading-relaxed">{t.content}</p>
                                        <div className="flex text-amber-400 text-xs mt-2">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={i < t.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${getStatusStyles(t.status)}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {t.status !== 'approved' && (
                                                <button onClick={() => handleApprove(t.id)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all border border-emerald-50" title="Approve">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                </button>
                                            )}
                                            {t.status !== 'rejected' && (
                                                <button onClick={() => handleReject(t.id)} className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all border border-amber-50" title="Reject">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(t.id)} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-gray-100" title="Delete">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TestimonialManager;
