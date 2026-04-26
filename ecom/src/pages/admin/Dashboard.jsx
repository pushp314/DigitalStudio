import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import analyticsService from '../../services/analyticsService';
import { formatCurrency } from '../../utils/normalizers';
import { 
    BarChart3, 
    Package, 
    ShoppingCart, 
    Key, 
    Megaphone, 
    BookOpen, 
    Star, 
    Layout, 
    Users, 
    Mail, 
    Settings as SettingsIcon,
    Shield,
    Database,
    Search,
    Bell,
    ExternalLink,
    Zap,
    Fingerprint,
    Activity,
    MessageSquare
} from 'lucide-react';

import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';

// Specialized Sub-Components
import TemplatesManager from '../../components/admin/TemplatesManager';
import OrderList from '../../components/admin/OrderList';
import DocsManager from '../../components/admin/DocsManager';
import UserList from '../../components/admin/UserList';
import SiteConfigForm from '../../components/admin/SiteConfigForm';
import TestimonialManager from '../../components/admin/TestimonialManager';
import Marketing from './Marketing';
import ShowcaseManager from '../../components/admin/ShowcaseManager';
import LicenseManager from '../../components/admin/LicenseManager';
import SubscriptionManager from '../../components/admin/SubscriptionManager';
import CategoryManager from '../../components/admin/CategoryManager';
import AdminSearchPalette from '../../components/admin/AdminSearchPalette';
import ContactManager from '../../components/admin/ContactManager';
import IdentityManager from '../../components/admin/IdentityManager';
import EliteAdminManager from '../../components/admin/EliteAdminManager';
import ReviewManager from '../../components/admin/ReviewManager';
import BlogManager from '../../components/admin/BlogManager';
import { Layers } from 'lucide-react';

