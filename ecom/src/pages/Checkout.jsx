import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';
import orderService from '../services/orderService';
import { useToast } from '../context/ToastContext';

const Checkout = () => {
    const { cartItems, clearCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const { success, error } = useToast();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        address: '',
        city: '',
        postalCode: '',
        country: '',
        cardName: '',
        cardNumber: '',
        expDate: '',
        cvc: ''
    });

    useEffect(() => {
        if (!user) {
            navigate('/login?redirect=checkout');
        }
        if (cartItems.length === 0) {
            navigate('/cart');
        }
    }, [user, cartItems, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const total = cartItems.reduce((acc, item) => {
        const price = Number(item.price.replace(/[^0-9.-]+/g, ""));
        return acc + price;
    }, 0);

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);

        const orderItems = cartItems.map(item => ({
            product: item._id || item.id,
            title: item.title,
            image: item.image,
            price: item.price,
            qty: 1
        }));

        try {
            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            await orderService.create({
                orderItems,
                paymentMethod: 'Credit Card',
                totalPrice: total,
                shippingAddress: {
                    address: formData.address,
                    city: formData.city,
                    postalCode: formData.postalCode,
                    country: formData.country
                },
                paymentResult: {
                    id: 'mock_payment_id_' + Date.now(),
                    status: 'completed',
                    update_time: new Date().toISOString(),
                    email_address: user.email
                }
            });

            success('Order placed successfully! 🎉');
            clearCart();
            navigate('/profile');
        } catch (err) {
            console.error(err);
            error(err.message || 'Order failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] px-6 py-20 font-sans">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-black text-black mb-10">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left Column: Forms */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        
                        {/* Billing Details */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 bg-blue-100 text-[#0055FF] rounded-full flex items-center justify-center text-sm">1</span>
                                Billing Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                                    <input 
                                        type="text" 
                                        name="address"
                                        required
                                        className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:border-[#0055FF] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="123 Studio Lane"
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                                    <input 
                                        type="text" 
                                        name="city"
                                        required
                                        className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:border-[#0055FF] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="San Francisco"
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Postal Code</label>
                                    <input 
                                        type="text" 
                                        name="postalCode"
                                        required
                                        className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:border-[#0055FF] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="94107"
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Country</label>
                                    <input 
                                        type="text" 
                                        name="country"
                                        required
                                        className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:border-[#0055FF] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="United States"
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 bg-blue-100 text-[#0055FF] rounded-full flex items-center justify-center text-sm">2</span>
                                Payment Method
                            </h2>
                            <div className="flex flex-col gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Card Holder Name</label>
                                    <input 
                                        type="text" 
                                        name="cardName"
                                        required
                                        className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:border-[#0055FF] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="John Doe"
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Card Number</label>
                                    <input 
                                        type="text" 
                                        name="cardNumber"
                                        required
                                        className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:border-[#0055FF] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="0000 0000 0000 0000"
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Expiry Date</label>
                                        <input 
                                            type="text" 
                                            name="expDate"
                                            required
                                            className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:border-[#0055FF] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            placeholder="MM/YY"
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">CVC</label>
                                        <input 
                                            type="text" 
                                            name="cvc"
                                            required
                                            className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:border-[#0055FF] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            placeholder="123"
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-4">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
                            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                            
                            <div className="flex flex-col gap-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {cartItems.map((item) => (
                                    <div key={item._id || item.id} className="flex gap-4 items-center">
                                        <img src={item.image} alt={item.title} className="w-16 h-16 object-cover rounded-lg bg-gray-100" />
                                        <div>
                                            <p className="font-bold text-sm line-clamp-1">{item.title}</p>
                                            <p className="text-[#0055FF] font-bold text-sm">{item.price}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gray-100 w-full mb-6"></div>
                            
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-bold">${total}</span>
                            </div>
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-xl font-bold">Total</span>
                                <span className="text-2xl font-black text-[#0055FF]">${total}</span>
                            </div>

                            <button
                                onClick={submitHandler}
                                disabled={loading}
                                className={`w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/20 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Processing...' : 'Place Order'}
                            </button>
                            
                            <p className="text-xs text-gray-400 text-center mt-4">
                                This is a secure 256-bit SSL encrypted payment.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Checkout;
