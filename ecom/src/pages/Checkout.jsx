import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfigContext from '../context/ConfigContext';
import { formatCurrency } from '../utils/normalizers';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const Checkout = () => {
    const { config } = useContext(ConfigContext);
    const { cartItems, clearCart } = useContext(CartContext);
    const { user, refreshPurchases } = useContext(AuthContext);
    const { success, error } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [loading, setLoading] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);
    const [addDeployment, setAddDeployment] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login?redirect=checkout');
        }
        if (cartItems.length === 0) {
            navigate('/cart');
        }
        if (config && config.features && config.features.payments === false) {
            error('Payments are currently unavailable.');
            navigate('/cart');
        }
    }, [cartItems, config, error, navigate, user]);

    // Track checkout session for abandoned cart recovery
    useEffect(() => {
        if (!user || cartItems.length === 0) return;
        const trackSession = async () => {
            try {
                await api.post('/checkout/track', {
                    email: user.email,
                    cartItems: cartItems.map(i => ({ id: i.id, title: i.title, price: i.price })),
                    cartTotal: cartItems.reduce((s, i) => s + Number(i.price || 0), 0),
                    whiteGloveSelected: addDeployment,
                    deploymentFee: addDeployment ? (config?.eliteSettings?.deploymentFee || 149) : 0,
                    couponCode,
                });
            } catch { /* silently fail */ }
        };
        trackSession();
    }, [user, cartItems.length, addDeployment]); // eslint-disable-line

    const deploymentFee = config?.eliteSettings?.deploymentFee || 149;
    const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
    const total = Math.max(0, subtotal - discountAmount + (addDeployment ? deploymentFee : 0));

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setValidatingCoupon(true);
        try {
            const response = await api.get(`/marketing/validate?code=${couponCode}&totalAmount=${subtotal}&scope=template`);
            setAppliedCoupon(response);
            success(`Coupon ${response.code} applied.`);
        } catch (err) {
            error(err.message || 'Invalid or expired coupon code.');
            setAppliedCoupon(null);
        } finally {
            setValidatingCoupon(false);
        }
    };

    const submitHandler = async () => {
        setLoading(true);

        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
            error('Unable to load the payment form.');
            setLoading(false);
            return;
        }

        const items = cartItems.map((item) => ({
            productId: Number(item.id),
            quantity: 1,
        }));

        try {
            const order = await api.post('/payments/create-order', {
                items,
                couponCode: appliedCoupon?.code,
                addDeploymentService: addDeployment,
            });

            const options = {
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                name: 'BizCode',
                description: 'Ready product purchase',
                order_id: order.orderId,
                prefill: {
                    name: user.name || 'Customer',
                    email: user.email,
                },
                theme: { color: '#0f172a' },
                handler: async (response) => {
                    try {
                        const verification = await api.post('/payments/verify', {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });

                        if (verification.paymentStatus === 'paid' || verification.status === 'captured' || verification.entitled) {
                            success('Payment verified. Your product is available in your account.');
                            clearCart();
                            if (refreshPurchases) await refreshPurchases();
                            queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });
                            queryClient.invalidateQueries({ queryKey: ['licenses', 'my'] });
                            navigate('/account');
                        }
                    } catch (err) {
                        error(err.message || 'Payment verification failed.');
                    }
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', () => {
                error('Payment was not completed.');
            });
            razorpay.open();
        } catch (err) {
            error(err.message || 'Unable to initialize payment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ds-page px-6 pb-16 pt-16">
            <div className="ds-shell grid gap-6 lg:grid-cols-[minmax(0,1fr),360px]">
                <section className="space-y-6">
                    <div className="space-y-2">
                        <p className="ds-eyebrow">Checkout</p>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Review your order</h1>
                        <p className="text-sm leading-6 text-slate-600">Verified payment unlocks your products, licenses, and eligible support access.</p>
                    </div>

                    <div className="space-y-4">
                        {cartItems.map((item) => (
                            <article key={item.id} className="ds-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                                <div className="h-24 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:w-28">
                                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">{item.title}</h2>
                                    <p className="text-sm text-slate-600">{item.category}</p>
                                </div>
                                <span className="text-lg font-semibold text-slate-900">{item.formattedPrice}</span>
                            </article>
                        ))}
                    </div>

                    <div className="ds-card p-6">
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Coupon code</h2>
                        <div className="mt-4 flex flex-col gap-3 md:flex-row">
                            <input
                                type="text"
                                value={couponCode}
                                onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                                placeholder="Enter a coupon code"
                                className="ds-input"
                            />
                            <button
                                type="button"
                                onClick={handleApplyCoupon}
                                disabled={validatingCoupon || !couponCode}
                                className="ds-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {validatingCoupon ? 'Checking...' : 'Apply'}
                            </button>
                        </div>
                        {appliedCoupon && (
                            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                {appliedCoupon.code} applied.
                            </div>
                        )}
                    </div>

                    <div className={`ds-card p-8 transition-all duration-500 border-2 ${addDeployment ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-200'}`}>
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className={`p-4 rounded-2xl border transition-colors duration-500 ${addDeployment ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white border-slate-200 text-indigo-600'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4-4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-bold tracking-tight text-slate-900">White-glove Setup & Deployment</h3>
                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-md">Highly Recommended</span>
                                </div>
                                <p className="text-sm leading-6 text-slate-600 font-medium">
                                    Don't waste hours on environment variables and SSL configs. Our team will handle the full deployment, database setup, and production optimization for you.
                                </p>
                                <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black text-slate-900">{formatCurrency(deploymentFee)}</span>
                                        <span className="text-xs font-bold text-slate-400 line-through">{formatCurrency(deploymentFee + 100)}</span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setAddDeployment(!addDeployment)}
                                        className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all transform active:scale-95 shadow-md ${
                                            addDeployment 
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' 
                                            : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        {addDeployment ? '✓ Added to order' : '+ Add to order'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <aside className="ds-card h-fit p-6">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">Summary</h2>
                    <div className="mt-6 space-y-4 text-sm text-slate-600">
                        <div className="flex items-center justify-between">
                            <span>Subtotal</span>
                            <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
                        </div>
                        {appliedCoupon && (
                            <div className="flex items-center justify-between">
                                <span>Discount</span>
                                <span className="font-medium text-emerald-700">- {formatCurrency(discountAmount)}</span>
                            </div>
                        )}
                        {addDeployment && (
                            <div className="flex items-center justify-between animate-in fade-in slide-in-from-right-2">
                                <span>Deployment Service</span>
                                <span className="font-medium text-indigo-600">+ {formatCurrency(deploymentFee)}</span>
                            </div>
                        )}
                    </div>
                    <div className="mt-6 border-t border-slate-200 pt-4">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-700">Total</span>
                            <span className="text-xl font-semibold text-slate-900">{formatCurrency(total)}</span>
                        </div>
                    </div>
                    <button type="button" onClick={submitHandler} disabled={loading} className="ds-button-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50">
                        {loading ? 'Preparing payment...' : 'Pay securely'}
                    </button>
                    <p className="mt-4 text-sm text-slate-500">Payments are processed securely through Razorpay. Downloads are delivered through your BizCode account.</p>
                </aside>
            </div>
        </div>
    );
};

export default Checkout;
