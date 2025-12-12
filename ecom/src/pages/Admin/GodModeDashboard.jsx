import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Analytics from '../../pages/GodMode/Analytics';
import SiteConfigForm from '../../components/admin/SiteConfigForm';
import ProductList from '../../components/admin/ProductList';
import UserList from '../../components/admin/UserList';
import DocsManager from '../../components/admin/DocsManager';

const GodModeDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const tabs = [
        { id: 'dashboard', label: 'Overview', icon: '📊' },
        { id: 'config', label: 'Site Customization', icon: '🎨' },
        { id: 'products', label: 'Products', icon: '📦' },
        { id: 'docs', label: 'Premium Docs', icon: '📄' },
        { id: 'users', label: 'Users & Sales', icon: '👥' },
    ];

    return (
        <div className="min-h-screen bg-black text-white font-sans flex text-sm">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between z-30">
                <h1 className="text-lg font-black">GOD MODE</h1>
                <button
                    onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col fixed h-full z-20 transition-transform duration-300 lg:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-zinc-800">
                    <h1 className="text-xl font-black tracking-tighter text-white">
                        GOD MODE <span className="text-[#0055FF] text-xs align-top">v2.0</span>
                    </h1>
                    <p className="text-zinc-500 text-xs mt-1">System Administration</p>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setMobileSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === tab.id
                                ? 'bg-[#0055FF] text-white shadow-[0_0_20px_rgba(0,85,255,0.3)]'
                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                }`}
                        >
                            <span className="text-lg">{tab.icon}</span>
                            <span className="font-bold">{tab.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors"
                    >
                        Exit God Mode
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 bg-black p-4 md:p-8 mt-16 lg:mt-0">
                <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                    <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-mono text-zinc-400">SYSTEM ONLINE</span>
                        </div>
                    </div>
                </header>

                <div className="animate-fade-in">
                    {activeTab === 'dashboard' && <Analytics />}
                    {activeTab === 'config' && <SiteConfigForm />}
                    {activeTab === 'products' && <ProductList />}
                    {activeTab === 'docs' && <DocsManager />}
                    {activeTab === 'users' && <UserList />}
                </div>
            </main>

            {/* Mobile Sidebar Overlay */}
            {mobileSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-10"
                    onClick={() => setMobileSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
};

export default GodModeDashboard;
