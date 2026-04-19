import React, { useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import AuthContext from '../context/AuthContext';
import ConfigContext from '../context/ConfigContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/normalizers';

const PricingPlan = () => {
    const { config } = useContext(ConfigContext);
    const { user } = useContext(AuthContext);
    const { addToCart, clearCart } = useCart();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();

    // Feature Enforcement
    useEffect(() => {
        if (config && config.features && config.features.subscriptions === false) {
            navigate('/');
        }
    }, [config, navigate]);

    const { data: products } = useQuery({
        queryKey: ['products', 'subscription'],
        queryFn: () => productService.getAll({ type: 'subscription' }),
    });

    const proPlan = products?.find(p => p.slug === 'pro-membership');

    const handleSubscribe = () => {
        if (!user) {
            toastError('Please login to subscribe');
            navigate('/login');
            return;
        }
        if (proPlan) {
            clearCart();
            addToCart(proPlan);
            success('Membership initiated');
            navigate('/subscription-checkout', { state: { plan: proPlan } });
        }
    };

    const plans = Array.isArray(config?.memberPlans) && config.memberPlans.length > 0 ? config.memberPlans : [
        {
            name: "Standard",
            badge: "Community",
            price: 0,
            period: "forever",
            features: ["Browse Marketplace", "Access Free Docs"],
            buttonText: "Explore Assets",
            isPopular: false,
            isPrimary: false
        },
        {
            name: "Pro Membership",
            badge: "Most Popular",
            price: proPlan?.price || 29,
            period: "month",
            features: ["Unlimited Premium Documentation", "Unlimited AI Recommendations", "Early Access to Drops", "Private Slack Community", "Priority Technical Support", "ZERO Commission on Seller Sales"],
            buttonText: "Get All-Access Now",
            isPopular: true,
            isPrimary: true
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h1 className="text-5xl md:text-7xl font-black text-black mb-6 tracking-tight">Membership & <span className="text-primary">Subscriptions</span></h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium">
                        Choose the plan that's right for you. Get individual templates or unlock everything with our Pro Membership.
                    </p>
                </div>

                <div className={`grid grid-cols-1 ${plans.length === 2 ? 'md:grid-cols-2' : plans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-8 max-w-6xl mx-auto`}>
                    {plans.map((plan, index) => (
                        <div 
                            key={index} 
                            className={`${plan.isPrimary ? 'bg-black border-black shadow-2xl text-white' : 'bg-white border-gray-100 shadow-sm text-black'} rounded-[2.5rem] p-10 border flex flex-col hover:shadow-xl transition-all duration-500 relative overflow-hidden group`}
                        >
                            {plan.isPrimary && <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px]"></div>}
                            
                            <div className="mb-8 relative z-10">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full ${plan.isPrimary ? 'bg-primary text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>
                                    {plan.badge}
                                </span>
                                <h2 className={`text-3xl font-black mt-4 ${plan.isPrimary ? 'text-white' : 'text-black'}`}>{plan.name}</h2>
                            </div>

                            <div className="mb-8 flex items-baseline gap-1 relative z-10">
                                <span className="text-5xl font-black">{formatCurrency(plan.price)}</span>
                                <span className={`${plan.isPrimary ? 'text-gray-500' : 'text-gray-400'} font-bold`}>/ {plan.period}</span>
                            </div>

                            <ul className="space-y-4 mb-10 flex-1 relative z-10">
                                {(plan.features || []).map((feature, fIdx) => (
                                    <li key={fIdx} className={`flex items-center gap-3 font-medium ${plan.isPrimary ? 'text-gray-300' : 'text-gray-600'}`}>
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${plan.isPrimary ? 'bg-primary/20 text-primary' : 'bg-green-100 text-green-600'}`}>
                                            ✓
                                        </span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {plan.isPrimary ? (
                                <button 
                                    onClick={handleSubscribe}
                                    disabled={user?.subscriptionPlan === 'pro'}
                                    className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-white hover:text-black transition-all duration-300 relative z-10 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    {user?.subscriptionPlan === 'pro' ? 'Current Plan' : plan.buttonText}
                                </button>
                            ) : (
                                <Link to="/templates" className="w-full py-4 text-center bg-gray-50 text-black font-black rounded-2xl hover:bg-gray-100 transition-colors relative z-10">
                                    {plan.buttonText}
                                </Link>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-32 text-center">
                    <h3 className="text-3xl font-black text-black mb-12">Frequently Asked Questions</h3>
                    <div className="max-w-3xl mx-auto space-y-6 text-left">
                        {(config?.faqs?.slice(0, 3) || []).map((faq, idx) => (
                             <div key={idx} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                <h4 className="font-black text-black mb-2">{faq.question}</h4>
                                <p className="text-gray-500 font-medium">{faq.answer}</p>
                            </div>
                        ))}
                        {(!config?.faqs || config.faqs.length === 0) && (
                            <>
                                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                    <h4 className="font-black text-black mb-2">Can I cancel anytime?</h4>
                                    <p className="text-gray-500 font-medium">Yes, your subscription can be cancelled at any time through your account profile.</p>
                                </div>
                                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                    <h4 className="font-black text-black mb-2">Do I get template source files?</h4>
                                    <p className="text-gray-500 font-medium">Premium documentation is included. Templates still require separate licenses unless stated.</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPlan;
