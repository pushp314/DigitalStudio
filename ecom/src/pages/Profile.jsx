import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AuthContext from '../context/AuthContext';
import ConfigContext from '../context/ConfigContext';
import orderService from '../services/orderService';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { normalizeOrder, formatCurrency } from '../utils/normalizers';
import api from '../services/api';
import WishlistContext from '../context/WishlistContext';
import aiService from '../services/aiService';
import licenseService from '../services/licenseService';

const Profile = () => {
    const { user, logout } = useContext(AuthContext);
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);
    const { wishlistItems } = useContext(WishlistContext);
    const { data: rawOrders, isLoading: loading } = useQuery({
        queryKey: ['orders', 'my'],
        queryFn: () => orderService.getMyOrders(),
        enabled: !!user,
        select: (data) => (Array.isArray(data) ? data.map(normalizeOrder) : []),
    });

    const { data: licenses, isLoading: loadingLicenses } = useQuery({
        queryKey: ['licenses', 'my'],
        queryFn: () => licenseService.getMyLicenses(),
        enabled: !!user,
        select: (data) => (Array.isArray(data) ? data : []),
    });

    const { data: inquiries, isLoading: loadingInquiries } = useQuery({
        queryKey: ['inquiries', 'my'],
        queryFn: () => api.get('/my-inquiries').then(res => Array.isArray(res) ? res : []),
        enabled: !!user,
    });

    const orders = rawOrders || [];

    const { data: roadmapData, isLoading: loadingRoadmap } = useQuery({
        queryKey: ['ai-roadmap', user?.id],
        queryFn: () => aiService.getUserRoadmap((wishlistItems || []).map(i => i.id)),
        enabled: !!user && activeTab === 'overview',
        staleTime: 1000 * 60 * 60,
    });

    const { data: aiOffer, isLoading: loadingOffer } = useQuery({
        queryKey: ['ai-offer', user?.id],
        queryFn: () => api.post('/marketing/personalized-offers', { wishlistIds: (wishlistItems || []).map(i => i.id) }),
        enabled: !!user && activeTab === 'overview',
        staleTime: 1000 * 60 * 30,
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    const handleLogout = () => {
        logout();
        success("Successfully logged out");
        navigate('/');
    };

    const handleCopyRef = () => {
        const url = `${window.location.origin}/register?ref=${user.partnerCode}`;
        navigator.clipboard.writeText(url);
        success("Referral link copied to clipboard");
    };

    const handleSecureDownload = async (productId, title) => {
        setDownloadingId(productId);
        try {
            const res = await api.get(`/products/${productId}/download`);
            const link = document.createElement('a');
            link.href = res.downloadUrl;
            link.setAttribute('download', `${title.replace(/\s+/g, '_')}_DigitalStudio_Premium.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            success(`Preparing download for ${title}`);
        } catch (err) {
            toastError("Download error: Purchase required or link expired");
        } finally {
            setDownloadingId(null);
        }
    };

    if (!user) return null;

    const { config } = useContext(ConfigContext);
    const tabs = [
        { id: 'overview', label: 'Profile', icon: '👤' },
        { id: 'orders', label: 'Downloads', icon: '📚' },
        { id: 'partner', label: 'Referral Program', icon: '🤝' },
        { id: 'inquiries', label: 'My Enquiries', icon: '✉️' },
        ...(config?.features?.subscriptions ? [{ id: 'subscription', label: 'My Subscription', icon: '💎' }] : []),
        { id: 'settings', label: 'Account Settings', icon: '⚙️' },
    ];

    return (
        <div className="min-h-screen bg-white pt-32 pb-20 px-4 md:px-8 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-12">

                {/* Left Navigation */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl shadow-gray-100/50 sticky top-32">
                        <div className="flex flex-col items-center mb-10">
                            <div className={`p-[3px] rounded-[2.2rem] transition-all duration-700 ${user.subscriptionPlan === 'pro' ? 'bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-600 shadow-[0_20px_40px_rgba(251,191,36,0.15)] scale-105' : 'bg-gray-100'}`}>
                                <div className="w-24 h-24 bg-black rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-xl ring-2 ring-white/5 uppercase relative overflow-hidden">
                                    {user.name.charAt(0)}
                                    {user.subscriptionPlan === 'pro' && (
                                        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/10 to-transparent"></div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-8 text-center">
                                <h2 className="text-xl font-black text-black tracking-tight">{user.name}</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{user.email}</p>
                            </div>
                        </div>

                        <nav className="space-y-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all font-bold text-xs uppercase tracking-widest ${activeTab === tab.id
                                            ? 'bg-black text-white shadow-xl translate-x-1'
                                            : 'text-gray-400 hover:text-black hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-lg opacity-80">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                            <div className="h-px bg-gray-50 my-6 mx-4"></div>
                            <button
                                onClick={() => setIsLogoutModalOpen(true)}
                                className="w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all font-bold text-xs uppercase tracking-widest text-red-500 hover:bg-red-50"
                            >
                                <span className="text-lg">🚪</span>
                                Logout
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm min-h-[700px] relative overflow-hidden">
                        
                        {/* Status Accents */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/50 rounded-bl-full -translate-y-4 translate-x-4"></div>

                        <div className="relative z-10">
                            <div className="mb-12">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-2">User Dashboard</p>
                                <h1 className="text-4xl font-black text-black tracking-tighter capitalize">{activeTab.replace('-', ' ')}</h1>
                            </div>

                            {activeTab === 'overview' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <StatCard label="Orders" value={orders.length} sub="Total Purchases" />
                                        <StatCard label="Joined" value={new Date(user.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} sub="Member Since" />
                                        <StatCard 
                                            label="Account Plan" 
                                            value={user.subscriptionPlan === 'pro' ? 'Elite Insight' : 'Standard'} 
                                            sub="Subscription Tier" 
                                            isPro={user.subscriptionPlan === 'pro'}
                                        />
                                    </div>
                                    
                                    <div className={`p-10 rounded-[2.5rem] relative overflow-hidden group ${user.subscriptionPlan === 'pro' ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100' : 'bg-black text-white'}`}>
                                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                                            <div className="max-w-md">
                                                <h3 className="text-2xl font-black mb-3">{user.subscriptionPlan === 'pro' ? '✨ Pro Plan Active' : 'Upgrade to Pro Account'}</h3>
                                                <p className={`text-sm font-medium leading-relaxed ${user.subscriptionPlan === 'pro' ? 'text-emerald-700' : 'text-gray-400'}`}>
                                                    {user.subscriptionPlan === 'pro' 
                                                        ? `Your Pro subscription is active. You have full access to all templates, documentation, and priority features.` 
                                                        : 'Unlock the full power of DigitalStudio. Unlimited downloads, AI-tools, and premium support.'}
                                                </p>
                                            </div>
                                            {user.subscriptionPlan !== 'pro' && (
                                                <button onClick={() => navigate('/pricing')} className="px-10 py-5 bg-white text-black rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20">
                                                    Upgrade Now
                                                </button>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full group-hover:scale-110 transition-all duration-700"></div>
                                    </div>

                                    {user.subscriptionPlan === 'pro' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="p-8 border border-amber-100 bg-amber-50/30 rounded-[2.5rem]">
                                                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4">Pro Perk</h4>
                                                <h5 className="text-xl font-bold text-black mb-2">Unlimited Template Unlocks</h5>
                                                <p className="text-xs text-gray-500 leading-relaxed">As a Pro member, any template marked with a diamond icon is yours to unlock for free.</p>
                                            </div>
                                            <div className="p-8 border border-blue-100 bg-blue-50/30 rounded-[2.5rem]">
                                                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Priority Support</h4>
                                                <h5 className="text-xl font-bold text-black mb-2">Technical Guidance</h5>
                                                <p className="text-xs text-gray-500 leading-relaxed">Direct access to our engineering team for roadmap help and technical implementation questions.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* AI Negotiated Deal */}
                                    {aiOffer && (
                                        <div className="p-10 rounded-[3rem] bg-gradient-to-br from-amber-500 to-amber-700 text-white relative overflow-hidden group shadow-2xl shadow-amber-500/20">
                                            <div className="absolute top-0 right-0 p-8 text-4xl opacity-10 blur-sm group-hover:scale-125 transition-transform duration-1000">🤝</div>
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-start mb-8">
                                                    <div>
                                                        <span className="px-3 py-1 bg-white/20 text-[9px] font-black rounded-lg uppercase tracking-widest backdrop-blur-md">Negotiated by AI</span>
                                                        <h3 className="text-3xl font-black mt-4 tracking-tight">{aiOffer.offerTitle}</h3>
                                                        <p className="text-xs font-bold text-amber-100 opacity-90 mt-2 italic">“{aiOffer.pitch}”</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-5xl font-black tracking-tighter">{aiOffer.discount}%<span className="text-lg opacity-60 ml-1">OFF</span></div>
                                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Limited Opportunity</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col md:flex-row gap-6 items-center">
                                                    <div className="flex-1 w-full bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl flex justify-between items-center px-8 group/code cursor-copy active:scale-95 transition-all" onClick={() => {
                                                        navigator.clipboard.writeText(aiOffer.code);
                                                        success(`Promo code ${aiOffer.code} copied!`);
                                                    }}>
                                                        <div>
                                                            <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Exclusive Voucher Code</p>
                                                            <p className="text-2xl font-black tracking-widest font-mono">{aiOffer.code}</p>
                                                        </div>
                                                        <div className="text-xl group-hover/code:translate-x-1 transition-transform">📋</div>
                                                    </div>
                                                    
                                                    <div className="shrink-0 text-center md:text-left">
                                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">Expires In</p>
                                                        <div className="flex gap-3 text-xl font-black tabular-nums">
                                                            <div className="bg-black/20 px-3 py-2 rounded-xl border border-white/10">{aiOffer.expiryHours}h</div>
                                                            <div className="bg-black/20 px-3 py-2 rounded-xl border border-white/10">00m</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Decorative Animation */}
                                            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-[60px] group-hover:scale-150 transition-all duration-1000"></div>
                                        </div>
                                    )}

                                    {/* AI Strategic Trajectory */}
                                    <div className="p-10 rounded-[3rem] border border-gray-100 bg-white shadow-2xl shadow-emerald-500/5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 grayscale group-hover:grayscale-0 group-hover:opacity-10 transition-all duration-700">🧠</div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-6">
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-lg uppercase tracking-widest">AI Strategic Trajectory</span>
                                                <div className="flex gap-1">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></div>
                                                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse delay-75"></div>
                                                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse delay-150"></div>
                                                </div>
                                            </div>
                                            
                                            {loadingRoadmap ? (
                                                <div className="space-y-4">
                                                    <div className="h-4 bg-gray-50 rounded-full w-3/4 animate-pulse"></div>
                                                    <div className="h-4 bg-gray-50 rounded-full w-full animate-pulse"></div>
                                                    <div className="h-4 bg-gray-50 rounded-full w-2/3 animate-pulse"></div>
                                                </div>
                                            ) : roadmapData?.roadmap ? (
                                                <div className="prose prose-sm max-w-none">
                                                    <p className="text-sm font-bold text-gray-800 leading-relaxed whitespace-pre-wrap italic">
                                                        "{roadmapData.roadmap}"
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Analyzing behavioral vectors to generate roadmap...</p>
                                            )}

                                            <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">
                                                <span>Proprietary Intel</span>
                                                <span className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span>
                                                    Live Analysis
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'partner' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-12 bg-black text-white rounded-[3rem] relative overflow-hidden group">
                                            <div className="relative z-10">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 text-emerald-500">Partner Earnings</p>
                                                <h2 className="text-6xl font-black tracking-tighter mb-2">{formatCurrency(user.partnerBalance || 0)}</h2>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available Credits</p>
                                            </div>
                                            <div className="absolute top-0 right-0 p-10 opacity-10 blur-xl group-hover:opacity-20 transition-all">💰</div>
                                        </div>
                                        <div className="p-12 bg-gray-50/50 border border-gray-100 rounded-[3rem] flex flex-col justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Unique Partner Code</p>
                                                <h3 className="text-3xl font-black text-black tracking-tighter font-mono">{user.partnerCode || 'STUDIO-XXX'}</h3>
                                            </div>
                                            <button 
                                                onClick={handleCopyRef}
                                                className="w-full mt-8 py-5 bg-white border border-gray-100 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                                            >
                                                <span>🔗</span> Clone Partner Link
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-12 border border-gray-100 rounded-[3rem] bg-white">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-xl">✨</div>
                                            <div>
                                                <h4 className="text-xl font-black text-black tracking-tight">Referral Program</h4>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">How our affiliate system works</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                            <div className="space-y-4">
                                                <div className="text-2xl">📡</div>
                                                <h5 className="font-black text-black text-sm uppercase">Share Link</h5>
                                                <p className="text-xs text-gray-400 font-medium leading-relaxed italic">Share your unique link with other creators and designers.</p>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="text-2xl">👤</div>
                                                <h5 className="font-black text-black text-sm uppercase">Referrals</h5>
                                                <p className="text-xs text-gray-400 font-medium leading-relaxed italic">When someone signs up using your link, they become your referral.</p>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="text-2xl">💸</div>
                                                <h5 className="font-black text-black text-sm uppercase">Earn Credits</h5>
                                                <p className="text-xs text-gray-400 font-medium leading-relaxed italic">Get ₹100 for every purchase your referrals make, forever.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'orders' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                    {loading ? (
                                        <div className="p-20 text-center animate-pulse text-[10px] font-bold text-gray-400 uppercase tracking-widest">Accessing downloads...</div>
                                    ) : orders.length === 0 && !user.isPro ? (
                                        <div className="text-center py-40 border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/30">
                                            <div className="text-5xl mb-6 grayscale">📦</div>
                                            <h3 className="text-2xl font-black text-black mb-2 tracking-tight">No downloads yet</h3>
                                            <p className="text-sm text-gray-400 font-medium mb-10 uppercase tracking-widest">Your purchased products will appear here</p>
                                            <button onClick={() => navigate('/templates')} className="px-12 py-5 bg-black text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/10 hover:bg-gray-800 transition-all">
                                                Browse Marketplace
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid gap-6">
                                            {orders.map(order => {
                                                const items = order.orderItems || [];
                                                return items.map(item => {
                                                    const product = item.product;
                                                    const isDownloading = downloadingId === product?.id;
                                                    return (
                                                        <div key={`${order.id}-${product?.id}`} className="group bg-white border border-gray-50 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-gray-100 hover:-translate-y-1 transition-all duration-500 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                                                            <div className="w-32 h-32 rounded-[2rem] border border-gray-50 overflow-hidden shadow-sm shrink-0 bg-gray-50 group-hover:scale-105 transition-transform duration-500">
                                                                {product?.image && <img src={product.image} alt="" className="w-full h-full object-cover" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0 text-center md:text-left">
                                                                <h4 className="text-xl font-black text-black tracking-tight mb-2 truncate">{product?.title || 'Unknown Product'}</h4>
                                                                <div className="flex flex-wrap justify-center md:justify-start gap-4 items-center">
                                                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Order ID: {order.id}</span>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Verified Purchase</span>
                                                                    <span className="px-2.5 py-1 bg-gray-100 text-[8px] font-black text-gray-500 rounded uppercase">{product?.category}</span>
                                                                </div>
                                                                
                                                                {/* License Details */}
                                                                <div className="mt-6 flex flex-col gap-2">
                                                                     <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Serial Key</p>
                                                                     <div className="bg-gray-50/50 border border-gray-100 px-6 py-3 rounded-2xl font-mono text-[10px] font-bold text-black border-dashed break-all select-all hover:bg-gray-100 transition-colors">
                                                                         {(licenses || []).find(l => l.productId === product?.id && l.orderId === order.id)?.licenseKey || `DS-${order.id}-${String(product?.id).padStart(4, '0')}-KEY`}
                                                                     </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                                                                <button 
                                                                    onClick={() => handleSecureDownload(product?.id, product?.title)}
                                                                    disabled={isDownloading}
                                                                    className={`px-8 py-4 bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/10 transition-all active:scale-95 ${isDownloading ? 'bg-gray-300 cursor-wait' : 'hover:bg-gray-800'}`}
                                                                >
                                                                    {isDownloading ? 'Downloading...' : 'Download Files'}
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        const url = prompt("Share your site: Please provide your live deployment URL for ₹50 reward:");
                                                                        if (url) {
                                                                            api.post('/showcase', { productId: product.id, liveUrl: url })
                                                                                .then(() => success("Link received! Thank you for sharing your work."))
                                                                                .catch(() => toastError("Failed to send link"));
                                                                        }
                                                                    }}
                                                                    className="px-8 py-4 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                                                                >
                                                                    Submit for Reward ✨
                                                                </button>
                                                                <button className="px-8 py-4 bg-gray-50 text-gray-400 hover:text-black border border-gray-100 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">
                                                                    Receipt 🧾
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'subscription' && (
                                <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="bg-black text-white p-12 rounded-[3.5rem] relative overflow-hidden">
                                        <div className="relative z-10">
                                            <h3 className="text-3xl font-black mb-6 tracking-tight">Subscription Plan</h3>
                                            <div className="flex items-baseline gap-4 mb-10">
                                                <span className="text-7xl font-black tracking-tighter capitalize">{user.subscriptionPlan}</span>
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Plan</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Benefit</p>
                                                    <p className="text-sm font-bold">Lifetime Commercial License</p>
                                                </div>
                                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Status</p>
                                                    <p className="text-sm font-bold text-emerald-400">Active</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-10 border border-gray-100 rounded-[3rem] bg-gray-50/20">
                                            <h4 className="font-bold text-black mb-6 uppercase tracking-widest text-xs">Account Details</h4>
                                            <div className="space-y-4">
                                                <MetadataRow label="User ID" value={user.id} />
                                                <MetadataRow label="Provider" value={user.provider || 'DigitalStudio'} />
                                                <MetadataRow label="Expires" value={user.proExpiresAt ? new Date(user.proExpiresAt).toDateString() : 'Never'} />
                                            </div>
                                        </div>
                                        <div className="p-10 border border-gray-100 rounded-[3rem] bg-gray-50/20">
                                            <h4 className="font-bold text-black mb-6 uppercase tracking-widest text-xs">Billing</h4>
                                            <p className="text-xs text-gray-400 font-medium leading-loose">
                                                Your subscription is managed through our secure billing system. For billing inquiries or support, please contact our help team.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'inquiries' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                    {loadingInquiries ? (
                                        <div className="p-20 text-center animate-pulse text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading conversations...</div>
                                    ) : (inquiries || []).length === 0 ? (
                                        <div className="text-center py-40 border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/30">
                                            <div className="text-5xl mb-6 grayscale">✉️</div>
                                            <h3 className="text-2xl font-black text-black mb-2 tracking-tight">No enquiries yet</h3>
                                            <p className="text-sm text-gray-400 font-medium mb-10 uppercase tracking-widest">Need help? Send us a message through the contact page.</p>
                                            <button onClick={() => navigate('/contact')} className="px-12 py-5 bg-black text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/10 hover:bg-gray-800 transition-all">
                                                Contact Support
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid gap-6">
                                            {inquiries.map(inq => (
                                                <div key={inq.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-10 hover:shadow-xl transition-all">
                                                    <div className="flex justify-between items-start gap-4 mb-6">
                                                        <div>
                                                            <h4 className="text-xl font-black text-black tracking-tight mb-2">{inq.subject}</h4>
                                                            <div className="flex items-center gap-3">
                                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                                    inq.status === 'replied' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                                                                }`}>
                                                                    {inq.status}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                                                    {new Date(inq.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50/50 p-6 rounded-2xl mb-6">
                                                        <p className="text-sm text-gray-600 font-medium leading-relaxed">{inq.message}</p>
                                                    </div>
                                                    {inq.reply && (
                                                        <div className="border-t border-gray-100 pt-6">
                                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                <span className="w-5 h-5 bg-primary text-white rounded-lg flex items-center justify-center text-[10px]">✨</span>
                                                                Official Support Response
                                                            </p>
                                                            <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl">
                                                                <p className="text-sm text-gray-600 font-bold leading-relaxed">{inq.reply}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="max-w-xl animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="space-y-10">
                                        <Field label="Full Name">
                                            <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-8 py-5 outline-none focus:border-black font-bold text-sm tracking-tight" defaultValue={user.name} />
                                        </Field>
                                        <Field label="Registered Email">
                                            <input type="email" className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-8 py-5 outline-none font-bold text-sm text-gray-400" defaultValue={user.email} disabled />
                                        </Field>
                                        <div className="pt-8 border-t border-gray-50">
                                            <button className="px-12 py-5 bg-black text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/10 active:scale-95 transition-all">Save Changes</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
            
            <ConfirmModal 
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogout}
                title="Logout?"
                message="Are you sure you want to log out? You will need to log in again to access your downloads and settings."
                confirmText="Logout"
                type="danger"
            />
        </div>
    );
};

const StatCard = ({ label, value, sub, isPro }) => (
    <div className={`p-10 rounded-[2.5rem] border border-gray-100 bg-gray-50/30 group hover:shadow-2xl transition-all duration-500 relative overflow-hidden ${isPro ? 'bg-white shadow-xl shadow-yellow-500/5 ring-1 ring-yellow-400/20' : 'hover:bg-white'}`}>
        {isPro && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-bl-full -translate-y-4 translate-x-4"></div>
        )}
        <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4 group-hover:text-black transition-colors">{label}</div>
        <div className={`text-4xl font-black tracking-tight mb-2 ${isPro ? 'bg-gradient-to-r from-yellow-600 to-amber-400 bg-clip-text text-transparent' : 'text-black'}`}>{value}</div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sub}</div>
    </div>
);

const MetadataRow = ({ label, value }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-black text-black">{value}</span>
    </div>
);

const Field = ({ label, children }) => (
    <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2">{label}</label>
        {children}
    </div>
);

export default Profile;
