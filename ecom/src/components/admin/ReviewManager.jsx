import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import reviewService from '../../services/reviewService';
import { useToast } from '../../context/ToastContext';
import { 
    Star, 
    CheckCircle2, 
    XCircle, 
    Trash2, 
    MessageSquare,
    User,
    Package,
    AlertCircle
} from 'lucide-react';

const ReviewManager = () => {
    const [statusFilter, setStatusFilter] = useState('all');
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();

    const { data: reviews, isLoading } = useQuery({
        queryKey: ['admin-reviews', statusFilter],
        queryFn: () => reviewService.adminList(statusFilter === 'all' ? '' : statusFilter),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => reviewService.adminUpdate(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
            success('Review status updated.');
        },
        onError: () => toastError('Failed to update review status.'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => reviewService.adminDelete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
            success('Review deleted permanently.');
        },
        onError: () => toastError('Failed to delete review.'),
    });

    const getStatusStyles = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'hidden': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    if (isLoading) return (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Feedback...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-xl border border-slate-200">
                <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight mb-1">Reviews</h2>
                    <p className="text-xs text-slate-500">Moderate customer reviews and verified purchase feedback.</p>
                </div>
                <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                    {['all', 'pending', 'approved', 'hidden'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                                statusFilter === status ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-6">
                {(reviews || []).map((review) => (
                    <div key={review.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all group relative">
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* User & Product Context */}
                            <div className="lg:w-64 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                        <User size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">{review.user?.name}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{review.user?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <Package size={14} className="text-slate-400" />
                                    <p className="text-[10px] font-bold text-slate-600 truncate">{review.product?.title}</p>
                                </div>
                                <div className={`inline-flex px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusStyles(review.status)}`}>
                                    {review.status}
                                </div>
                            </div>

                            {/* Review Content */}
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-1 text-amber-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} className={i < review.rating ? '' : 'text-slate-200'} />
                                    ))}
                                    <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {review.rating}.0 Rating
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    "{review.comment || 'No comment provided.'}"
                                </p>
                                <div className="flex items-center gap-4 pt-2">
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        Submitted on {new Date(review.createdAt).toLocaleDateString()}
                                    </p>
                                    {review.verifiedPurchase && (
                                        <div className="flex items-center gap-1 text-emerald-600">
                                            <CheckCircle2 size={12} />
                                            <span className="text-[9px] font-bold uppercase tracking-widest">Verified Purchase</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="lg:w-32 flex lg:flex-col gap-2 justify-end lg:justify-start pt-4 lg:pt-0">
                                {review.status !== 'approved' && (
                                    <button 
                                        onClick={() => updateMutation.mutate({ id: review.id, data: { status: 'approved' } })}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
                                    >
                                        <CheckCircle2 size={12} /> Approve
                                    </button>
                                )}
                                {review.status !== 'hidden' && (
                                    <button 
                                        onClick={() => updateMutation.mutate({ id: review.id, data: { status: 'hidden' } })}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                                    >
                                        <XCircle size={12} /> Hide
                                    </button>
                                )}
                                <button 
                                    onClick={() => {
                                        if(window.confirm('Permanently delete this review?')) {
                                            deleteMutation.mutate(review.id);
                                        }
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-slate-200"
                                >
                                    <Trash2 size={12} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {(reviews || []).length === 0 && (
                    <div className="py-20 text-center bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
                        <MessageSquare size={32} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-sm font-bold text-slate-900">No reviews found</h3>
                        <p className="text-xs text-slate-400 mt-1">Feedback will appear here once submitted by customers.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewManager;
