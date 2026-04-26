import React, { useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import AuthContext from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, normalizeProduct } from '../utils/normalizers';
import { ShieldCheck, Zap, Rocket, Target, Crown } from 'lucide-react';
import Meta from '../components/common/Meta';
import { absoluteUrl, breadcrumbSchema } from '../utils/seo';

const PricingPlan = () => {
    const { user } = useContext(AuthContext);
    const { addToCart, clearCart } = useCart();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();

    const { data: rawProducts = [] } = useQuery({
        queryKey: ['products', 'subscription'],
        queryFn: () => productService.getAll({ productType: 'subscription' }),
    });

    const products = useMemo(() => (Array.isArray(rawProducts) ? rawProducts.map(normalizeProduct) : []), [rawProducts]);
    const proPlanProduct = products.find((product) => product.slug === 'pro-membership');
    const elitePlanProduct = products.find((product) => product.slug === 'elite-membership');

    const plans = [
        {
            name: 'Free',
            badge: 'Start here',
            description: 'For buyers comparing ready products or reading public guides before purchase.',
            originalPrice: 0,
            price: 0,
            period: 'forever',
            features: [
                'Browse ready apps and software kits',
                'Buy individual products when needed',
                'Read public documentation and previews',
                'Standard contact support',
                'Limited community chat access'
            ],
            buttonText: 'Explore apps',
            isPrimary: false,
            marketingBadge: null,
            product: null,
            key: 'free'
        },
        {
            name: 'Pro Membership',
            badge: 'Most Popular',
            description: 'For builders who want better access, priority help, and community benefits.',
            originalPrice: (proPlanProduct?.price || 29) + 20, 
            price: proPlanProduct?.price || 29,
            period: 'month',
            features: proPlanProduct?.features?.length > 0 ? proPlanProduct.features : [
                'Priority expert support benefits',
                'Premium documentation access',
                'Unlimited community chat messaging',
                'Image and file sharing in community chat',
                'Member access to eligible products',
                'Faster help with setup and deployment'
            ],
            buttonText: 'Upgrade to Pro',
            isPrimary: true,
            marketingBadge: 'Best for active builders',
            icon: <Crown className="text-amber-400" size={24} fill="currentColor" />,
            product: proPlanProduct,
            key: 'pro'
        },
        {
            name: 'Elite Membership',
            badge: 'Enterprise Access',
            description: 'For agencies and high-growth founders requiring direct access and priority delivery.',
            originalPrice: (elitePlanProduct?.price || 99) + 50,
            price: elitePlanProduct?.price || 99,
            period: 'month',
            features: elitePlanProduct?.features?.length > 0 ? elitePlanProduct.features : [
                'Private Slack/Discord channel access',
                'Commercial Multi-Project License',
                '1 Free Custom Build Request per quarter',
                'Priority deployment consulting',
                'Direct access to lead developers'
            ],
            buttonText: 'Join Elite Tier',
            isPrimary: false,
            marketingBadge: 'Best for Agencies',
            icon: <Zap className="text-indigo-600" size={24} fill="currentColor" />,
            product: elitePlanProduct,
            key: 'elite'
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

    const handlePlanAction = (plan) => {
        if (plan.key === 'free') {
            navigate('/assets');
            return;
        }

        if (plan.contactOnly) {
            navigate('/hire-developer');
            return;
        }

        handleSubscribe(plan.product || { slug: plan.key === 'pro' ? 'pro-membership' : 'elite-membership', title: plan.name, price: plan.price });
    };

    return (
        <div className="ds-page relative overflow-hidden px-4 sm:px-6 pb-24 pt-12 sm:pt-16">
            <Meta
                title="BizCode Pricing for Developer Assets and Support"
                description="Compare BizCode pricing for developer assets, premium guides, expert help, SaaS template support, and custom build paths."
                canonical={absoluteUrl('/pricing')}
                jsonLd={[breadcrumbSchema([
                    { name: 'Home', path: '/' },
                    { name: 'Pricing', path: '/pricing' },
                ])]}
            />
            {/* Premium Mesh Gradient Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none opacity-50">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-200/30 blur-[120px] rounded-full" />
                <div className="absolute top-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-200/20 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
                
                {/* Header Section */}
                <div className="text-center space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">
                        <Rocket size={12} className="text-emerald-500" /> Plans
                    </div>
                    <h1 className="text-clamp-6xl font-black tracking-tighter text-slate-900 leading-[0.95] sm:leading-[0.9]">
                        Choose the right <span className="text-slate-400">access and support.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-500 font-medium leading-relaxed px-4">
                        Start free, buy individual products, upgrade for Pro support and premium docs, or request a custom plan for team delivery.
                    </p>
                    
                    <div className="inline-flex items-center gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl mx-4">
                        <ShieldCheck size={16} className="text-amber-500 shrink-0" />
                        <span className="text-[10px] sm:text-xs font-black text-amber-700 uppercase tracking-widest leading-tight">Every purchase includes authenticated delivery</span>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid gap-6 sm:gap-8 lg:grid-cols-3 px-2 sm:px-0">
                    {plans.map((plan) => {
                        const isCurrentPlan = (user?.subscriptionPlan || 'free') === plan.key;

                        return (
                            <section
                                key={plan.name}
                                className={`relative group flex flex-col rounded-[2rem] sm:rounded-[2.5rem] border p-8 sm:p-10 transition-all duration-500 hover:scale-[1.02] ${
                                    plan.isPrimary 
                                    ? 'bg-slate-900 border-slate-800 text-white shadow-2xl shadow-slate-900/20' 
                                    : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:shadow-xl'
                                }`}
                            >
                                {plan.marketingBadge && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg z-10 whitespace-nowrap">
                                        {plan.marketingBadge}
                                    </div>
                                )}

                                <div className="flex-1 space-y-6 sm:space-y-8">
                                    <div className="flex items-center justify-between">
                                        <span className={`px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${
                                            plan.isPrimary ? 'bg-white/10 text-amber-400' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {plan.badge}
                                        </span>
                                        {plan.icon}
                                    </div>

                                    <div className="space-y-3 sm:space-y-4">
                                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{plan.name}</h2>
                                        <p className={`text-xs sm:text-sm leading-relaxed font-medium ${plan.isPrimary ? 'text-slate-300' : 'text-slate-500'}`}>{plan.description}</p>
                                        <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                                            <div className="flex items-end gap-1">
                                                <span className="text-4xl sm:text-5xl font-black tracking-tighter">{plan.contactOnly ? 'Custom' : formatCurrency(plan.price)}</span>
                                                <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1.5 sm:mb-2 ${plan.isPrimary ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    / {plan.period}
                                                </span>
                                            </div>
                                            {plan.originalPrice > plan.price && (
                                                <span className={`text-base sm:text-lg line-through font-bold opacity-30 ${plan.isPrimary ? 'text-white' : 'text-slate-900'}`}>
                                                    {formatCurrency(plan.originalPrice)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="h-px w-full bg-current opacity-10" />

                                    <ul className="space-y-4 sm:space-y-5">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-3 sm:gap-4">
                                                <div className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${plan.isPrimary ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-slate-900'}`} />
                                                <span className={`text-[12px] sm:text-[13px] font-bold leading-tight ${plan.isPrimary ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-8 sm:mt-12">
                                     <button
                                         type="button"
                                         onClick={() => handlePlanAction(plan)}
                                         disabled={isCurrentPlan && plan.key !== 'free'}
                                         className={`inline-flex w-full items-center justify-center rounded-xl sm:rounded-2xl px-6 sm:px-8 py-4 sm:py-5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-30 disabled:pointer-events-none hover:scale-[1.05] active:scale-95 shadow-xl ${
                                             plan.isPrimary 
                                             ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-white/5' 
                                             : 'bg-slate-900 text-white hover:bg-slate-800'
                                         }`}
                                     >
                                         {isCurrentPlan && plan.key !== 'free' ? 'Current plan' : plan.buttonText}
                                     </button>
                                </div>
                            </section>
                        );
                    })}
                </div>

                {/* Trust Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12 sm:py-16 border-t border-slate-200 px-4 sm:px-0">
                    {[
                        { title: 'Secure payments', desc: 'Checkout and membership payments are processed through Razorpay.', icon: <ShieldCheck className="text-slate-400" /> },
                        { title: 'Fast activation', desc: 'Eligible product access and membership benefits activate after payment verification.', icon: <Zap className="text-slate-400" /> },
                        { title: 'Expert help', desc: 'Support sessions and custom work paths are available when you need implementation help.', icon: <Target className="text-slate-400" /> }
                    ].map(item => (
                        <div key={item.title} className="flex gap-4">
                            <div className="h-10 w-10 shrink-0 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">{item.icon}</div>
                            <div>
                                <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-900 mb-1">{item.title}</h4>
                                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PricingPlan;
