import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import CartContext from '../../context/CartContext';
import WishlistContext from '../../context/WishlistContext';

const BottomNav = () => {
    const { user } = useContext(AuthContext);
    const { cartItems } = useContext(CartContext);
    const { wishlistItems } = useContext(WishlistContext);

    return (
        <nav className="fixed bottom-6 left-6 right-6 z-50 md:hidden">
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-2 shadow-2xl flex items-center justify-around relative">
                
                {/* Home */}
                <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
                </NavLink>

                {/* Apps */}
                <NavLink to="/apps" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Apps</span>
                </NavLink>

                {/* Wishlist */}
                <NavLink to="/wishlist" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-2xl transition-all relative ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Saved</span>
                    {wishlistItems.length > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-black">
                            {wishlistItems.length}
                        </span>
                    )}
                </NavLink>

                {/* Cart */}
                <NavLink to="/cart" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-2xl transition-all relative ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Cart</span>
                    {cartItems.length > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-black">
                            {cartItems.length}
                        </span>
                    )}
                </NavLink>

                {/* Profile */}
                <NavLink to="/account" className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                    <div className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center border ${user ? 'border-primary bg-primary/20' : 'border-gray-500 bg-gray-500/20'}`}>
                        {user ? (
                            <span className="text-[10px] font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Me</span>
                </NavLink>

            </div>
        </nav>
    );
};

export default BottomNav;
