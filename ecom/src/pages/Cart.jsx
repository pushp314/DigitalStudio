import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';
import orderService from '../services/orderService';
import { useToast } from '../context/ToastContext';

const Cart = () => {
    const { cartItems, removeFromCart, clearCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const { success, error } = useToast();

    const checkoutHandler = () => {
        if (!user) {
            navigate('/login?redirect=cart');
        } else {
            navigate('/checkout');
        }
    };

    const total = cartItems.reduce((acc, item) => {
        // Handle price strings like "$39"
        const price = Number(item.price.replace(/[^0-9.-]+/g, ""));
        return acc + price;
    }, 0);

    if (cartItems.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
                <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
                <Link to="/templates" className="bg-[#0055FF] text-white px-6 py-3 rounded-full font-bold">
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
                            <div key={item._id || item.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-6">
                                <img src={item.image} alt={item.title} className="w-24 h-24 object-cover rounded-xl bg-gray-100" />
                                <div className="flex-grow">
                                    <h3 className="text-xl font-bold text-black">{item.title}</h3>
                                    <p className="text-gray-500 text-sm">{item.category}</p>
                                    <h4 className="text-lg font-bold text-[#0055FF] mt-1">{item.price}</h4>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item._id || item.id)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <svg className="w-6 h-6 text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Summary Card */}
                    <div className="w-full lg:w-[350px]">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
                            <h2 className="text-2xl font-bold mb-6">Summary</h2>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-bold">${total}</span>
                            </div>
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-500">Tax</span>
                                <span className="font-bold">$0</span>
                            </div>
                            <div className="h-px bg-gray-100 w-full mb-6"></div>
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-xl font-bold">Total</span>
                                <span className="text-2xl font-black text-[#0055FF]">${total}</span>
                            </div>
                            <button
                                onClick={checkoutHandler}
                                className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/20"
                            >
                                Checkout
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Cart;
