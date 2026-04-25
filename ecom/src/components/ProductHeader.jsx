import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CartContext from '../context/CartContext';
import WishlistContext from '../context/WishlistContext';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StarRating from './ui/StarRating';
import { normalizeProduct } from '../utils/normalizers';
import productService from '../services/productService';
import api from '../services/api';
import { Share2, Eye, Zap, MessageSquare } from 'lucide-react';
import ConfigContext from '../context/ConfigContext';

const ProductHeader = ({ product }) => {
    const { config } = useContext(ConfigContext);
    const normalizedProduct = normalizeProduct(product);
    const { addToCart } = useContext(CartContext);
    const { addToWishlist, removeFromWishlist, isInWishlist } = useContext(WishlistContext);
    const { purchasedProductIds, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const { success, error: toastError } = useToast();
    const [isDownloading, setIsDownloading] = useState(false);
    const [paying, setPaying] = useState(false);

    const id = normalizedProduct?.id ?? null;
    const title = normalizedProduct?.title || 'Untitled product';
    const description = normalizedProduct?.description || 'A ready-to-use product with source files, setup guidance, and a clear path to customization.';
    const price = normalizedProduct?.formattedPrice || '₹0';
    const isPurchased = purchasedProductIds.includes(id);
    const inWishlist = isInWishlist(id);
    const supportDays = config?.eliteSettings?.serviceBenefitDays || 30;

    const handleAddToCart = () => {
        addToCart(normalizedProduct);
        success(`${title} added to cart.`);
    };

    const handleBuyNow = () => {
        addToCart(normalizedProduct);
        success(`${title} added. Opening checkout.`);
        navigate('/checkout');
    };

    const handleWishlist = () => {
        if (inWishlist) {
            removeFromWishlist(id);
            success('Removed from wishlist.');
            return;
        }

        addToWishlist(normalizedProduct);
        success('Saved to wishlist.');
    };

    const handleDownload = async () => {
        if (!id) {
            toastError('Download is unavailable for this product.');
            return;
        }

        try {
            setIsDownloading(true);
            const response = await productService.getDownloadUrl(id);
            if (!response?.downloadUrl) {
                throw new Error('Download link is unavailable right now.');
            }
            window.location.assign(response.downloadUrl);
        } catch (err) {
            toastError(err.message || 'Unable to start the download.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <section className="ds-page border-b border-slate-200 px-6 pt-8 pb-12 md:pt-12 md:pb-16">
            <div className="ds-shell grid gap-8 lg:grid-cols-[minmax(0,1fr),520px] lg:items-start">
                <div className="space-y-6">
                    <div className="flex flex-wrap gap-2">
                        <span className="ds-chip">{normalizedProduct.productType || 'Product'}</span>
                        {normalizedProduct.category && <span className="ds-chip">{normalizedProduct.category}</span>}
                        {normalizedProduct.requiresSubscription && <span className="ds-chip">Pro access option</span>}
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{title}</h1>
                        <p className="max-w-3xl text-base leading-7 text-slate-600">{description}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 text-sm text-slate-600">
                        <span className="text-3xl font-semibold tracking-tight text-slate-900">{price}</span>
                        {normalizedProduct.rating > 0 && (
                            <div className="flex items-center gap-2">
                                <StarRating rating={normalizedProduct.rating} numReviews={normalizedProduct.numReviews} size="md" />
                            </div>
                        )}
                        {normalizedProduct.numSales > 0 && (
                            <span>{normalizedProduct.numSales} sales</span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {isPurchased ? (
                            <>
                                <button type="button" onClick={() => navigate('/account')} className="ds-button-primary">
                                    View in account
                                </button>
                                {(normalizedProduct.fileURL || id) && (
                                    <button type="button" onClick={handleDownload} className="ds-button-secondary">
                                        {isDownloading ? 'Preparing download...' : 'Download'}
                                    </button>
                                )}
                                <button type="button" onClick={() => navigate('/support')} className="ds-button-secondary">
                                    Open support request
                                </button>
                            </>
                        ) : user?.subscriptionPlan === 'pro' && (normalizedProduct.requiresSubscription || normalizedProduct.isFree) ? (
                            <>
                                <button type="button" onClick={handleDownload} className="ds-button-primary">
                                    {isDownloading ? 'Preparing download...' : 'Download with membership'}
                                </button>
                                <button type="button" onClick={handleWishlist} className="ds-button-secondary">
                                    {inWishlist ? 'Saved' : 'Save'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button type="button" onClick={handleBuyNow} className="ds-button-primary">
                                    {normalizedProduct.isFree ? 'Get product' : `Buy product · ${price}`}
                                </button>
                                <button type="button" onClick={handleAddToCart} className="ds-button-secondary">
                                    Add to cart
                                </button>
                            </>
                        )}

                        <button 
                            type="button" 
                            onClick={handleWishlist} 
                            className="ds-button-ghost gap-2"
                        >
                            <span className={inWishlist ? 'text-rose-600' : ''}>
                                {inWishlist ? 'Saved' : 'Save to wishlist'}
                            </span>
                        </button>

                        {normalizedProduct.previewUrl && (
                            <a
                                href={normalizedProduct.previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ds-button-ghost flex items-center gap-2"
                            >
                                <Eye size={16} /> Live Preview
                            </a>
                        )}

                        <button 
                            type="button" 
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                success("Product link copied.");
                            }}
                            className="ds-button-ghost flex items-center gap-2"
                            title="Share product"
                        >
                            <Share2 size={16} /> Share
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/hire-developer')}
                            className="ds-button-ghost flex items-center gap-2 border border-slate-200"
                        >
                            <Zap size={14} className="text-emerald-500" /> Hire us to customize
                        </button>
                        {!isPurchased && config?.eliteSettings?.negotiationEnabled && (
                            <button 
                                type="button" 
                                disabled={paying}
                                onClick={async () => {
                                    if (!user) {
                                        toastError("Please log in to talk to an expert.");
                                        navigate('/login');
                                        return;
                                    }
                                    setPaying(true);
                                    try {
                                        const orderData = await api.post(`/support/create-order/${id}`);

                                        if (orderData.alreadyActive) {
                                            success("You already have an active support chat for this product.");
                                            navigate(`/support/chat/${orderData.sessionId}`);
                                            return;
                                        }

                                        const options = {
                                            key: orderData.keyId,
                                            amount: orderData.amount,
                                            currency: orderData.currency,
                                            name: "BizCode",
                                            description: `Expert help for ${title}`,
                                            order_id: orderData.orderId,
                                            handler: async function (response) {
                                                try {
                                                    const verifyData = await api.post('/support/verify-payment', {
                                                        razorpayOrderId: response.razorpay_order_id,
                                                        razorpayPaymentId: response.razorpay_payment_id,
                                                        razorpaySignature: response.razorpay_signature,
                                                        productId: id,
                                                    });
                                                    if (verifyData.sessionId) {
                                                        success("Payment verified. Opening your expert chat.");
                                                        navigate(`/support/chat/${verifyData.sessionId}`);
                                                    }
                                                } catch (err) {
                                                    toastError("Payment verification failed.");
                                                }
                                            },
                                            prefill: { name: user?.name || '', email: user?.email || '' },
                                            theme: { color: "#f59e0b" },
                                            modal: { ondismiss: () => setPaying(false) }
                                        };
                                        const rzp = new window.Razorpay(options);
                                        rzp.open();
                                    } catch (err) {
                                        toastError(err.message || "Failed to start expert help.");
                                    } finally {
                                        setPaying(false);
                                    }
                                }}
                                className="ds-button-ghost gap-2 border-slate-200 border text-slate-900 hover:bg-slate-50 disabled:opacity-50"
                            >
                                <MessageSquare size={14} className="text-amber-500" /> 
                                {paying ? 'Processing...' : `Ask an expert (₹${config?.eliteSettings?.negotiationFee || 9})`}
                            </button>
                        )}
                    </div>

                    <div className="grid gap-3 pt-2 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">After purchase</p>
                            <p className="mt-2 text-xs font-medium leading-5 text-slate-600">Download source files from your account.</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Setup help</p>
                            <p className="mt-2 text-xs font-medium leading-5 text-slate-600">{supportDays} days of product support are created automatically.</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Need changes?</p>
                            <p className="mt-2 text-xs font-medium leading-5 text-slate-600">Request customization or a full custom build.</p>
                        </div>
                    </div>

                    <p className="text-sm text-slate-500">Payments are processed securely through Razorpay. Downloads use authenticated links.</p>
                </div>

                <div className="ds-card overflow-hidden">
                    <div className="aspect-[4/3] bg-slate-100">
                        <img src={normalizedProduct.image} alt={title} className="h-full w-full object-cover" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProductHeader;
