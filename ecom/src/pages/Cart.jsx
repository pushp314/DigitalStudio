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
        navigate(user ? '/checkout' : '/login?redirect=cart');
    };

    const total = cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

    if (cartItems.length === 0) {
        return (
            <div className="ds-page flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Your cart is empty</h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">Add a ready app, kit, or technical asset to continue to checkout.</p>
                <Link to="/apps" className="ds-button-primary mt-6">
                    Explore apps
                </Link>
            </div>
        );
    }

    return (
        <div className="ds-page px-4 sm:px-6 pb-12 sm:pb-16 pt-8 sm:pt-16">
            <div className="ds-shell grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
                <section className="space-y-6">
                    <div className="space-y-3">
                        <p className="ds-eyebrow">Cart</p>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">Review your selected products</h1>
                        <p className="text-sm leading-relaxed text-slate-600">After payment, eligible products unlock downloads in your account and create a support path for setup help.</p>
                    </div>

                    {cartItems.map((item) => (
                        <article key={item.id} className="ds-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                            <div className="h-24 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:w-28">
                                <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg font-semibold tracking-tight text-slate-900">{item.title}</h2>
                                <p className="text-sm text-slate-600">{item.category}</p>
                            </div>
                            <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                                <span className="text-lg font-semibold text-slate-900">{item.formattedPrice}</span>
                                <button
                                    type="button"
                                    onClick={() => removeFromCart(item.id)}
                                    className="text-sm font-medium text-rose-600 hover:text-rose-700"
                                >
                                    Remove
                                </button>
                            </div>
                        </article>
                    ))}
                </section>

                <aside className="ds-card h-fit p-6">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">Order summary</h2>
                    <div className="mt-6 space-y-4 text-sm text-slate-600">
                        <div className="flex items-center justify-between">
                            <span>Subtotal</span>
                            <span className="font-medium text-slate-900">{formatCurrency(total)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Taxes</span>
                            <span className="font-medium text-slate-900">Included at checkout</span>
                        </div>
                    </div>
                    <div className="mt-6 border-t border-slate-200 pt-4">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-700">Total</span>
                            <span className="text-xl font-semibold text-slate-900">{formatCurrency(total)}</span>
                        </div>
                    </div>
                    <button type="button" onClick={checkoutHandler} className="ds-button-primary mt-6 w-full">
                        Continue to checkout
                    </button>
                </aside>
            </div>
        </div>
    );
};

export default Cart;
