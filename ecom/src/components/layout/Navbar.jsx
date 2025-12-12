import React, { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import CartContext from '../../context/CartContext';
import WishlistContext from '../../context/WishlistContext';
import ConfigContext from '../../context/ConfigContext';
import LoginModal from '../auth/LoginModal';

const FloatingNavbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { cartItems } = useContext(CartContext);
    const { wishlistItems } = useContext(WishlistContext);
    const { config } = useContext(ConfigContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            navigate(`/templates?search=${searchQuery}`);
        }
    };

    const navLinks = [
        { name: 'Templates', path: '/templates' },
        { name: 'Docs', path: '/docs' },
        { name: 'Features', path: '/features' },
        { name: 'Testimonials', path: '/testimonials' },
        { name: 'FAQ', path: '/faq' }
    ];

    return (
        <>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

            {/* Announcement Bar */}
            {config?.showAnnouncement && config?.announcementMessage && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-[#0055FF] text-white text-xs font-bold text-center py-2 px-4 shadow-md tracking-wide">
                    {config.announcementMessage}
                </div>
            )}

            {/* Navbar */}
            <div className={`fixed left-0 right-0 z-40 flex justify-center px-4 pointer-events-none transition-all duration-300 ${config?.showAnnouncement && config?.announcementMessage ? 'top-12' : 'top-6'}`}>
                <div className="w-full max-w-[1400px] flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-auto">

                    <nav className="bg-black rounded-full p-2 pl-6 pr-2 flex items-center gap-6 shadow-2xl w-full md:w-auto justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="relative flex items-center justify-center w-8 h-8 bg-[#0055FF] rounded-full overflow-hidden shrink-0">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" fill="none" />
                                    <rect x="2" y="11" width="20" height="2" fill="white" />
                                    <path d="M12 12V22" stroke="white" strokeWidth="2" />
                                </svg>
                            </div>
                            <span className="text-white font-bold text-xl tracking-tight select-none">
                                CodeStudio
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
                    <div className="bg-white rounded-full p-2 pr-2 flex items-center gap-2 shadow-lg border border-gray-100">
                        {/* Search */}
                        <div className="hidden md:flex items-center gap-2 px-4 bg-gray-50 rounded-full">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-transparent border-none outline-none text-sm w-24 lg:w-32 placeholder-gray-400"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>

                        {/* Cart & Wishlist */}
                        <Link to="/wishlist" className="relative w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {wishlistItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {wishlistItems.length}
                                </span>
                            )}
                        </Link>

                        <Link to="/cart" className="relative w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {cartItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0055FF] text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {cartItems.length}
                                </span>
                            )}
                        </Link>

                        {/* User Profile / Login */}
                        {user ? (
                            <div className="relative group">
                                <button className="w-10 h-10 bg-gradient-to-br from-[#0055FF] to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
                                    {user.name.charAt(0).toUpperCase()}
                                </button>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                                    <Link to="/profile" className="block px-4 py-3 hover:bg-gray-50 transition-colors text-black font-medium border-b">
                                        Profile
                                    </Link>
                                    {user.role === 'admin' && (
                                        <>
                                            <Link to="/admin/dashboard" className="block px-4 py-3 hover:bg-gray-50 transition-colors text-black font-medium border-b">
                                                Admin Dashboard
                                            </Link>
                                            <Link to="/godmode" className="block px-4 py-3 hover:bg-gray-50 transition-colors text-purple-600 font-medium border-b">
                                                🔐 God Mode
                                            </Link>
                                        </>
                                    )}
                                    <button onClick={logout} className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors text-red-600 font-medium">
                                        Logout
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsLoginModalOpen(true)}
                                className="bg-[#0055FF] text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors"
                            >
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className={`fixed left-4 right-4 bg-black/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-30 pointer-events-auto lg:hidden transition-all duration-300 ${config?.showAnnouncement && config?.announcementMessage ? 'top-32' : 'top-24'}`}>
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