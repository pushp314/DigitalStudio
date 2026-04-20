import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';
import { formatCurrency } from '../utils/normalizers';

const Cart = () => {
    const { cartItems, removeFromCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const checkoutHandler = () => {
        if (!user) {
            navigate('/login?redirect=cart');
        } else {
            navigate('/checkout');
        }
    };

    const total = cartItems.reduce((acc, item) => {
        return acc + Number(item.price || 0);
    }, 0);

    if (cartItems.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
                <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
                <Link to="/templates" className="bg-primary text-white px-6 py-3 rounded-full font-bold">
                    Browse Templates
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] px-6 py-20 font-sans">
            <div className="max-w-[1000px] mx-auto">
                <h1 className="text-4xl font-black text-black mb-10">Your Cart</h1>

                <div className="flex flex-col lg:flex-row gap-10">

                    {/* Items List */}
                    <div className="flex-grow flex flex-col gap-6">
                        {cartItems.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-6">
                                <img src={item.image} alt={item.title} className="w-24 h-24 object-cover rounded-xl bg-gray-100" />
                                <div className="flex-grow">
                                    <h3 className="text-xl font-bold text-black">{item.title}</h3>
                                    <p className="text-gray-500 text-sm">{item.category}</p>
                                    <h4 className="text-lg font-bold text-primary mt-1">{item.formattedPrice}</h4>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <svg className="w-6 h-6 text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Left Bottom Growth Nudge */}
                    {cartItems.length < 3 && (
                        <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-center justify-between gap-6 animate-in slide-in-from-bottom-4 duration-700">
                           <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">🎁</div>
                               <div>
                                   <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-1">Scale your library</h4>
                                   <p className="text-slate-600 text-sm font-medium">Add {3 - cartItems.length} more item{3 - cartItems.length > 1 ? 's' : ''} to unlock an <span className="font-bold text-black">Automatic 10% Bundle Discount</span> on your entire order.</p>
                               </div>
                           </div>
                           <Link to="/templates" className="px-6 py-3 bg-white border border-blue-100 text-primary font-bold rounded-xl text-sm hover:shadow-md transition-all whitespace-nowrap">
                               Browse More
                           </Link>
                        </div>
                    )}
                </div>

                    {/* Summary Card */}
                    <div className="w-full lg:w-[350px]">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
                            <h2 className="text-2xl font-bold mb-6">Summary</h2>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-bold">{formatCurrency(total)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-500">Tax</span>
                                <span className="font-bold">$0</span>
                            </div>
                            <div className="h-px bg-gray-100 w-full mb-6"></div>
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-xl font-bold">Total</span>
                                <span className="text-2xl font-black text-primary">{formatCurrency(total)}</span>
                            </div>
                            <button
                                onClick={checkoutHandler}
                                className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/20 flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Secure Checkout
                            </button>

                            <div className="mt-6 pt-6 border-t border-gray-50 space-y-4">
                                <div className="flex items-center gap-3 grayscale opacity-40 justify-center">
                                    <img src="https://img.icons8.com/color/48/000000/visa.png" className="h-4" alt="Visa" />
                                    <img src="https://img.icons8.com/color/48/000000/mastercard.png" className="h-4" alt="Mastercard" />
                                    <img src="https://img.icons8.com/color/48/000000/razorpay.png" className="h-4" alt="Razorpay" />
                                </div>
                                <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest justify-center">
                                    <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm3 12H9v-2h6v2zm0-4H9V8h6v2z" /></svg>
                                    Encrypted Transactions
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
    );
};

export default Cart;
