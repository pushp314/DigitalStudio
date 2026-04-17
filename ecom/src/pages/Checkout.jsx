import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { FEATURES } from '../config/features';
import { formatCurrency } from '../utils/normalizers';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const Checkout = () => {
    const { cartItems, clearCart } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const { success, error } = useToast();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login?redirect=checkout');
        }
        if (cartItems.length === 0) {
            navigate('/cart');
        }
        if (!FEATURES.payments) {
            error('Payments are currently unavailable.');
            navigate('/cart');
        }
    }, [cartItems, error, navigate, user]);

    const total = cartItems.reduce((acc, item) => {
        return acc + Number(item.price || 0);
    }, 0);

    const submitHandler = async () => {
        setLoading(true);

        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
            error("Razorpay SDK failed to load. Are you online?");
            setLoading(false);
            return;
        }

        const items = cartItems.map(item => ({
            productId: Number(item.id),
            quantity: 1,
        }));

        try {
            // Create Order on Backend
            const res = await api.post('/payments/create-order', { items });
            const { orderId, amount, currency, keyId } = res;

            const options = {
                key: keyId,
                amount: amount,
                currency: currency,
                name: "DigitalStudio",
                description: "Digital Template Purchase",
                order_id: orderId,
                prefill: {
                    name: user.name || "Customer",
                    email: user.email,
                },
                theme: { color: "#0055FF" },
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/payments/verify', {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });
                        if (verifyRes.paymentStatus === 'paid' || verifyRes.status === 'captured' || verifyRes.entitled) {
                            success('Payment verified successfully! 🎉');
                            clearCart();
                            navigate('/profile');
                        }
                    } catch (err) {
                        console.error(err);
                        error(err.message || 'Payment Verification failed.');
                    }
                }
            };
            
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (_response){
                error("Payment mapping failed. Try again.");
            });
            
            rzp.open();

        } catch (err) {
            console.error(err);
            error(err.message || 'Failed to initialize payment.');
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
                        <div className="bg-white p-8 rounded-3xl shadow-sm">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 bg-blue-100 text-[#0055FF] rounded-full flex items-center justify-center text-sm">1</span>
                                Review Purchase
                            </h2>
                            <div className="space-y-4">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-gray-100 p-4">
                                        <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded-xl bg-gray-100" />
                                        <div className="flex-1">
                                            <p className="font-bold text-black">{item.title}</p>
                                            <p className="text-sm text-gray-500">{item.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-[#0055FF]">{item.formattedPrice}</p>
                                            <p className="text-xs text-gray-400">Qty 1</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 text-sm text-gray-600">
                                    Razorpay will open in a secure checkout modal. We only send the purchased items to the backend and unlock downloads after a verified captured payment.
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
                                    <div key={item.id} className="flex gap-4 items-center">
                                        <img src={item.image} alt={item.title} className="w-16 h-16 object-cover rounded-lg bg-gray-100" />
                                        <div>
                                            <p className="font-bold text-sm line-clamp-1">{item.title}</p>
                                            <p className="text-[#0055FF] font-bold text-sm">{item.formattedPrice}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="h-px bg-gray-100 w-full mb-6"></div>
                            
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-bold">{formatCurrency(total)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-xl font-bold">Total</span>
                                <span className="text-2xl font-black text-[#0055FF]">{formatCurrency(total)}</span>
                            </div>

                            <button
                                onClick={submitHandler}
                                disabled={loading}
                                className={`w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/20 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Processing...' : 'Pay with Razorpay'}
                            </button>
                            
                            <p className="text-xs text-gray-400 text-center mt-4">
                                Secure checkout powered by Razorpay.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Checkout;
