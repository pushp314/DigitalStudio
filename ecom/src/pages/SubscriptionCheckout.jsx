import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ConfigContext from '../context/ConfigContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, normalizeProduct } from '../utils/normalizers';
import { Tag, Ticket, X, Loader2, Zap, ShieldCheck } from 'lucide-react';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const SubscriptionCheckout = () => {
    const { config } = useContext(ConfigContext);
    const { user, refreshUser } = useContext(AuthContext);
    const { success, error: toastError, info } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(location.state?.plan || null);
    
    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);

    const fallbackPlan = useMemo(
        () => config?.memberPlans?.find((item) => item.isPrimary || item.name?.toLowerCase().includes('pro')) || null,
        [config?.memberPlans],
    );

    const resolvedPlan = useMemo(() => {
        const source = selectedPlan || fallbackPlan;
        if (!source) return null;

        return {
            name: source.name || source.title || fallbackPlan?.name || 'Membership',
            period: source.period || fallbackPlan?.period || 'month',
            price: Number(source.price ?? fallbackPlan?.price ?? 0),
            features: Array.isArray(source.features) && source.features.length > 0
                ? source.features
                : Array.isArray(fallbackPlan?.features)
                    ? fallbackPlan.features
                    : [],
        };
    }, [fallbackPlan, selectedPlan]);

    useEffect(() => {
        if (!user) {
            navigate('/login?redirect=subscription-checkout', { state: { plan: selectedPlan } });
            return;
        }
        if (!selectedPlan && fallbackPlan) {
            setSelectedPlan(fallbackPlan);
            return;
        }
        if (!selectedPlan && !fallbackPlan) {
            toastError('No membership plan is available right now.');
            navigate('/pricing');
        }
    }, [fallbackPlan, navigate, selectedPlan, toastError, user]);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsValidating(true);
        try {
            const data = await api.get(`/marketing/validate?code=${couponCode}&totalAmount=${resolvedPlan.price}&scope=membership`);
            setAppliedCoupon(data);
            setDiscountAmount(data.discount);
            success(`Promo code applied: ${couponCode}.`);
        } catch (err) {
            toastError(err.response?.data?.error || "Invalid or expired promo code.");
            setAppliedCoupon(null);
            setDiscountAmount(0);
        } finally {
            setIsValidating(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponCode('');
        info("Promo code removed.");
    };

    const finalPrice = Math.max(0, (resolvedPlan?.price || 0) - discountAmount);

    const handlePayment = async () => {
        if (!resolvedPlan) return;

        setLoading(true);
        const scriptLoaded = await loadRazorpayScript();

        if (!scriptLoaded) {
            toastError('Unable to load the payment form.');
            setLoading(false);
            return;
        }

        try {
            // Fetch products with the specific slug to be more reliable
            const products = await api.get('/products?keyword=pro-membership');
            const membershipProduct = (Array.isArray(products) ? products.map(normalizeProduct) : []).find(
                (product) => product.slug === 'pro-membership' || (product.productType === 'subscription' && product.slug.includes('pro'))
            );

            if (!membershipProduct) {
                // Fallback attempt to get all and find
                const allProducts = await api.get('/products');
                const fallbackProduct = (Array.isArray(allProducts) ? allProducts.map(normalizeProduct) : []).find(
                    (p) => p.slug === 'pro-membership' || p.productType === 'subscription'
                );
                
                if (!fallbackProduct) {
                    throw new Error('Pro Membership product is not available right now.');
                }
                return await proceedWithOrder(fallbackProduct);
            }
            
            return await proceedWithOrder(membershipProduct);
        } catch (err) {
            toastError(err.message || 'Unable to start membership checkout.');
        } finally {
            setLoading(false);
        }
    };

    const proceedWithOrder = async (membershipProduct) => {
        try {
            const order = await api.post('/payments/create-order', {
                items: [{ productId: membershipProduct.id, quantity: 1 }],
                couponCode: appliedCoupon?.code || ""
            });

            const options = {
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                name: 'DigitalStudio Membership',
                description: `Membership payment for ${resolvedPlan.name}`,
                order_id: order.orderId,
                prefill: {
                    name: user.name,
                    email: user.email,
                },
                theme: { color: '#0f172a' },
                handler: async (response) => {
                    try {
                        await api.post('/payments/verify', {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });
                        if (refreshUser) await refreshUser();
                        success('Membership activated.');
                        navigate('/account');
                    } catch (_err) {
                        toastError('Payment was received, but verification did not finish. Please contact support.');
                    }
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (err) {
            toastError(err.message || 'Unable to start membership checkout.');
        } finally {
            setLoading(false);
        }
    };

    if (!resolvedPlan) return null;

    return (
        <div className="ds-page min-h-screen pt-28 pb-16 px-6">
            <div className="max-w-5xl mx-auto grid gap-10 lg:grid-cols-[1fr,380px]">
                
                {/* Left: Plan Details */}
                <section className="space-y-8 animate-in fade-in duration-700">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                            <Zap size={10} fill="currentColor" className="text-amber-400" /> Secure Checkout
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
                            Finalize your <span className="text-slate-500">Membership.</span>
                        </h1>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-xl font-medium">
                            Activate Pro benefits for premium guides, priority help, community chat, and smoother setup support.
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{resolvedPlan.name}</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Membership access</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(resolvedPlan.price)}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">per {resolvedPlan.period}</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                            {resolvedPlan.features.map((feature) => (
                                <div key={feature} className="flex items-start gap-3">
                                    <ShieldCheck size={16} className="text-slate-900 shrink-0 mt-0.5" />
                                    <span className="text-[12px] font-bold text-slate-600 leading-tight">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Right: Order Summary & Coupon */}
                <aside className="space-y-6">
                    <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-2xl shadow-slate-200/50 sticky top-32">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Order Summary</h3>
                        
                        <div className="space-y-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                                <span className="text-slate-900 font-black tracking-tight">{formatCurrency(resolvedPlan.price)}</span>
                            </div>

                            {/* Discount Input */}
                            {!appliedCoupon ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        <Ticket size={12} /> Have a promo code?
                                    </div>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            placeholder="CODE"
                                            className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black tracking-widest transition-all focus:border-slate-900 outline-none"
                                        />
                                        <button 
                                            onClick={handleApplyCoupon}
                                            disabled={isValidating || !couponCode.trim()}
                                            className="px-4 py-2.5 bg-slate-100 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-30"
                                        >
                                            {isValidating ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-emerald-600 text-white rounded-lg flex items-center justify-center">
                                            <Tag size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">{appliedCoupon.code}</p>
                                            <p className="text-[10px] text-emerald-600 font-medium">-{formatCurrency(discountAmount)} applied</p>
                                        </div>
                                    </div>
                                    <button onClick={removeCoupon} className="p-2 hover:bg-emerald-100 rounded-md text-emerald-900 transition-all">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            <div className="h-px bg-slate-100" />
                            
                            <div className="flex justify-between items-end">
                                <span className="text-slate-900 font-black uppercase tracking-widest text-[10px]">Total due today</span>
                                <span className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(finalPrice)}</span>
                            </div>

                            <button 
                                type="button" 
                                onClick={handlePayment} 
                                disabled={loading}
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Preparing payment...' : 'Finalize payment'}
                            </button>
                            
                            <div className="flex flex-col items-center gap-4 pt-4">
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest text-center">
                                    Payments processed securely via Razorpay
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default SubscriptionCheckout;
