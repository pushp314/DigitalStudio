import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import analyticsService from '../../services/analyticsService';
import { formatCurrency } from '../../utils/normalizers';

// Specialized Sub-Components
import ProductList from '../../components/admin/ProductList';
import OrderList from '../../components/admin/OrderList';
import DocsManager from '../../components/admin/DocsManager';
import UserList from '../../components/admin/UserList';
import SiteConfigForm from '../../components/admin/SiteConfigForm';
import TestimonialManager from '../../components/admin/TestimonialManager';
import Marketing from './Marketing';
import ShowcaseManager from '../../components/admin/ShowcaseManager';
import LicenseManager from '../../components/admin/LicenseManager';
import SubscriptionManager from '../../components/admin/SubscriptionManager';
import AdminSearchPalette from '../../components/admin/AdminSearchPalette';
import ContactManager from '../../components/admin/ContactManager';

const Dashboard = ({ defaultTab }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isNotifyOpen, setIsNotifyOpen] = useState(false);

    // Map URL path to active tab
    const currentTab = useMemo(() => {
        if (defaultTab) return defaultTab;
        const path = location.pathname;
        if (path.includes('/admin/analytics')) return 'analytics';
        if (path.includes('/admin/inventory')) return 'inventory';
        if (path.includes('/admin/orders')) return 'orders';
        if (path.includes('/admin/licenses')) return 'licenses';
        if (path.includes('/admin/docs')) return 'docs';
        if (path.includes('/admin/marketing')) return 'marketing';
        if (path.includes('/admin/testimonials')) return 'testimonials';
        if (path.includes('/admin/showcase')) return 'showcase';
        if (path.includes('/admin/settings')) return 'settings';
        if (path.includes('/admin/config')) return 'config';
        if (path.includes('/admin/maintenance')) return 'maintenance';
        if (path.includes('/admin/users')) return 'users';
        if (path.includes('/admin/subscriptions')) return 'subscriptions';
        if (path.includes('/admin/messages')) return 'messages';
        return 'analytics';
    }, [location.pathname, defaultTab]);

    const setActiveTab = (tabId) => {
        const routes = {
            analytics: '/admin/analytics',
            inventory: '/admin/inventory',
            orders: '/admin/orders',
            licenses: '/admin/licenses',
            docs: '/admin/docs',
            users: '/admin/users',
            marketing: '/admin/marketing',
            testimonials: '/admin/testimonials',
            showcase: '/admin/showcase',
            settings: '/admin/settings',
            config: '/admin/config',
            maintenance: '/admin/maintenance',
            subscriptions: '/admin/subscriptions',
            messages: '/admin/messages'
        };
        navigate(routes[tabId] || '/admin/analytics');
    };

    // Analytics Query
    const { data: analytics } = useQuery({
        queryKey: ['admin-analytics-metrics'],
        queryFn: () => analyticsService.getAnalyticsData(),
        refetchInterval: 30000, // Sync every 30s
    });

    const stats = useMemo(() => [
        { label: 'Revenue Trend', value: formatCurrency(analytics?.revenueVelocity?.reduce((acc, curr) => acc + curr.revenue, 0) || 0), change: '7D Trend', icon: '💰' },
        { label: 'Sales Pulse', value: `${(analytics?.conversionRate || 0).toFixed(1)}%`, change: 'Current', icon: '⚡' },
        { label: 'Total Users', value: analytics?.totalUsers || 0, change: 'Lifetime', icon: '👥' },
    ], [analytics]);

    // Graph Calculation
    const graphData = useMemo(() => {
        if (!analytics?.revenueVelocity || analytics.revenueVelocity.length === 0) return "M0,80 Q50,70 100,50 T200,60 T300,30 T400,10";
        
        const points = analytics.revenueVelocity;
        const maxRev = Math.max(...points.map(p => p.revenue), 10);
        const width = 400;
        const height = 100;
        
        let pathStr = `M0,${height - (points[0].revenue / maxRev * height)}`;
        points.forEach((p, i) => {
            const x = (i / (points.length - 1)) * width;
            const y = height - (p.revenue / maxRev * height);
            pathStr += ` L${x},${y}`;
        });
        return pathStr;
    }, [analytics]);

    const menuItems = [
        { id: 'analytics', label: 'Overview', icon: '📊' },
        { id: 'inventory', label: 'Product List', icon: '⚡' },
        { id: 'orders', label: 'Sales History', icon: '💳' },
        { id: 'licenses', label: 'Licenses', icon: '🔑' },
        { id: 'marketing', label: 'Marketing', icon: '📢' },
        { id: 'config', label: 'Site Features', icon: '⚡' },
        { id: 'docs', label: 'Documentation', icon: '📚' },
        { id: 'testimonials', label: 'Reviews', icon: '⭐️' },
        { id: 'showcase', label: 'Showcase', icon: '✨' },
        { id: 'users', label: 'User Directory', icon: '👥' },
        { id: 'subscriptions', label: 'Subscribers', icon: '💎' },
        { id: 'messages', label: 'Messages', icon: '✉️' },
        { id: 'maintenance', label: 'Maintenance', icon: '🛡️' },
        { id: 'settings', label: 'General Settings', icon: '⚙️' },
    ];

    useEffect(() => {
        const handleKeys = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, []);

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-black selection:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            <AdminSearchPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            <div className="flex h-screen overflow-hidden">
                
                {/* Enterprise Sidebar - Densified */}
                <aside className="w-72 bg-[#F8F9FA] border-r border-gray-100 flex flex-col p-6">
                    <div className="space-y-8 overflow-y-auto pr-1 custom-scrollbar">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center font-black text-white text-base shadow-lg shadow-black/10">D</div>
                            <div>
                                <h1 className="text-sm font-black tracking-tighter text-black uppercase">DigitalStudio</h1>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest -mt-0.5">Control Panel</p>
                            </div>
                        </div>

                        <nav className="space-y-0.5">
                            {menuItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl font-bold text-[10px] transition-all duration-300 group relative ${
                                        currentTab === item.id 
                                        ? 'bg-white text-black shadow-lg shadow-black/5 ring-1 ring-gray-100' 
                                        : 'text-gray-500 hover:text-black hover:bg-gray-100/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`text-base transition-all duration-500 ${currentTab === item.id ? 'scale-110' : 'group-hover:scale-110 opacity-70 grayscale'}`}>{item.icon}</span>
                                        <span className="uppercase tracking-widest text-inherit">{item.label}</span>
                                    </div>
                                    {currentTab === item.id && (
                                        <div className="w-1 h-1 bg-black rounded-full"></div>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="pt-6 border-t border-gray-100 mt-auto space-y-4">
                        {/* Server Status Monitor */}
                        <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Metrics</p>
                            <div className="space-y-2">
                                <HealthRow label="Core API" status="online" />
                                <HealthRow label="Security" status="online" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 rounded-full bg-black border-2 border-white shadow-md flex items-center justify-center font-black text-white text-xs shrink-0">P</div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black text-black truncate leading-none mb-0.5">Administrator</p>
                                <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-widest">Master Key</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Content Area - Densified */}
                <main className="flex-1 bg-white overflow-y-auto p-6 lg:p-8 relative custom-scrollbar">
                    
                    {/* Glassmorphism Header */}
                    <div className="sticky top-0 right-0 flex justify-end items-center gap-4 z-50 py-2 bg-white/90 backdrop-blur-xl border-b border-gray-100/50 px-6 -mx-8 -mt-8 mb-8">
                         <div className="mr-6">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Environment</p>
                             <div className="flex items-center gap-2 mt-0.5">
                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                                 <span className="text-[9px] font-mono font-black text-black uppercase">Live_Node:PRD-01</span>
                             </div>
                         </div>
                         <button onClick={() => setIsSearchOpen(true)} className="flex items-center gap-3 px-5 py-2.5 bg-gray-50/50 border border-gray-100 rounded-2xl hover:bg-white transition-all group">
                             <span className="text-xs">🔍</span>
                             <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Search</span>
                             <span className="ml-4 px-2 py-0.5 bg-white border border-gray-100 rounded-lg text-[8px] font-black text-gray-300">⌘K</span>
                         </button>
                         <button onClick={() => setIsNotifyOpen(!isNotifyOpen)} className="w-10 h-10 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-center relative group hover:shadow-md transition-all">
                             <span className="text-base">🔔</span>
                             <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
                             {isNotifyOpen && (
                                 <div className="absolute top-14 right-0 w-80 bg-white border border-gray-100 rounded-3xl shadow-2xl p-6 z-[100] animate-in fade-in zoom-in-95 duration-300">
                                     <div className="flex justify-between items-center mb-6">
                                        <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Intelligent Alerts</h4>
                                        <button className="text-[8px] font-black text-primary uppercase">Purge</button>
                                     </div>
                                      <div className="space-y-4">
                                         <NotifyItem icon="📦" title="Order Alert" sub={`New pulse: ${analytics?.recentSales || 0} units`} time="Now" />
                                         <NotifyItem icon="💰" title="Capital Inflow" sub="₹4,999 Processed" time="3m" />
                                      </div>
                                 </div>
                             )}
                         </button>
                    </div>

                    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
                        {/* Summary Statistics */}
                        {currentTab === 'analytics' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {stats.map((stat, i) => (
                                    <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/50 rounded-bl-full -translate-y-4 translate-x-4"></div>
                                        <div className="relative z-10">
                                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-all shadow-inner">
                                                {stat.icon}
                                            </div>
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">{stat.label}</p>
                                            <div className="flex items-baseline gap-3 mt-2">
                                                <h3 className="text-3xl font-black text-black tracking-tighter">{stat.value}</h3>
                                                <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest">Active</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Layout Content */}
                        <div className="min-h-[400px]">
                            {currentTab === 'analytics' && <div className="space-y-8">
                                <div className="animate-in slide-in-from-bottom-6 duration-700">
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                        {/* Revenue Graph (SVG) */}
                                        <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-[450px]">
                                            <div>
                                                <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-8">Financial Pulse (7D)</h3>
                                                <div className="relative h-40 w-full group/graph mt-8">
                                                    <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                                                        <defs>
                                                            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                                                <stop offset="0%" style={{stopColor:'rgb(0,0,0)', stopOpacity:0.04}} />
                                                                <stop offset="100%" style={{stopColor:'rgb(0,0,0)', stopOpacity:0}} />
                                                            </linearGradient>
                                                        </defs>
                                                        <path d={`${graphData} V100 H0 Z`} fill="url(#grad)" />
                                                        <path d={graphData} fill="none" stroke="black" strokeWidth="2.5" />
                                                        <circle cx="400" cy="10" r="3" fill="black" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-black tracking-tighter">Synchronized Engine</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Real-time revenue monitoring active</p>
                                            </div>
                                        </div>

                                        {/* Categories Performance */}
                                        <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[450px]">
                                            <div className="flex justify-between items-center mb-8">
                                                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Segment Allocation</h3>
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            </div>
                                            <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                                                {analytics?.topCategories?.map((cat, idx) => (
                                                    <div key={idx} className="flex justify-between items-center group">
                                                        <div>
                                                            <p className="text-xs font-black text-black uppercase tracking-tight">{cat.category}</p>
                                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{cat.count} Units</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs font-black text-black">{formatCurrency(cat.revenue)}</p>
                                                            <div className="w-20 h-1 bg-gray-50 rounded-full mt-1.5 overflow-hidden border border-gray-100">
                                                                <div className="h-full bg-black transition-all duration-1000" style={{ width: `${(cat.revenue / (analytics.topCategories[0].revenue || 1) * 100)}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>}
                            {currentTab === 'inventory' && <ProductList />}
                            {currentTab === 'orders' && <OrderList />}
                            {currentTab === 'licenses' && <LicenseManager />}
                            {currentTab === 'marketing' && <Marketing />}
                            {currentTab === 'docs' && <DocsManager />}
                            {currentTab === 'users' && <UserList />}
                            {currentTab === 'testimonials' && <TestimonialManager />}
                            {currentTab === 'showcase' && <ShowcaseManager />}
                            {currentTab === 'subscriptions' && <SubscriptionManager />}
                            {currentTab === 'messages' && <ContactManager />}
                            {(currentTab === 'settings' || currentTab === 'config' || currentTab === 'maintenance') && (
                                <SiteConfigForm 
                                    initialSection={
                                        currentTab === 'config' ? 'features' : 
                                        currentTab === 'maintenance' ? 'security' : 
                                        'general'
                                    } 
                                />
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

const ActivityItem = ({ time, event, detail, code }) => (
    <div className="flex gap-6 group">
        <div className="w-px bg-gray-100 h-auto relative">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-black transition-colors"></div>
        </div>
        <div>
            <div className="flex items-center gap-3 mb-1">
                <span className="text-[9px] font-black text-black uppercase tracking-widest">{event}</span>
                <span className="text-[9px] font-black text-gray-300 font-mono tracking-tighter">[{code}]</span>
            </div>
            <p className="text-xs text-gray-500 font-bold leading-relaxed">{detail}</p>
            <p className="text-[9px] text-gray-300 font-bold uppercase mt-1 tracking-widest">{time}</p>
        </div>
    </div>
);

const NotifyItem = ({ icon, title, sub, time }) => (
    <div className="flex items-center gap-4 group cursor-pointer hover:translate-x-1 transition-all">
        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-base grayscale group-hover:grayscale-0 transition-all">{icon}</div>
        <div className="flex-1 min-w-0">
            <h5 className="text-[10px] font-black text-black uppercase tracking-wide">{title}</h5>
            <p className="text-[9px] text-gray-400 font-bold truncate">{sub}</p>
        </div>
        <span className="text-[8px] font-black text-gray-300 uppercase shrink-0">{time}</span>
    </div>
);

const HealthRow = ({ label, status, ping }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className={`w-1 h-1 rounded-full ${status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{label}</span>
        </div>
        {ping && <span className="text-[8px] font-mono font-bold text-gray-300">{ping}</span>}
    </div>
);

export default Dashboard;
