import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WishlistContext from '../context/WishlistContext';
import CartContext from '../context/CartContext';
import ConfigContext from '../context/ConfigContext';
import api from '../services/api';

const Wishlist = () => {
    const { config } = useContext(ConfigContext);
    const { wishlistItems, removeFromWishlist } = useContext(WishlistContext);
    const { addToCart } = useContext(CartContext);
    const [deals, setDeals] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        if (config && config.features && config.features.wishlist === false) {
            navigate('/');
        }
    }, [config, navigate]);

    useEffect(() => {
        if (wishlistItems.length === 0) {
            return;
        }

        const fetchDeals = async () => {
            try {
                const items = wishlistItems.map((item) => ({ id: item.id, addedAt: item.addedAt }));
                const response = await api.post('/marketing/wishlist-deals', { items });
                const nextDeals = {};
                (Array.isArray(response) ? response : []).forEach((deal) => {
                    nextDeals[deal.productId] = deal;
                });
                setDeals(nextDeals);
            } catch (err) {
                console.error('Failed to load wishlist deals', err);
            }
        };

        fetchDeals();
    }, [wishlistItems]);

    if (wishlistItems.length === 0) {
        return (
            <div className="ds-page flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Your wishlist is empty</h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">Save products here so you can revisit them later.</p>
                <Link to="/templates" className="ds-button-primary mt-6">
                    Browse templates
                </Link>
            </div>
        );
    }

    return (
        <div className="ds-page px-6 pb-16 pt-28">
            <div className="ds-shell space-y-6">
                <div className="space-y-2">
                    <p className="ds-eyebrow">Wishlist</p>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Saved products</h1>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {wishlistItems.map((item) => {
                        const deal = deals[item.id];
                        return (
                            <article key={item.id} className="ds-card overflow-hidden">
                                <Link to={`/templates/${item.id}`} className="block border-b border-slate-200 bg-slate-100">
                                    <img src={item.image} alt={item.title} className="aspect-[4/3] w-full object-cover" />
                                </Link>
                                <div className="space-y-4 p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-xl font-semibold tracking-tight text-slate-900">{item.title}</h2>
                                            <p className="mt-1 text-sm text-slate-600">{item.category}</p>
                                        </div>
                                        {deal && (
                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                                {Math.round((deal.discount || 0) * 100)}% off
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-lg font-semibold text-slate-900">
                                        {deal ? `₹${(item.price * (1 - deal.discount)).toFixed(0)}` : item.formattedPrice}
                                    </div>

                                    {deal?.reason && <p className="text-sm text-slate-600">{deal.reason}</p>}

                                    <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                                        <button type="button" onClick={() => addToCart(item)} className="ds-button-primary">
                                            Add to cart
                                        </button>
                                        <button type="button" onClick={() => removeFromWishlist(item.id)} className="ds-button-secondary">
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Wishlist;
