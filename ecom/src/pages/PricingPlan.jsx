import React, { useContext, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import AuthContext from '../context/AuthContext';
import ConfigContext from '../context/ConfigContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, normalizeProduct } from '../utils/normalizers';
import { ShieldCheck, Zap, Star, Sparkles, Heart, Rocket, Target, Crown } from 'lucide-react';

const PricingPlan = () => {
    const { config } = useContext(ConfigContext);
    const { user } = useContext(AuthContext);
    const { addToCart, clearCart } = useCart();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        if (config && config.features && config.features.subscriptions === false) {
            navigate('/');
        }
    }, [config, navigate]);

    const { data: rawProducts = [] } = useQuery({
        queryKey: ['products', 'subscription'],
        queryFn: () => productService.getAll({ productType: 'subscription' }),
    });

    const products = useMemo(() => (Array.isArray(rawProducts) ? rawProducts.map(normalizeProduct) : []), [rawProducts]);
    const proPlanProduct = products.find((product) => product.slug === 'pro-membership');
    const elitePlanProduct = products.find((product) => product.slug === 'institutional-membership');

    const plans = [
        {
            name: 'Free Plan',
            badge: 'Community Access',
            originalPrice: 0,
            price: 0,
            period: 'forever',
            features: [
                'Public Template Library',
                'Community Discussion Access',
                'Standard Email Support',
                'Limited 2-msg/day Chat'
            ],
            buttonText: 'Get Started for Free',
            isPrimary: false,
            marketingBadge: null,
            product: null,
            key: 'free'
        },
        {
            name: 'Pro Plan',
            badge: 'Most Popular',
            originalPrice: (proPlanProduct?.price || 29) + 20, 
            price: proPlanProduct?.price || 29,
            period: 'month',
            features: proPlanProduct?.features?.length > 0 ? proPlanProduct.features : [
                'Unlimited 1-1 Priority Support (FREE)',
                'Priority Template Negotiations',
                'Full Commercial Use License',
                'Unlimited Community Chat Access',
                'Image & File Transmission',
                'Exclusive SaaS Components'
            ],
            buttonText: 'Upgrade to Pro',
            isPrimary: true,
            marketingBadge: '⚡ Early Bird Offer',
            icon: <Crown className="text-amber-400" size={24} fill="currentColor" />,
            product: proPlanProduct,
            key: 'pro'
        },
        {
            name: 'Enterprise Plan',
            badge: 'For Teams',
            originalPrice: (elitePlanProduct?.price || 59) + 40,
            price: elitePlanProduct?.price || 59,
            period: 'month',
            features: elitePlanProduct?.features?.length > 0 ? elitePlanProduct.features : [
                'Everything in Pro Plan',
                'Direct CTO Access (SLA 4h)',
                'White-label Deployment Rights',
                'Custom Feature Development',
                'Bi-weekly Strategic Audits'
            ],
            buttonText: 'Upgrade to Enterprise',
            isPrimary: false,
            marketingBadge: '🔥 Founding Member Price',
            icon: <ShieldCheck className="text-blue-500" size={20} />,
            product: elitePlanProduct,
            key: 'institutional'
        },
    ];

    const handleSubscribe = async (planProduct) => {
        if (!user) {
            toastError('Please sign in to select a plan.');
            navigate('/login?redirect=pricing');
            return;
        }

        if (!planProduct) return;

        try {
            clearCart();
            addToCart(planProduct);
            success(`${planProduct.title} selected.`);
            navigate('/subscription-checkout', { state: { plan: planProduct } });
        } catch (err) {
            console.error("Subscription Error:", err);
            toastError("Failed to initiate checkout process.");
        }
    };

    return (
        <div className="ds-page bg-slate-50 px-6 pb-24 pt-32">
            <div className="max-w-7xl mx-auto space-y-16">
                
                {/* Header Section */}
                <div className="text-center space-y-6 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                        <Rocket size={12} className="text-blue-500" /> Infrastructure Access
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 leading-[0.9]">
                        Choose your <span className="text-slate-400">Power Level.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-sm text-slate-500 font-medium leading-relaxed">
                        Scale your development acceleration with tiered access plans. From individual creators to institutional teams.
                    </p>
                    
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                        <Sparkles size={16} className="text-amber-500 animate-pulse" />
                        <span className="text-xs font-black text-amber-700 uppercase tracking-widest">DigitalStudio Anniversary Special: Save 40% on Pro Annual Plans</span>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid gap-8 lg:grid-cols-3">
                    {plans.map((plan) => {
                        const isCurrentPlan = (user?.subscriptionPlan || 'free') === plan.key;

                        return (
                            <section
                                key={plan.name}
                                className={`relative group flex flex-col rounded-[2.5rem] border p-10 transition-all duration-500 hover:scale-[1.02] ${
                                    plan.isPrimary 
                                    ? 'bg-slate-900 border-slate-800 text-white shadow-2xl shadow-slate-900/20' 
                                    : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:shadow-xl'
                                }`}
                            >
                                {plan.marketingBadge && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg z-10">
                                        {plan.marketingBadge}
                                    </div>
                                )}

                                <div className="flex-1 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                            plan.isPrimary ? 'bg-white/10 text-amber-400' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {plan.badge}
                                        </span>
                                        {plan.icon}
                                    </div>

                                    <div className="space-y-4">
                                        <h2 className="text-3xl font-black tracking-tight">{plan.name}</h2>
                                        <div className="flex items-baseline gap-3">
                                            <div className="flex items-end gap-1">
                                                <span className="text-5xl font-black tracking-tighter">{formatCurrency(plan.price)}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${plan.isPrimary ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    / {plan.period}
                                                </span>
                                            </div>
                                            {plan.originalPrice > plan.price && (
                                                <span className={`text-lg line-through font-bold opacity-30 ${plan.isPrimary ? 'text-white' : 'text-slate-900'}`}>
                                                    {formatCurrency(plan.originalPrice)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="h-px w-full bg-current opacity-10" />

                                    <ul className="space-y-5">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-4">
                                                <div className={`mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0 ${plan.isPrimary ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-slate-900'}`} />
                                                <span className={`text-[13px] font-bold leading-tight ${plan.isPrimary ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-12">
                                     <button
                                         type="button"
                                         onClick={() => handleSubscribe(plan.product || { slug: plan.key === 'pro' ? 'pro-membership' : 'institutional-membership', title: plan.name, price: plan.price })}
                                         disabled={isCurrentPlan}
                                         className={`inline-flex w-full items-center justify-center rounded-2xl px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-30 disabled:pointer-events-none hover:scale-[1.05] active:scale-95 shadow-xl ${
                                             plan.isPrimary 
                                             ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-white/5' 
                                             : 'bg-slate-900 text-white hover:bg-slate-800'
                                         }`}
                                     >
                                         {isCurrentPlan ? 'Current Plan' : plan.buttonText}
                                     </button>
                                </div>
                            </section>
                        );
                    })}
                </div>

                {/* Trust Section */}
                <div className="grid md:grid-cols-3 gap-8 py-16 border-t border-slate-200">
                    {[
                        { title: 'Global Encryption', desc: 'Secure institutional-grade payment processing via Razorpay matrix.', icon: <ShieldCheck className="text-slate-400" /> },
                        { title: 'Instant Provisioning', desc: 'Membership benefits are activated immediately upon protocol verification.', icon: <Zap className="text-slate-400" /> },
                        { title: 'Support Redundancy', desc: 'Direct expert access ensures your technical pipeline never stalls.', icon: <Target className="text-slate-400" /> }
                    ].map(item => (
                        <div key={item.title} className="flex gap-4">
                            <div className="h-10 w-10 shrink-0 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">{item.icon}</div>
                            <div>
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-1">{item.title}</h4>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PricingPlan;
