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
        <div className="min-h-screen bg-[#F5F5F7] text-gray-900 font-sans flex text-sm">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-30">
                <h1 className="text-lg font-black text-black">GOD MODE</h1>
                <button
                    onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                    <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-20 transition-transform duration-300 lg:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-xl font-black tracking-tighter text-black">
                        GOD MODE <span className="text-[#0055FF] text-xs align-top">v2.0</span>
                    </h1>
                    <p className="text-gray-500 text-xs mt-1">System Administration</p>
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
                                ? 'bg-[#0055FF] text-white shadow-lg shadow-blue-500/30'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                                }`}
                        >
                            <span className="text-lg">{tab.icon}</span>
                            <span className="font-bold">{tab.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors font-medium"
                    >
                        Exit God Mode
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 bg-[#F5F5F7] p-4 md:p-8 mt-16 lg:mt-0">
                <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                    <h2 className="text-2xl font-bold capitalize text-black">{activeTab}</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-mono text-gray-500">SYSTEM ONLINE</span>
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
