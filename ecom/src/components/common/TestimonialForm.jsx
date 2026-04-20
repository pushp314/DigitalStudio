import React, { useEffect, useMemo, useState, useContext } from 'react';
import testimonialService from '../../services/testimonialService';
import AuthContext from '../../context/AuthContext';
import orderService from '../../services/orderService';
import { useToast } from '../../context/ToastContext';
import { normalizeOrder } from '../../utils/normalizers';
import { Star, Send } from 'lucide-react';

const TestimonialForm = ({ onSuccess, productId = null }) => {
    const { user } = useContext(AuthContext);
    const { success, error: toastError } = useToast();
    const [content, setContent] = useState('');
    const [rating, setRating] = useState(5);
    const [submitting, setSubmitting] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState(productId ? String(productId) : '');
    const [purchasedProducts, setPurchasedProducts] = useState([]);

    useEffect(() => {
        setSelectedProductId(productId ? String(productId) : '');
    }, [productId]);

    useEffect(() => {
        if (!user || productId) {
            return;
        }

        const fetchPurchasedProducts = async () => {
            try {
                setLoadingProducts(true);
                const orders = await orderService.getMyOrders();
                const uniqueProducts = new Map();

                (Array.isArray(orders) ? orders : [])
                    .map(normalizeOrder)
                    .filter((order) => order.entitled || order.paymentStatus === 'paid' || order.status === 'paid')
                    .forEach((order) => {
                        order.orderItems.forEach((item) => {
                            if (item.productId && item.title && !uniqueProducts.has(item.productId)) {
                                uniqueProducts.set(item.productId, {
                                    id: item.productId,
                                    title: item.title,
                                });
                            }
                        });
                    });

                setPurchasedProducts(Array.from(uniqueProducts.values()));
            } catch (err) {
                toastError(err.message || 'Unable to load your purchased products.');
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchPurchasedProducts();
    }, [productId, toastError, user]);

    const effectiveProductId = useMemo(() => {
        if (productId) {
            return Number(productId);
        }

        const parsed = Number(selectedProductId);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }, [productId, selectedProductId]);

    if (!user) {
        return (
            <div className="ds-card border-dashed p-8 text-center">
                <p className="mb-4 text-sm text-slate-600">Sign in to share a testimonial for a purchased product.</p>
                <a href="/login" className="ds-button-primary">Sign in</a>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) {
            toastError('Please enter your feedback.');
            return;
        }
        if (!effectiveProductId) {
            toastError('Select a purchased product before submitting your testimonial.');
            return;
        }

        try {
            setSubmitting(true);
            await testimonialService.create({ productId: effectiveProductId, content, rating });
            success('Testimonial submitted. It will appear after approval.');
            setContent('');
            setRating(5);
            if (!productId) {
                setSelectedProductId('');
            }
            if (onSuccess) onSuccess();
        } catch (err) {
            toastError(err.message || 'Failed to submit testimonial.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="ds-card mx-auto my-12 max-w-2xl p-8">
            <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Share your experience</h3>
            <p className="mb-6 mt-2 text-sm text-slate-600">Your feedback helps other customers choose with confidence.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                {!productId && (
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Purchased product</label>
                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            disabled={loadingProducts || purchasedProducts.length === 0}
                            className="ds-input"
                        >
                            <option value="">
                                {loadingProducts ? 'Loading your purchases...' : purchasedProducts.length === 0 ? 'No eligible purchases found' : 'Select a product'}
                            </option>
                            {purchasedProducts.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.title}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Rating</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => setRating(num)}
                                className={`rounded-lg p-2 transition-all ${rating >= num ? 'text-amber-500' : 'text-slate-300'}`}
                            >
                                <Star size={32} fill={rating >= num ? "currentColor" : "none"} />
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Testimonial</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What worked well for you?"
                        className="ds-input min-h-[120px] resize-none p-4"
                    ></textarea>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="ds-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {submitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <Send size={18} />
                            Submit Testimonial
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default TestimonialForm;
