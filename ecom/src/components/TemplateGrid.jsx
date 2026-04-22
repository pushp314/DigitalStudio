import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import WishlistContext from '../context/WishlistContext';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';
import StarRating from './ui/StarRating';
import { useToast } from '../context/ToastContext';
import { normalizeProduct } from '../utils/normalizers';
import { Share2, Eye, ExternalLink } from 'lucide-react';

const statusLabel = (template) => {
    if (template.isFree) return { text: 'Free', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    if (template.isBestseller) return { text: 'Bestseller', className: 'bg-amber-50 text-amber-700 border-amber-200 font-black' };
    if (template.isNewProduct) return { text: 'New', className: 'bg-blue-50 text-blue-700 border-blue-100' };
    if (template.isTrending) return { text: 'Trending', className: 'bg-rose-50 text-rose-700 border-rose-100' };
    if (template.isFeatured) return { text: 'Featured', className: 'bg-slate-100 text-slate-700 border-slate-200' };
    return null;
};

const TemplateGrid = ({ items, limit }) => {
    let templates = (items || []).map(normalizeProduct);
    const { addToWishlist, removeFromWishlist, isInWishlist } = useContext(WishlistContext);
    const { addToCart, clearCart } = useContext(CartContext);
    const { purchasedProductIds } = useContext(AuthContext);
    const { success } = useToast();
    const navigate = useNavigate();

    if (limit) {
        templates = templates.slice(0, limit);
    }

    const handleWishlistClick = (event, template) => {
        event.preventDefault();
        event.stopPropagation();
        const id = template.id;

        if (isInWishlist(id)) {
            removeFromWishlist(id);
            success('Removed from wishlist.');
            return;
        }

        addToWishlist(template);
        success('Saved to wishlist.');
    };

    const handleAddToCart = (event, template) => {
        event.preventDefault();
        event.stopPropagation();
        addToCart(template);
        success(`${template.title} added to cart.`);
    };

    const handleDirectBuy = (event, template) => {
        event.preventDefault();
        event.stopPropagation();
        clearCart();
        addToCart(template);
        success(`Preparing checkout for ${template.title}.`);
        navigate('/subscription-checkout', { state: { plan: template } });
    };

    return (
        <section className="ds-page px-6 pb-16">
            <div className="ds-shell">
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {templates.map((template) => {
                        const badge = statusLabel(template);
                        const purchased = purchasedProductIds.includes(template.id);

                        return (
                            <article
                                key={template.id}
                                onClick={() => navigate(`/apps/${template.id}`)}
                                className="ds-card group cursor-pointer overflow-hidden"
                            >
                                <div className="relative overflow-hidden border-b border-slate-200 bg-slate-100">
                                    <img
                                        src={template.image}
                                        alt={template.title}
                                        loading="lazy"
                                        className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                    />

                                    <div className="absolute left-4 top-4 flex items-center gap-2">
                                        {badge && (
                                            <span className={`ds-chip border shadow-sm ${badge.className}`}>
                                                {badge.text}
                                            </span>
                                        )}
                                        <span className="ds-chip bg-white/95 shadow-sm">{template.category || 'Product'}</span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={(event) => handleWishlistClick(event, template)}
                                        aria-label={isInWishlist(template.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                                        className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
                                    >
                                        <svg
                                            className={`h-4 w-4 ${isInWishlist(template.id) ? 'fill-current text-rose-500' : ''}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-5 p-6">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="text-xl font-semibold tracking-tight text-slate-900">{template.title}</h3>
                                                    <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                                                    {template.description || 'A ready product you can customize and launch faster.'}
                                                </p>
                                            </div>
                                            <span className="whitespace-nowrap text-lg font-semibold text-slate-900">{template.formattedPrice}</span>
                                        </div>

                                        {template.rating > 0 && (
                                            <StarRating rating={template.rating} numReviews={template.numReviews} size="sm" />
                                        )}
                                    </div>

                                    {template.techStack?.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {template.techStack.slice(0, 4).map((tech) => (
                                                <span key={tech} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                                                    {tech}
                                                </span>
                                            ))}
                                            {template.techStack.length > 4 && (
                                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                                                    +{template.techStack.length - 4} more
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
                                        {purchased ? (
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                    navigate('/account');
                                                }}
                                                className="ds-button-secondary"
                                            >
                                                View my products
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={(event) => template.productType === 'subscription' ? handleDirectBuy(event, template) : handleAddToCart(event, template)}
                                                className="ds-button-primary"
                                            >
                                                {template.productType === 'subscription' ? 'Continue to checkout' : 'Add to cart'}
                                            </button>
                                        )}

                                        {template.previewUrl && (
                                            <a
                                                href={template.previewUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(event) => event.stopPropagation()}
                                                className="ds-button-secondary flex items-center gap-2"
                                                title="Visual Discovery"
                                            >
                                                <Eye size={14} /> Live Demo
                                            </a>
                                        )}

                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                navigator.clipboard.writeText(`${window.location.origin}/apps/${template.id}`);
                                                success("Product link copied.");
                                            }}
                                            className="ds-button-ghost p-2.5 flex items-center justify-center border border-slate-200"
                                            title="Share product"
                                        >
                                            <Share2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>

                {limit && (
                    <div className="mt-10 flex justify-center">
                        <Link to="/apps" className="ds-button-secondary">
                            View all apps
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
};

export default TemplateGrid;
