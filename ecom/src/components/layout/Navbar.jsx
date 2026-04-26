import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    LogOut,
    Menu,
    Search,
    Settings,
    ShieldCheck,
    ShoppingCart,
    Terminal,
    X,
    MessageSquare,
    Zap,
    Briefcase,
    ChevronDown,
    ArrowRight,
    Sparkles,
    Code,
    Cpu,
    HelpCircle,
    Package,
    Building2,
    Heart,
    User
} from 'lucide-react';
import AuthContext from '../../context/AuthContext';
import CartContext from '../../context/CartContext';
import ConfigContext from '../../context/ConfigContext';
import WishlistContext from '../../context/WishlistContext';
import api from '../../services/api';
import ConfirmModal from '../ui/ConfirmModal';
import { categoryCanonicalPath } from '../../utils/seo';

// --- Reusable Dropdown Component ---
const NavDropdown = ({ label, items, href }) => {
    const [isOpen, setIsOpen] = useState(false);
    const timeoutRef = useRef(null);
    const dropdownRef = useRef(null);
    const location = useLocation();

    // Close on route change
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    // Accessibility: Close on Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Accessibility: Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMouseEnter = () => {
        if (window.innerWidth >= 1024) {
            clearTimeout(timeoutRef.current);
            setIsOpen(true);
        }
    };

    const handleMouseLeave = () => {
        if (window.innerWidth >= 1024) {
            timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
        }
    };

    return (
        <div 
            ref={dropdownRef}
            className="relative h-full flex items-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="flex items-center">
                {href ? (
                    <Link
                        to={href}
                        className={`flex items-center gap-1 px-3 py-2 text-[13px] font-semibold transition-colors duration-200 outline-none ${
                            isOpen || location.pathname === href ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        {label}
                    </Link>
                ) : (
                    <button
                        type="button"
                        className={`flex items-center gap-1 px-3 py-2 text-[13px] font-semibold transition-colors duration-200 outline-none ${
                            isOpen ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
                        }`}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {label}
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`p-1 transition-transform duration-200 opacity-60 ${isOpen ? 'rotate-180 text-slate-900' : 'text-slate-500'}`}
                >
                    <ChevronDown size={14} />
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-0 top-[calc(100%-8px)] z-[110] mt-2 min-w-[240px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
                    >
                        <div className="grid gap-0.5">
                            {items.map((item, idx) => (
                                <Link
                                    key={idx}
                                    to={item.href}
                                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 group-hover:bg-white group-hover:text-slate-900 transition-colors border border-transparent group-hover:border-slate-100">
                                        <item.icon size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="leading-tight">{item.label}</span>
                                        {item.desc && (
                                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">{item.desc}</span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Navbar = ({ onSearchClick }) => {
    const { user, logout } = useContext(AuthContext);
    const { cartItems } = useContext(CartContext);
    const { config } = useContext(ConfigContext);
    const { wishlistItems } = useContext(WishlistContext);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const userMenuRef = useRef(null);
    const location = useLocation();

    // Fetch unread support chat count
    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (!user) return;
            try {
                const data = await api.get('/support/sessions');
                const total = (data || []).reduce((acc, s) => acc + (s.unreadCount || 0), 0);
                setUnreadChatCount(total);
            } catch {
                setUnreadChatCount(0);
            }
        };
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [user]);

    // Close menus on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
    }, [location.pathname]);

    // Handle click outside for user menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [exploreItems, setExploreItems] = useState([
        { label: 'All Assets', href: '/assets', icon: Package, desc: 'Full database' }
    ]);
    const [expertItems, setExpertItems] = useState([]);
    const [developerItems, setDeveloperItems] = useState([]);

    useEffect(() => {
        const fetchNavData = async () => {
            try {
                const [cats, sIntents, eIntents] = await Promise.all([
                    api.get('/categories'),
                    api.get('/intents/service'),
                    api.get('/intents/expert')
                ]);

                if (Array.isArray(cats)) {
                    setExploreItems([
                        { label: 'All Assets', href: '/assets', icon: Package, desc: 'Full database' },
                        { label: 'Fullstack Projects', href: '/assets/fullstack-projects', icon: Code, desc: 'Source code apps' },
                        ...cats.map(c => ({
                            label: c.name,
                            href: categoryCanonicalPath(c.slug),
                            icon: Zap, // Default icon
                            desc: c.description || 'View apps'
                        }))
                    ]);
                }

                if (Array.isArray(eIntents)) {
                    setExpertItems(eIntents.map(i => ({
                        label: i.name,
                        href: `/expert-help/${i.slug}`,
                        icon: i.slug?.includes('choose') ? ShoppingCart : i.slug?.includes('question') ? HelpCircle : Sparkles,
                        desc: i.subheadline || 'Talk to expert'
                    })));
                }

                if (Array.isArray(sIntents)) {
                    setDeveloperItems(sIntents.map(i => ({
                        label: i.name,
                        href: `/hire-developer/${i.slug}`,
                        icon: i.slug?.includes('build') ? Code : i.slug?.includes('fix') ? Settings : Building2,
                        desc: i.subheadline || 'Hire dev'
                    })));
                }
            } catch (err) {
                console.error("Failed to fetch navigation data:", err);
            }
        };
        fetchNavData();
    }, []);

    return (
        <>
            {/* Header / Navbar Container */}
            <header className="fixed left-0 right-0 top-0 z-[100] w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
                <div className="mx-auto max-w-[1440px]">
                    <div className="flex h-16 items-center justify-between px-6">
                        
                        {/* LEFT: Branding Block */}
                        <div className="flex items-center gap-6">
                            <Link to="/" className="flex items-center shrink-0">
                                <img src="/logo.png" alt="BizCode" className="h-28 w-auto" />
                            </Link>

                            {/* CENTER: Navigation (Desktop) */}
                            <nav className="hidden items-center gap-1 lg:flex">
                                <div className="h-6 w-px bg-slate-200 mx-2" />
                                <NavDropdown label="Explore Assets" items={exploreItems} href="/assets" />
                                <NavLink 
                                    to="/blog" 
                                    className={({isActive}) => `px-3 py-2 text-[13px] font-semibold transition-colors ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                                >
                                    Blog
                                </NavLink>
                                <NavLink 
                                    to="/docs" 
                                    className={({isActive}) => `px-3 py-2 text-[13px] font-semibold transition-colors ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                                >
                                    Docs
                                </NavLink>
                                <NavDropdown label="Talk to Expert" items={expertItems} href="/support" />
                                <NavDropdown label="Hire Developer" items={developerItems} href="/hire-developer" />
                                <NavLink 
                                    to="/sell-your-project" 
                                    className={({isActive}) => `px-3 py-2 text-[13px] font-semibold transition-colors ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                                >
                                    Sell Project
                                </NavLink>
                            </nav>
                        </div>

                        {/* RIGHT: Actions & User Meta */}
                        <div className="flex items-center gap-3">
                            <div className="hidden lg:flex items-center gap-1">
                                <button 
                                    onClick={onSearchClick}
                                    className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50"
                                    title="Search"
                                >
                                    <Search size={18} />
                                </button>
                                <NavLink 
                                    to="/pricing" 
                                    className={({isActive}) => `px-3 py-2 text-[13px] font-semibold transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-900'}`}
                                >
                                    Pricing
                                </NavLink>
                                <NavLink 
                                    to="/wishlist" 
                                    className={({isActive}) => `relative p-2 transition-colors rounded-lg hover:bg-slate-50 ${isActive ? 'text-rose-600' : 'text-slate-400 hover:text-slate-900'}`}
                                    title="Wishlist"
                                >
                                    <Heart size={18} fill={location.pathname === '/wishlist' ? 'currentColor' : 'none'} />
                                    {wishlistItems.length > 0 && (
                                        <span className="absolute right-1 top-1 flex h-3 w-3 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
                                            {wishlistItems.length}
                                        </span>
                                    )}
                                </NavLink>
                            </div>

                            <div className="h-4 w-px bg-slate-200 mx-1 hidden md:block" />

                            {/* Cart Icon */}
                            <Link 
                                to="/cart" 
                                className={`relative p-2 transition-colors rounded-lg hover:bg-slate-50 ${location.pathname === '/cart' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                                title="Checkout Cart"
                            >
                                <ShoppingCart size={18} />
                                {cartItems.length > 0 && (
                                    <span className="absolute right-0 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold text-white shadow-sm">
                                        {cartItems.length}
                                    </span>
                                )}
                            </Link>

                            <Link 
                                to="/custom-request" 
                                className="hidden md:flex h-10 items-center px-5 bg-slate-900 text-white rounded-xl text-[12px] font-bold transition-all hover:bg-slate-800 active:scale-95 shadow-sm shadow-slate-900/10"
                            >
                                Request Custom Build
                            </Link>

                            {/* User Profile / Login */}
                            {user ? (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 border border-slate-200 overflow-hidden hover:ring-2 hover:ring-slate-100 transition-all focus:outline-none"
                                        aria-label="User account menu"
                                    >
                                        {user?.avatarUrl ? (
                                            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-slate-400 bg-slate-50">
                                                {user.name?.charAt(0).toUpperCase() || <User size={14} />}
                                            </div>
                                        )}
                                        {unreadChatCount > 0 && (
                                            <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-white" />
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {userMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                                className="absolute right-0 top-[calc(100%+8px)] z-[120] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl"
                                            >
                                                <div className="px-4 py-3 border-b border-slate-50 mb-1">
                                                    <p className="text-xs font-bold text-slate-900 truncate">{user.name || 'Member'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate uppercase tracking-widest italic">{user.role || 'Member'} Access</p>
                                                </div>
                                                <div className="grid gap-0.5">
                                                    <Link to="/account" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                                        <LayoutDashboard size={14} /> Dashboard
                                                    </Link>
                                                    <Link to="/account?tab=orders" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                                        <Package size={14} /> My Products
                                                    </Link>
                                                    <Link to="/support" className="flex items-center justify-between rounded-xl px-4 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group">
                                                        <div className="flex items-center gap-3">
                                                            <MessageSquare size={14} /> Support Inbox
                                                        </div>
                                                        {unreadChatCount > 0 && (
                                                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                                        )}
                                                    </Link>
                                                    <Link to="/wishlist" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                                        <Heart size={14} /> Wishlist
                                                    </Link>
                                                    <Link to="/account?tab=settings" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                                                        <Settings size={14} /> Settings
                                                    </Link>
                                                    {user.role === 'admin' && (
                                                        <Link to="/admin" className="flex items-center gap-3 rounded-xl px-4 py-2.5 bg-slate-900 text-white mt-1 hover:bg-slate-800 transition-colors">
                                                            <ShieldCheck size={14} /> Admin Dashboard
                                                        </Link>
                                                    )}
                                                    <div className="h-px bg-slate-50 my-1 mx-2" />
                                                    <button 
                                                        onClick={() => { setIsLogoutModalOpen(true); setUserMenuOpen(false); }}
                                                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                                                    >
                                                        <LogOut size={14} /> Sign Out
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <Link 
                                    to="/login" 
                                    className="px-5 py-2 text-[13px] font-semibold text-slate-900 hover:text-slate-600 transition-colors"
                                >
                                    Login
                                </Link>
                            )}

                            {/* Mobile Menu Trigger */}
                            <button 
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
                                aria-label="Toggle mobile menu"
                            >
                                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="w-full overflow-hidden border-t border-slate-200 bg-white lg:hidden shadow-lg overflow-y-auto max-h-[calc(100vh-64px)]"
                        >
                            <div className="flex flex-col p-4 gap-1">
                                <Link to="/assets" className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 text-[14px] font-bold text-slate-900">Explore Assets <ArrowRight size={16} /></Link>
                                <Link to="/blog" className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 text-[14px] font-bold text-slate-900">Blog <ArrowRight size={16} /></Link>
                                <Link to="/docs" className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 text-[14px] font-bold text-slate-900">Docs <ArrowRight size={16} /></Link>
                                <Link to="/support" className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 text-[14px] font-bold text-slate-900">
                                    <div className="flex items-center gap-2">
                                        Talk to Expert
                                        {unreadChatCount > 0 && <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
                                    </div>
                                    <ArrowRight size={16} />
                                </Link>
                                <Link to="/hire-developer" className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 text-[14px] font-bold text-slate-900 font-bold">Hire Developer <ArrowRight size={16} /></Link>
                                <Link to="/sell-your-project" className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 text-[14px] font-bold text-slate-900">Sell Project <ArrowRight size={16} /></Link>
                                <div className="h-px bg-slate-100 my-2 mx-4" />
                                <Link to="/pricing" className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 text-[14px] font-bold text-slate-900">Pricing <ArrowRight size={16} /></Link>
                                <Link to="/wishlist" className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 text-[14px] font-bold text-slate-900">Wishlist <ArrowRight size={16} /></Link>
                                {!user && (
                                    <Link to="/login" className="block w-full mt-4 p-4 bg-slate-900 text-white rounded-xl text-center text-[14px] font-bold shadow-md">Login to Account</Link>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Logout Confirmation */}
            <ConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={logout}
                title="Sign Out?"
                message="Are you sure you want to end your active session on BizCode?"
                confirmText="Sign Out"
                type="danger"
            />
        </>
    );
};

export default Navbar;
