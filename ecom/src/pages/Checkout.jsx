import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const { user } = useContext(AuthContext);
    const { success, error } = useToast();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);

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

    const subtotal = cartItems.reduce((acc, item) => {
        return acc + Number(item.price || 0);
    }, 0);

    const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
    const total = Math.max(0, subtotal - discountAmount);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setValidatingCoupon(true);
        try {
            // Passing subtotal as totalAmount context for validation
            const res = await api.get(`/marketing/validate?code=${couponCode}&totalAmount=${subtotal}`);
            setAppliedCoupon(res);
            success(`Coupon '${res.code}' applied! You saved ${formatCurrency(res.discount)}`);
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
            error("Razorpay SDK failed to load. Are you online?");
            setLoading(false);
            return;
        }

        const items = cartItems.map(item => ({
            productId: Number(item.id),
            quantity: 1,
        }));

        try {
            // Create Order on Backend with Coupon Code if applied
            const res = await api.post('/payments/create-order', { 
                items,
                couponCode: appliedCoupon?.code
            });
            const { orderId, amount, currency, keyId } = res;

            const options = {
                key: keyId,
                amount: amount,
                currency: currency,
                name: "DigitalStudio",
                description: "Digital Template Purchase",
                order_id: orderId,
                prefill: {
                    name: user.name || "Customer",
                    email: user.email,
                },
                theme: { color: "#000000" },
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/payments/verify', {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });
                        if (verifyRes.paymentStatus === 'paid' || verifyRes.status === 'captured' || verifyRes.entitled) {
                            success('Payment verified successfully! 🎉');
                            clearCart();
                            navigate('/profile');
                        }
                    } catch (err) {
                        console.error(err);
                        error(err.message || 'Payment Verification failed.');
                    }
                }
            };
            
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (_response){
                error("Payment processing failed. Try again.");
            });
            
            rzp.open();

        } catch (err) {
            console.error(err);
            error(err.message || 'Failed to initialize payment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] px-6 py-20 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-2">Final Step</p>
                        <h1 className="text-5xl font-black text-black tracking-tight">Checkout Overview</h1>
                    </div>
                    <div className="flex items-center gap-4 text-emerald-500 font-bold text-xs uppercase tracking-widest bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        Secure Checkout Active
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left Column: Review Summary */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-8 flex items-center gap-4">
                                <span className="w-10 h-10 bg-black text-white rounded-2xl flex items-center justify-center text-xs">01</span>
                                Selected Items
                            </h2>
                            <div className="space-y-6">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex items-center gap-6 rounded-3xl border border-gray-50 p-6 bg-gray-50/30 transition-all hover:bg-gray-50">
                                        <div className="w-24 h-24 rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex-shrink-0">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-black text-lg truncate">{item.title}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{item.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-black text-xl">{item.formattedPrice}</p>
                                            <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Lifetime Access</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Coupon Interface */}
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 animate-in slide-in-from-bottom-5 duration-500">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-4">
                                <span className="w-10 h-10 bg-gray-50 text-black border border-gray-100 rounded-2xl flex items-center justify-center text-xs">02</span>
                                Discount Coupon
                            </h2>
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <input 
                                        type="text" 
                                        placeholder="Enter Coupon Code..." 
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-bold text-sm tracking-widest placeholder:text-gray-300 transition-all"
                                    />
                                    {appliedCoupon && <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500 uppercase">Applied ✓</span>}
                                </div>
                                <button 
                                    onClick={handleApplyCoupon}
                                    disabled={validatingCoupon || !couponCode}
                                    className="px-10 py-5 bg-black text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-black/10 hover:bg-gray-800 disabled:opacity-30 disabled:grayscale transition-all"
                                >
                                    {validatingCoupon ? 'Validating...' : 'Apply Code'}
                                </button>
                            </div>
                            {appliedCoupon && (
                                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex justify-between items-center animate-in fade-in duration-300">
                                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Coupon Applied: {appliedCoupon.code}</p>
                                    <button onClick={() => setAppliedCoupon(null)} className="text-[10px] font-black text-emerald-700 hover:text-red-500 transition-colors">REMOVE</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-4">
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 sticky top-24 overflow-hidden relative">
                            {/* Visual Polish */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 rounded-bl-full -translate-y-4 translate-x-4"></div>
                            
                            <h2 className="text-xl font-bold mb-8 relative z-10">Value Summary</h2>
                            
                            <div className="space-y-6 mb-10 border-b border-gray-50 pb-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subtotal</span>
                                    <span className="font-bold text-black">{formatCurrency(subtotal)}</span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between items-center animate-in slide-in-from-right-4 duration-300">
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Discount</span>
                                        <span className="font-bold text-emerald-500">- {formatCurrency(discountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                                    <span className="text-sm font-black text-black uppercase tracking-tighter">Final Total</span>
                                    <span className="text-3xl font-black text-black tracking-tighter">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <button
                                onClick={submitHandler}
                                disabled={loading}
                                className={`w-full bg-black text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed grayscale' : ''}`}
                            >
                                {loading ? 'Processing...' : 'Confirm Payment'}
                                {!loading && <span className="text-lg">→</span>}
                            </button>
                            
                            <div className="mt-8 space-y-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">End-to-End Encrypted</span>
                                </div>
                                <p className="text-[9px] text-gray-400 text-center leading-relaxed">
                                    By proceeding, you agree to the license terms. Downloads are instantly unlocked upon payment.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Checkout;
