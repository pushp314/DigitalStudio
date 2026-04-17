import React, { useCallback, useContext, useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import productService from '../services/productService';

const ProductReviews = ({ productId }) => {
    const { user } = useContext(AuthContext);
    const { success, error } = useToast();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const fetchReviews = useCallback(async () => {
        try {
            const data = await productService.getReviews(productId);
            setReviews(Array.isArray(data) ? data : []);
        } catch (err) {
            error(err.message || 'Failed to load reviews');
        } finally {
            setLoading(false);
        }
    }, [error, productId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);

        try {
            await productService.createReview(productId, { rating, comment });
            setComment('');
            setRating(5);
            success('Review added successfully');
            fetchReviews();
        } catch (err) {
            error(err.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="w-full bg-[#F5F5F7] px-6 pb-20 font-sans">
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6 gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-black">Reviews</h2>
                            <p className="text-gray-500 mt-2">What buyers are saying about this product.</p>
                        </div>
                        <div className="text-sm font-bold text-gray-500">
                            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-gray-500">Loading reviews...</p>
                    ) : reviews.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-500">
                            No reviews yet. Be the first to share feedback.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="rounded-2xl border border-gray-100 p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-black">{review.user?.name || 'Verified buyer'}</h3>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}
                                            </p>
                                        </div>
                                        <div className="text-[#0055FF] font-bold">{'★'.repeat(review.rating)}</div>
                                    </div>
                                    {review.comment && (
                                        <p className="text-gray-600 leading-relaxed mt-4">{review.comment}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm h-fit">
                    <h3 className="text-xl font-black text-black mb-2">Leave a review</h3>
                    <p className="text-gray-500 text-sm mb-6">Share a quick rating and note for other buyers.</p>

                    {!user ? (
                        <div className="rounded-2xl bg-gray-50 p-5 text-sm text-gray-600">
                            Sign in to leave a review after purchase.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Rating</label>
                                <select
                                    value={rating}
                                    onChange={(event) => setRating(Number(event.target.value))}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-[#0055FF] focus:ring-2 focus:ring-[#0055FF]/10"
                                >
                                    {[5, 4, 3, 2, 1].map((value) => (
                                        <option key={value} value={value}>
                                            {value} star{value > 1 ? 's' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Comment</label>
                                <textarea
                                    value={comment}
                                    onChange={(event) => setComment(event.target.value)}
                                    rows={5}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-[#0055FF] focus:ring-2 focus:ring-[#0055FF]/10"
                                    placeholder="What worked well? Any setup notes for other buyers?"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-[#0055FF] text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ProductReviews;
