import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import ConfigContext from '../context/ConfigContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
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

const SubscriptionCheckout = () => {
    const { config } = useContext(ConfigContext);
    const { user } = useContext(AuthContext);
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(location.state?.plan || null);

    useEffect(() => {
        if (!user) {
            navigate('/login?redirect=subscription-checkout', { state: { plan } });
            return;
        }
        
        // If no plan in state, try to find the Pro plan from the config
        if (!plan) {
            const pro = config?.memberPlans?.find(p => p.isPrimary || p.name.toLowerCase().includes('pro'));
            if (pro) {
                setPlan(pro);
            } else {
                toastError('No subscription plan selected');
                navigate('/pricing');
            }
        }
    }, [user, plan, config, navigate, toastError]);

    const handlePayment = async () => {
        setLoading(true);
        const scriptLoaded = await loadRazorpayScript();
        
        if (!scriptLoaded) {
            toastError('Razorpay SDK failed to load');
            setLoading(false);
            return;
        }

        try {
            // We find the 'pro-membership' product in the DB for the payment
            // In a real app, you'd match the plan Name to a product ID
            const res = await api.get('/products');
            const proProduct = res.find(p => p.slug === 'pro-membership');

            if (!proProduct) {
                throw new Error('Subscription product not found in marketplace');
            }

            const orderRes = await api.post('/payments/create-order', {
                items: [{ productId: proProduct.id, quantity: 1 }]
            });

            const { orderId, amount, currency, keyId } = orderRes;

            const options = {
                key: keyId,
                amount,
                currency,
                name: "DigitalStudio Pro",
                description: `Upgrade to ${plan.name} Membership`,
                order_id: orderId,
                prefill: {
                    name: user.name,
                    email: user.email,
                },
                theme: { color: "#F59E0B" }, // Gold Theme for Pro
                handler: async function (response) {
                    try {
                        await api.post('/payments/verify', {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });
                        success('Welcome to Pro Elite! 💎');
                        navigate('/profile');
                    } catch (err) {
                        toastError('Verification failed but payment was made. Contact support.');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            toastError(err.message || 'Failed to initiate subscription');
        } finally {
            setLoading(false);
        }
    };

    if (!plan) return null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pt-32 pb-20 px-6 font-sans selection:bg-amber-100 italic:selection:bg-amber-200">
            <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                    
                    {/* Visual/Social Proof Side */}
                    <div className="lg:col-span-7 space-y-12">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-xs shadow-lg shadow-amber-500/20 text-white">💎</span>
                                <span className="text-amber-600 font-bold uppercase text-[10px] tracking-[0.4em] block">Secure Intelligence Upgrade</span>
                            </div>
                            <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.95] mb-8">
                                Refine your <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700">Production.</span>
                            </h1>
                            <p className="text-slate-500 text-xl font-medium leading-relaxed max-w-xl">
                                You're one step away from joining our exclusive circle of high-performance engineers. 
                                Unlock every document, every template, and every AI recommendation instantly.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {(plan.features || []).slice(0, 4).map((feature, i) => (
                                <div key={i} className="flex items-start gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                                        <span className="text-amber-600 text-sm">✓</span>
                                    </div>
                                    <div>
                                        <p className="text-slate-900 font-bold text-sm leading-tight">{feature}</p>
                                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1">Included</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-10 border-t border-slate-200">
                             <div className="flex items-center gap-6">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-12 h-12 rounded-full border-4 border-[#F8FAFC] bg-slate-200 overflow-hidden shadow-sm">
                                            <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <p className="text-slate-900 font-black text-sm tracking-tight">Trusted by 12,000+ Scalers</p>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Join the elite development community</p>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Checkout Card */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-[4rem] p-12 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] border border-slate-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-50/50 rounded-bl-full translate-x-12 -translate-y-12 transition-transform group-hover:scale-110"></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{plan.name}</h2>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                            Priority Access Tier
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6 mb-12 py-8 border-y border-slate-50">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subscription Period</span>
                                        <span className="text-slate-900 font-black uppercase text-xs tracking-widest">{plan.period}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-slate-900 font-black text-xs uppercase tracking-tighter">Total Due Today</p>
                                            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">Automatic Billing cycle</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-5xl font-black text-slate-900 tracking-tighter">{formatCurrency(plan.price)}</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={loading}
                                    className="w-full py-7 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[12px] tracking-[0.25em] shadow-2xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:grayscale"
                                >
                                    {loading ? 'Processing...' : 'Activate Lifetime Pro'}
                                    {!loading && <span className="text-xl">⚡</span>}
                                </button>

                                <div className="mt-10 flex flex-col items-center gap-4">
                                    <div className="flex items-center gap-4 grayscale opacity-40">
                                        <img src="https://img.icons8.com/color/48/000000/visa.png" className="h-6 object-contain" alt="Visa" />
                                        <img src="https://img.icons8.com/color/48/000000/mastercard.png" className="h-6 object-contain" alt="Mastercard" />
                                        <img src="https://img.icons8.com/color/48/000000/razorpay.png" className="h-6 object-contain" alt="Razorpay" />
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[9px] tracking-widest">
                                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm3 12H9v-2h6v2zm0-4H9V8h6v2z" />
                                        </svg>
                                        256-Bit SSL Secure Payment
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SubscriptionCheckout;