const Dashboard = ({ defaultTab }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isNotifyOpen, setIsNotifyOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Map URL path to active tab
    const currentTab = useMemo(() => {
        if (defaultTab) return defaultTab;
        const path = location.pathname;
        const routes = [
            'analytics', 'templates', 'architecture', 'orders', 'licenses', 'docs', 
            'marketing', 'testimonials', 'showcase', 'settings', 
            'config', 'maintenance', 'users', 'identity', 
            'subscriptions', 'messages', 'elite', 'blog'
        ];
        return routes.find(tab => path.includes(`/admin/${tab}`)) || 'analytics';
    }, [location.pathname, defaultTab]);

    const setActiveTab = (tabId) => {
        navigate(`/admin/${tabId}`);
        setSidebarOpen(false);
    };

    const { data: analytics } = useQuery({
        queryKey: ['admin-analytics-metrics'],
        queryFn: () => analyticsService.getAnalyticsData(),
        refetchInterval: 30000,
    });

    const menuItems = [
        { id: 'analytics', label: 'Overview', icon: <BarChart3 size={18} /> },
        { id: 'templates', label: 'Products', icon: <Package size={18} /> },
        { id: 'architecture', label: 'Categories', icon: <Layers size={18} /> },
        { id: 'orders', label: 'Orders', icon: <ShoppingCart size={18} /> },
        { id: 'users', label: 'Users', icon: <Users size={18} /> },
        { id: 'identity', label: 'Profiles', icon: <Fingerprint size={18} /> },
        { id: 'licenses', label: 'Licenses', icon: <Key size={18} /> },
        { id: 'subscriptions', label: 'Subscriptions', icon: <Zap size={18} /> },
        { id: 'marketing', label: 'Marketing', icon: <Megaphone size={18} /> },
        { id: 'config', label: 'Site Config', icon: <Layout size={18} /> },
        { id: 'docs', label: 'Documentation', icon: <BookOpen size={18} /> },
        { id: 'blog', label: 'Blog', icon: <Megaphone size={18} /> },
        { id: 'testimonials', label: 'Reviews', icon: <Star size={18} /> },
        { id: 'messages', label: 'Support', icon: <Mail size={18} /> },
        { id: 'elite', label: 'Expert Help', icon: <MessageSquare size={18} /> },
        { id: 'maintenance', label: 'Security', icon: <Shield size={18} /> },
        { id: 'settings', label: 'Settings', icon: <SettingsIcon size={18} /> },
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
        <div className="min-h-screen bg-[#fafafa] font-sans antialiased text-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            <AdminSearchPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            <div className="flex h-screen overflow-hidden relative">
                
                {/* Enterprise Sidebar - Minimalism */}
                <aside className={`fixed inset-y-0 left-0 z-[60] w-64 bg-white border-r border-slate-200 flex flex-col pt-8 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex items-center justify-between px-6 mb-10">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center font-bold text-white text-sm shrink-0">B</div>
                            <div className="min-w-0">
                                <h1 className="text-xs font-bold text-slate-900 uppercase tracking-widest truncate">BizCode Admin</h1>
                                <p className="text-[10px] text-slate-400 font-medium">Enterprise Suite V4.0</p>
                            </div>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-slate-900">
                            <ExternalLink size={18} className="rotate-180" />
                        </button>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-3 space-y-0.5 custom-scrollbar pb-8">
                        {menuItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                                    currentTab === item.id 
                                    ? 'bg-slate-100 text-slate-900 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <span className={`${currentTab === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>{item.icon}</span>
                                <span className="truncate">{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-slate-100 mt-auto bg-slate-50/50">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-[10px] shrink-0 border border-white">A</div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-900 truncate mb-0.5">Administrator</p>
                                <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest">Main Admin Account</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Sidebar Overlay */}
                {sidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[50] lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Content Deck */}
                <main className="flex-1 bg-white overflow-y-auto custom-scrollbar relative flex flex-col">
                    
                    {/* Header Command Bar */}
                    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-8 flex items-center justify-between shrink-0">
                         <div className="flex items-center gap-3 sm:gap-6">
                            <button 
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900"
                            >
                                <Activity size={20} />
                            </button>
                            <h2 className="text-sm font-bold text-slate-900 capitalize truncate max-w-[100px] sm:max-w-none">{currentTab}</h2>
                            <div className="hidden sm:block h-4 w-px bg-slate-200"></div>
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live_v4.0.2</span>
                            </div>
                         </div>

                         <div className="flex items-center gap-2 sm:gap-4">
                            <button onClick={() => setIsSearchOpen(true)} className="flex items-center gap-2 sm:gap-10 px-3 sm:px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg group transition-all">
                                <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-600">
                                    <Search size={14} />
                                    <span className="text-[11px] font-medium hidden sm:inline">Quick search...</span>
                                </div>
                                <span className="text-[10px] text-slate-300 font-bold hidden sm:inline">⌘K</span>
                            </button>

                            <div className="relative">
                                <button onClick={() => setIsNotifyOpen(!isNotifyOpen)} className="w-9 h-9 sm:w-10 sm:h-10 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all group">
                                    <Bell size={18} />
                                    <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></div>
                                </button>
                                {isNotifyOpen && (
                                    <div className="absolute top-12 right-0 w-[calc(100vw-32px)] sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 sm:p-6 z-50 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Activity</h4>
                                            <button className="text-[9px] font-bold text-blue-600 hover:underline">Clear all</button>
                                        </div>
                                        <div className="space-y-4">
                                            <NotifyItem icon={<ShoppingCart size={14} />} title="New Acquisition" sub={`Sales pulse: +3%`} time="12m" />
                                            <NotifyItem icon={<Activity size={14} />} title="System Sync" sub="GitHub webhooks updated" time="1h" />
                                        </div>
                                    </div>
                                )}
                            </div>
                         </div>
                    </header>

                    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500 flex-1">
                        {currentTab === 'analytics' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                                    <AdminStatCard label="Total Revenue" value={formatCurrency(analytics?.revenueVelocity?.reduce((acc, curr) => acc + curr.revenue, 0) || 0)} change="+12.5%" sub="Last 7 days" icon={<Database size={18} />} color="text-blue-600" />
                                    <AdminStatCard label="Conversion Rate" value={`${(analytics?.conversionRate || 0).toFixed(1)}%`} change="-0.4%" sub="Live conversion" icon={<Zap size={18} />} color="text-amber-500" />
                                    <AdminStatCard label="Total Users" value={analytics?.totalUsers || 0} change="+48" sub="Lifetime growth" icon={<Users size={18} />} color="text-emerald-500" />
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
                                    <div className="xl:col-span-2 bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-10">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Revenue Trends</h3>
                                            <button className="text-[10px] font-bold text-blue-600 flex items-center gap-1">View Full Report <ExternalLink size={10} /></button>
                                        </div>
                                        <div className="h-[250px] sm:h-[300px] w-full">
                                            {analytics?.revenueVelocity ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={analytics.revenueVelocity}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis 
                                                            dataKey="date" 
                                                            axisLine={false} 
                                                            tickLine={false} 
                                                            tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                                                            tickFormatter={(str) => {
                                                                const date = new Date(str);
                                                                return date.toLocaleDateString('en-US', { weekday: 'short' });
                                                            }}
                                                            dy={10}
                                                        />
                                                        <YAxis 
                                                            axisLine={false} 
                                                            tickLine={false} 
                                                            tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                                                            tickFormatter={(val) => `₹${val}`}
                                                        />
                                                        <Tooltip 
                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                                            labelStyle={{ fontSize: '10px', fontWeight: 800, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                                            itemStyle={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}
                                                            formatter={(value) => [`₹${value}`, 'Revenue']}
                                                        />
                                                        <Line 
                                                            type="monotone" 
                                                            dataKey="revenue" 
                                                            stroke="#0f172a" 
                                                            strokeWidth={3} 
                                                            dot={{ r: 4, fill: '#0f172a', strokeWidth: 2, stroke: '#fff' }}
                                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                                            animationDuration={1500}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="flex items-center justify-center h-full bg-slate-50 rounded-xl border border-slate-100 group w-full">
                                                    <p className="text-xs font-medium text-slate-400 group-hover:text-slate-600 transition-colors">Analyzing revenue distribution...</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 sm:mb-8">Segment performance</h3>
                                        <div className="space-y-6">
                                            {analytics?.topCategories?.map((cat, idx) => (
                                                <div key={idx} className="flex justify-between items-center group">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-slate-900 truncate">{cat.category}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">{cat.count} units sold</p>
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        <p className="text-sm font-bold text-slate-900">{formatCurrency(cat.revenue)}</p>
                                                        <div className="w-20 sm:w-24 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                            <div className="h-full bg-slate-900 transition-all duration-1000" style={{ width: `${(cat.revenue / (analytics.topCategories[0].revenue || 1) * 100)}%` }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="min-h-[400px]">
                            {currentTab === 'templates' && <TemplatesManager />}
                            {currentTab === 'architecture' && <CategoryManager />}
                            {currentTab === 'orders' && <OrderList />}
                            {currentTab === 'licenses' && <LicenseManager />}
                            {currentTab === 'marketing' && <Marketing />}
                            {currentTab === 'docs' && <DocsManager />}
                            {currentTab === 'users' && <UserList />}
                            {currentTab === 'identity' && <IdentityManager />}
                            {currentTab === 'testimonials' && <ReviewManager />}
                            {currentTab === 'showcase' && <ShowcaseManager />}
                            {currentTab === 'subscriptions' && <SubscriptionManager />}
                            {currentTab === 'messages' && <ContactManager />}
                            {currentTab === 'elite' && <EliteAdminManager />}
                            {currentTab === 'blog' && <BlogManager />}
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

const AdminStatCard = ({ label, value, change, sub, icon, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-lg bg-slate-50 border border-slate-100 ${color}`}>{icon}</div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{change}</span>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 mb-1">{value}</h3>
        <p className="text-[10px] text-slate-300 font-medium">{sub}</p>
    </div>
);

const NotifyItem = ({ icon, title, sub, time }) => (
    <div className="flex gap-4 group cursor-pointer">
        <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
            <h5 className="text-[11px] font-bold text-slate-900 mb-0.5">{title}</h5>
            <p className="text-[10px] text-slate-500 truncate">{sub}</p>
        </div>
        <span className="text-[10px] text-slate-300 font-medium shrink-0">{time}</span>
    </div>
);

export default Dashboard;
