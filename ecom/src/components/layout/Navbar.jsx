import React, { useContext, useMemo, useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
    Compass,
    Heart,
    Home,
    LayoutDashboard,
    LogOut,
    Menu,
    Search,
    Settings,
    ShieldCheck,
    ShoppingCart,
    Terminal,
    User,
    X,
    Zap,
    MessageSquare,
    Bell
} from 'lucide-react';
import AuthContext from '../../context/AuthContext';
import CartContext from '../../context/CartContext';
import WishlistContext from '../../context/WishlistContext';
import ConfigContext from '../../context/ConfigContext';
import api from '../../services/api';
import ConfirmModal from '../ui/ConfirmModal';

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
        <div className="relative h-full w-full overflow-hidden">
            {messages.map((message, messageIndex) => (
                <div
                    key={`${message}-${messageIndex}`}
                    className={`absolute inset-0 flex items-center justify-center px-4 text-center text-[11px] font-medium text-white transition-all duration-500 ${
                        messageIndex === index ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                    }`}
                >
                    <span className="truncate">{message}</span>
                </div>
            ))}
        </div>
    );
};

const navItemClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

const FloatingNavbar = ({ onSearchClick }) => {
    const { user, logout } = useContext(AuthContext);
    const { cartItems } = useContext(CartContext);
    const { wishlistItems } = useContext(WishlistContext);
    const { config } = useContext(ConfigContext);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [unreadChatCount, setUnreadChatCount] = useState(0);

    const fetchUnreadCount = React.useCallback(async () => {
        if (!user) {
            setUnreadChatCount(0);
            return;
        }
        try {
            const data = await api.get('/support/sessions');
            const total = (data || []).reduce((acc, s) => acc + (s.unreadCount || 0), 0);
            setUnreadChatCount(total);
        } catch (err) {}
    }, [user]);

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        
        // Immediate sync listener
        const handleSync = () => fetchUnreadCount();
        window.addEventListener('ds_support_read', handleSync);

        return () => {
            clearInterval(interval);
            window.removeEventListener('ds_support_read', handleSync);
        };
    }, [fetchUnreadCount]);

    const navLinks = useMemo(() => {
        const links = [{ name: 'Templates', path: '/templates' }];
        if (config?.features?.docs) links.push({ name: 'Docs', path: '/docs' });
        if (config?.features?.subscriptions) links.push({ name: 'Pricing', path: '/pricing' });
        links.push({ name: 'FAQ', path: '/faq' });
        return links;
    }, [config?.features?.docs, config?.features?.subscriptions]);

    const showAnnouncement = Boolean(config?.showAnnouncement && config?.announcements?.length > 0);

    return (
        <>
            {showAnnouncement && (
                <div className="fixed left-0 right-0 top-0 z-50 h-10 bg-slate-900">
                    <AnnouncementCarousel messages={config.announcements} />
                </div>
            )}

            <header className={`fixed left-0 right-0 z-40 px-4 ${showAnnouncement ? 'top-12' : 'top-4'}`}>
                <div className="ds-shell">
                    <div className="rounded-2xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur">
                        <div className="flex items-center justify-between gap-4 px-4 py-3">
                            <div className="flex items-center gap-3">
                                <Link to="/" className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                                        <Terminal size={18} strokeWidth={2.25} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold tracking-tight text-slate-900">DigitalStudio</div>
                                        <div className="text-[11px] text-slate-500">Templates, docs, and tools</div>
                                    </div>
                                </Link>

                                <nav className="hidden items-center gap-1 lg:flex">
                                    {navLinks.map((item) => (
                                        <NavLink key={item.path} to={item.path} className={navItemClass}>
                                            {item.name}
                                        </NavLink>
                                    ))}
                                </nav>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={onSearchClick} className="ds-button-ghost hidden md:inline-flex">
                                    <Search size={16} />
                                    Search
                                </button>

                                {config?.features?.wishlist && (
                                    <Link to="/wishlist" className="relative ds-button-ghost hidden md:inline-flex" aria-label="Wishlist">
                                        <Heart size={16} />
                                        {wishlistItems.length > 0 && (
                                            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                                                {wishlistItems.length}
                                            </span>
                                        )}
                                    </Link>
                                )}

                                <Link to="/chat" className="relative ds-button-ghost hidden md:inline-flex" aria-label="Chat">
                                    <MessageSquare size={16} />
                                    {unreadChatCount > 0 && (
                                        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
                                            {unreadChatCount}
                                        </span>
                                    )}
                                </Link>

                                <Link to="/account?tab=notifications" className="relative ds-button-ghost hidden md:inline-flex" aria-label="Notifications">
                                    <Bell size={16} />
                                </Link>

                                <Link to="/cart" className="relative ds-button-ghost hidden md:inline-flex" aria-label="Cart">
                                    <ShoppingCart size={16} />
                                    {cartItems.length > 0 && (
                                        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-semibold text-white">
                                            {cartItems.length}
                                        </span>
                                    )}
                                </Link>

                                {user ? (
                                    <div className="relative hidden md:block">
                                        <button
                                            type="button"
                                            onClick={() => setUserMenuOpen((prev) => !prev)}
                                            className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                            <div className="h-8 w-8 rounded-lg bg-slate-900 overflow-hidden shadow-sm flex-shrink-0">
                                                {user?.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-white">
                                                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="hidden sm:block">
                                                <span className="block text-sm font-medium text-slate-900">{user.name}</span>
                                                <span className="block text-[11px] text-slate-500">@{user.username || 'account'}</span>
                                            </span>
                                        </button>

                                        {userMenuOpen && (
                                            <>
                                                <button
                                                    type="button"
                                                    aria-label="Close menu"
                                                    className="fixed inset-0 z-40 cursor-default"
                                                    onClick={() => setUserMenuOpen(false)}
                                                />
                                                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                                                    <Link
                                                        to="/account"
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                                    >
                                                        <LayoutDashboard size={16} className="text-slate-400" />
                                                        Dashboard
                                                    </Link>
                                                    <Link
                                                        to="/support"
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
                                                    >
                                                        <Zap size={16} className="text-amber-500" />
                                                        Priority Support
                                                    </Link>
                                                    <Link
                                                        to={`/@${user?.username || user?.id}`}
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                                    >
                                                        <User size={16} className="text-slate-400" />
                                                        Public Profile
                                                    </Link>
                                                    <Link
                                                        to="/account?tab=settings"
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                                    >
                                                        <Settings size={16} className="text-slate-400" />
                                                        Settings
                                                    </Link>
                                                    {user.role === 'admin' && (
                                                        <Link
                                                            to="/admin"
                                                            onClick={() => setUserMenuOpen(false)}
                                                            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <ShieldCheck size={16} className="text-blue-500" />
                                                            Admin
                                                        </Link>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setUserMenuOpen(false);
                                                            setIsLogoutModalOpen(true);
                                                        }}
                                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                                                    >
                                                        <LogOut size={16} className="text-rose-500" />
                                                        Log out
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <Link to="/login" className="ds-button-primary hidden md:inline-flex">
                                        Sign in
                                    </Link>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setMobileMenuOpen((prev) => !prev)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 md:hidden"
                                    aria-label="Toggle navigation"
                                >
                                    {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {mobileMenuOpen && (
                        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:hidden">
                            <nav className="flex flex-col gap-1">
                                {navLinks.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={navItemClass}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {item.name}
                                    </NavLink>
                                ))}
                                {config?.features?.wishlist && (
                                    <NavLink to="/wishlist" className={navItemClass} onClick={() => setMobileMenuOpen(false)}>
                                        Wishlist
                                    </NavLink>
                                )}
                                <NavLink to="/cart" className={navItemClass} onClick={() => setMobileMenuOpen(false)}>
                                    Cart
                                </NavLink>
                                {user ? (
                                    <>
                                        <NavLink to="/account" className={navItemClass} onClick={() => setMobileMenuOpen(false)}>
                                            Account
                                        </NavLink>
                                        {user.role === 'admin' && (
                                            <NavLink to="/admin" className={navItemClass} onClick={() => setMobileMenuOpen(false)}>
                                                Admin
                                            </NavLink>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                setIsLogoutModalOpen(true);
                                            }}
                                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                                        >
                                            <LogOut size={16} />
                                            Log out
                                        </button>
                                    </>
                                ) : (
                                    <Link to="/login" className="ds-button-primary mt-2" onClick={() => setMobileMenuOpen(false)}>
                                        Sign in
                                    </Link>
                                )}
                            </nav>
                        </div>
                    )}
                </div>
            </header>

            <div className="fixed inset-x-4 bottom-4 z-[60] md:hidden">
                <div className="mx-auto flex max-w-sm items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-lg">
                    <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 text-[11px] font-medium ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                        <Home size={16} />
                        <span>Home</span>
                    </NavLink>
                    <NavLink to="/templates" className={({ isActive }) => `flex flex-col items-center gap-1 text-[11px] font-medium ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                        <Compass size={16} />
                        <span>Templates</span>
                    </NavLink>
                    <NavLink to="/cart" className={({ isActive }) => `flex flex-col items-center gap-1 text-[11px] font-medium ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                        <div className="relative">
                            <ShoppingCart size={16} />
                            {cartItems.length > 0 && (
                                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-semibold text-white">
                                    {cartItems.length}
                                </span>
                            )}
                        </div>
                        <span>Cart</span>
                    </NavLink>
                    <NavLink to="/chat" className={({ isActive }) => `flex flex-col items-center gap-1 text-[11px] font-medium ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                        <div className="relative">
                            <MessageSquare size={16} />
                            {unreadChatCount > 0 && (
                                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
                                    {unreadChatCount}
                                </span>
                            )}
                        </div>
                        <span>Chat</span>
                    </NavLink>
                    <NavLink to="/account" className={({ isActive }) => `flex flex-col items-center gap-1 text-[11px] font-medium ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                        <User size={16} />
                        <span>Account</span>
                    </NavLink>
                </div>
            </div>

            <ConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={logout}
                title="Log Out?"
                message="Are you sure you want to sign out of your account?"
                confirmText="Log Out"
                type="danger"
            />
        </>
    );
};

export default FloatingNavbar;
