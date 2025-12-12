import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import orderService from '../services/orderService';
import { useToast } from '../context/ToastContext';

const Profile = () => {
    const { user, logout } = useContext(AuthContext);
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else {
            const fetchOrders = async () => {
                try {
                    const data = await orderService.getMyOrders();
                    setOrders(data);
                } catch (error) {
                    addToast("Failed to fetch orders", "error");
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            };
            fetchOrders();
        }
    }, [user, navigate, addToast]);

    const handleLogout = () => {
        logout();
        addToast("Logged out successfully", "success");
        navigate('/');
    };

    if (!user) return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '⚡' },
        { id: 'orders', label: 'My Products', icon: '📦' },
        { id: 'subscription', label: 'Subscription', icon: '💎' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
        <div className="min-h-screen bg-[#F5F5F7] pt-32 pb-20 px-4 md:px-8 font-sans">
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-32">
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-20 h-20 bg-gradient-to-br from-[#0055FF] to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-blue-500/30">
                                {user.avatar ? <img src={user.avatar} alt="User" className="w-full h-full object-cover rounded-full" /> : user.name.charAt(0)}
                            </div>
                            <h2 className="text-xl font-black text-black">{user.name}</h2>
                            <p className="text-gray-500 text-sm">{user.email}</p>
                            <span className="mt-2 text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                                {user.subscription_plan || 'Free Plan'}
                            </span>
                        </div>

                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === tab.id
                                            ? 'bg-black text-white shadow-lg'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                                        }`}
                                >
                                    <span>{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm text-red-500 hover:bg-red-50"
                            >
                                <span>🚪</span>
                                Logout
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 min-h-[500px]">

                        <h1 className="text-3xl font-black text-black mb-8 capitalize">{activeTab.replace('-', ' ')}</h1>

                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <StatCard label="Total Orders" value={orders.length} color="blue" />
                                    <StatCard label="Member Since" value={new Date(user.createdAt).toLocaleDateString()} color="green" />
                                    <StatCard label="Status" value="Active" color="purple" />
                                </div>
                                <div className="bg-gradient-to-r from-zinc-900 to-black rounded-2xl p-8 text-white relative overflow-hidden">
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-bold mb-2">Upgrade to Pro</h3>
                                        <p className="text-zinc-400 mb-6 max-w-md">Get unlimited access to premium templates, faster downloads, and priority support.</p>
                                        <button onClick={() => setActiveTab('subscription')} className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors">
                                            View Plans
                                        </button>
                                    </div>
                                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#0055FF]/20 to-transparent"></div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="space-y-4">
                                {loading ? (
                                    <p>Loading...</p>
                                ) : orders.length === 0 ? (
                                    <div className="text-center py-20">
                                        <div className="text-4xl mb-4">🛍️</div>
                                        <h3 className="text-xl font-bold text-black mb-2">No orders yet</h3>
                                        <p className="text-gray-500 mb-6">Start browsing our collection of premium templates.</p>
                                        <button onClick={() => navigate('/templates')} className="bg-[#0055FF] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all">
                                            Browse Market
                                        </button>
                                    </div>
                                ) : (
                                    orders.map(order => (
                                        <div key={order._id} className="border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
                                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                                <div className="flex items-center gap-4 w-full md:w-auto">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                                                        <img src={order.orderItems[0].image} alt={order.orderItems[0].title} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-black text-lg">{order.orderItems[0].title}</h4>
                                                        <p className="text-gray-500 text-sm">Order #{order._id.substring(0, 8)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                                    <span className="font-bold text-black text-lg">${order.totalPrice}</span>
                                                    <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors">Download</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'subscription' && (
                            <div className="text-center py-10">
                                <h3 className="text-xl font-bold mb-6">Manage Your Plan</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <PlanCard title="Free" price="$0" features={["Basic Templates", "Community Support"]} current={user.subscription_plan === 'free'} />
                                    <PlanCard title="Pro" price="$29/mo" features={["All Templates", "Premium Docs", "Priority Support"]} current={user.subscription_plan === 'pro'} recommended />
                                    <PlanCard title="Enterprise" price="$99/mo" features={["Custom Solutions", "API Access", "Dedicated Agent"]} current={user.subscription_plan === 'enterprise'} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="max-w-md">
                                <h3 className="font-bold text-lg mb-4">Account Settings</h3>
                                <form className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
                                        <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-blue-500" defaultValue={user.name} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                        <input type="email" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-blue-500" defaultValue={user.email} disabled />
                                    </div>
                                    <button className="bg-black text-white px-6 py-3 rounded-full font-bold">Save Changes</button>
                                </form>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, color }) => (
    <div className={`p-6 rounded-2xl bg-${color}-50 border border-${color}-100`}>
        <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{label}</div>
        <div className={`text-3xl font-black text-${color}-600`}>{value}</div>
    </div>
);

const PlanCard = ({ title, price, features, current, recommended }) => (
    <div className={`p-6 rounded-2xl border ${current ? 'border-2 border-blue-500 bg-blue-50' : 'border-gray-200'} ${recommended ? 'shadow-lg relative' : ''}`}>
        {recommended && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#0055FF] text-white text-xs font-bold px-3 py-1 rounded-full">POPULAR</div>}
        <h4 className="text-xl font-bold mb-2">{title}</h4>
        <div className="text-2xl font-black mb-4">{price}</div>
        <ul className="space-y-2 mb-6">
            {features.map((f, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-green-500">✓</span> {f}
                </li>
            ))}
        </ul>
        <button className={`w-full py-2 rounded-lg font-bold ${current ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'}`}>
            {current ? 'Current Plan' : 'Upgrade'}
        </button>
    </div>
);

export default Profile;
