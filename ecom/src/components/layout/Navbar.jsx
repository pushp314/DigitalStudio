import React, { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import CartContext from '../../context/CartContext';
import WishlistContext from '../../context/WishlistContext';
import ConfigContext from '../../context/ConfigContext';
import ConfirmModal from '../ui/ConfirmModal';
import { FEATURES } from '../../config/features';

const AnnouncementCarousel = ({ messages = [] }) => {
    const [index, setIndex] = React.useState(0);

    React.useEffect(() => {
        if (messages.length <= 1) return;
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % messages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [messages.length]);

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {messages.map((msg, i) => (
                <div
                    key={i}
                    className={`absolute inset-0 flex items-center justify-center px-6 transition-all duration-1000 ease-in-out transform ${i === index
                            ? 'translate-y-0 opacity-100'
                            : i < index
                                ? '-translate-y-full opacity-0'
                                : 'translate-y-full opacity-0'
                        }`}
                >
                    <span className="truncate max-w-[90vw]">{msg}</span>
                    {messages.length > 1 && (
                        <div className="ml-4 flex gap-1 items-center opacity-50 shrink-0">
                            {messages.map((_, dotIdx) => (
                                <div
                                    key={dotIdx}
                                    className={`w-1 h-1 rounded-full bg-white transition-all duration-300 ${dotIdx === index ? 'w-3 opacity-100' : 'opacity-40'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const FloatingNavbar = ({ onSearchClick }) => {
    const { user, logout } = useContext(AuthContext);
    const { cartItems } = useContext(CartContext);
    const { wishlistItems } = useContext(WishlistContext);
    const { config } = useContext(ConfigContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            navigate(`/templates?search=${searchQuery}`);
        }
    };

    const navLinks = [
        { name: 'Templates', path: '/templates' },
        ...(config?.features?.docs ? [{ name: 'Docs', path: '/docs' }] : []),
        { name: 'Features', path: '/features' },
        ...(config?.features?.testimonials ? [{ name: 'Testimonials', path: '/testimonials' }] : []),
        ...(config?.features?.subscriptions ? [{ name: 'Memberships', path: '/pricing' }] : []),
        { name: 'FAQ', path: '/faq' },
        { name: 'Contact', path: '/contact' },
        { name: 'Community', path: '/chat' },
    ];

    return (
        <>
            {/* Announcement Bar */}
            {config?.showAnnouncement && config?.announcements?.length > 0 && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-white text-xs font-bold shadow-md tracking-wide h-10 flex items-center justify-center overflow-hidden">
                    <AnnouncementCarousel messages={config.announcements} />
                </div>
            )}

            {/* Navbar */}
            <div className={`fixed left-0 right-0 z-40 flex justify-center px-4 pointer-events-none transition-all duration-300 ${config?.showAnnouncement && config?.announcements?.length > 0 ? 'top-12' : 'top-6'}`}>
                <div className="w-full max-w-[1400px] flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-auto">

                    <nav className="bg-black rounded-full p-2 pl-6 pr-2 flex items-center gap-6 shadow-2xl w-full md:w-auto justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="relative flex items-center justify-center w-8 h-8 bg-primary rounded-full overflow-hidden shrink-0">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" fill="none" />
                                    <rect x="2" y="11" width="20" height="2" fill="white" />
                                    <path d="M12 12V22" stroke="white" strokeWidth="2" />
                                </svg>
                            </div>
                             <span className="text-white font-bold text-xl tracking-tight select-none">
                                 DigitalStudio
                             </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <ul className="hidden lg:flex items-center gap-2">
                            {navLinks.map((item) => (
                                <li key={item.name}>
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `block text-white text-sm font-medium px-5 py-2.5 rounded-full border transition-all duration-200 ${isActive ? 'bg-white/10 border-white/40' : 'border-white/10 hover:border-white/40 hover:bg-white/5'
                                            }`
                                        }
                                    >
                                        {item.name}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>

                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </nav>

                    {/* User Actions */}
                    <div className="hidden md:flex bg-white rounded-full p-2 pr-2 items-center gap-2 shadow-lg border border-gray-100">
                        {/* Search Trigger */}
                        <button 
                            onClick={onSearchClick}
                            className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-all group border border-transparent hover:border-gray-200"
                        >
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-colors">Search...</span>
                            <div className="flex items-center gap-1">
                                <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-400 shadow-sm">
                                    {(window.navigator.platform?.toUpperCase().indexOf('MAC') >= 0 || window.navigator.userAgent?.toUpperCase().indexOf('MAC') >= 0) ? '⌘' : 'Ctrl'}
                                </span>
                                <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-400 shadow-sm">K</span>
                            </div>
                        </button>

                        {/* Cart & Wishlist */}
                        {config?.features?.wishlist && (
                            <Link to="/wishlist" className="relative hidden md:flex w-10 h-10 items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                                <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                {wishlistItems.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {wishlistItems.length}
                                    </span>
                                )}
                            </Link>
                        )}

                        <Link to="/cart" className="relative hidden md:flex w-10 h-10 items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {cartItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {cartItems.length}
                                </span>
                            )}
                        </Link>

                        {/* User Profile / Login */}
                        <div className="hidden md:flex">
                            {user ? (
                                <div className="relative group">
                                    <div className={`p-[1.5px] rounded-full transition-all duration-500 ${user.subscriptionPlan === 'pro' ? 'bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-600 shadow-[0_0_20px_rgba(251,191,36,0.2)] scale-110' : 'bg-gray-100'}`}>
                                        <button className="w-9 h-9 bg-black rounded-full flex items-center justify-center text-white font-black text-xs border border-white/5 relative overflow-hidden group-hover:scale-95 transition-transform">
                                            {user.name.charAt(0).toUpperCase()}
                                            {user.subscriptionPlan === 'pro' && (
                                                <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/10 to-transparent opacity-50"></div>
                                            )}
                                        </button>
                                    </div>
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                                        <Link to="/profile" className="block px-4 py-3 hover:bg-gray-50 transition-colors text-black font-medium border-b">
                                            Profile
                                        </Link>
                                        {user.role === 'admin' && (
                                            <>
                                                <Link to="/admin" className="block px-4 py-3 hover:bg-gray-50 transition-colors text-primary font-medium border-b">
                                                    🛡️ Admin Panel
                                                </Link>
                                                <Link to="/admin/dashboard" className="block px-4 py-3 hover:bg-gray-50 transition-colors text-black font-medium border-b">
                                                    Products Dashboard
                                                </Link>
                                            </>
                                        )}
                                        <button onClick={() => setIsLogoutModalOpen(true)} className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors text-red-600 font-medium">
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all hover:-translate-y-0.5"
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={logout}
                title="Log Out?"
                message="Are you sure you want to sign out of your account? You will need to log in again to access your downloads and settings."
                confirmText="Log Out"
                type="danger"
            />

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className={`fixed left-4 right-4 bg-black/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-30 pointer-events-auto lg:hidden transition-all duration-300 ${config?.showAnnouncement && config?.announcements?.length > 0 ? 'top-32' : 'top-24'}`}>
                    <div className="p-6 space-y-2">
                        {navLinks.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `block px-4 py-3 rounded-xl font-medium transition-all ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`
                                }
                            >
                                {item.name}
                            </NavLink>
                        ))}
                        <div className="pt-4 border-t border-white/10">
                            <Link
                                to="/contact"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-4 py-3 rounded-xl font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all"
                            >
                                Contact
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};


export default FloatingNavbar;
