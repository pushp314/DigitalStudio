import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import CartContext from '../context/CartContext';
import WishlistContext from '../context/WishlistContext';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfigContext from '../context/ConfigContext';
import StarRating from './ui/StarRating';
import { normalizeProduct } from '../utils/normalizers';

const ProductHeader = ({ product }) => {
  const normalizedProduct = normalizeProduct(product);
  const { addToCart } = useContext(CartContext);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useContext(WishlistContext);
  const { purchasedProductIds, user } = useContext(AuthContext);
  const { config } = useContext(ConfigContext);
  const navigate = useNavigate();
  const { success } = useToast();

  const handleAddToCart = () => {
    addToCart(product);
    success(`${product.title} added to cart!`);
  };

  const handleBuyNow = () => {
    addToCart(product);
    navigate('/cart');
  };

  const handleWishlist = () => {
    const id = normalizedProduct.id;
    if (isInWishlist(id)) {
      removeFromWishlist(id);
      success('Removed from wishlist');
    } else {
      addToWishlist(product);
      success('Added to wishlist ❤️');
    }
  };

  const {
    title = "Untitled product",
    description = "Explore the full details for this product.",
    formattedPrice: price = "₹0",
    previewUrl = ""
  } = normalizedProduct || {};

  const id = normalizedProduct ? normalizedProduct.id : null;
  const socialProof = config?.socialProof ?? {};
  const avatars = Array.isArray(socialProof.avatarImages) ? socialProof.avatarImages : [];

  return (
    <div className="w-full bg-[#F8FAFC] px-6 py-20 lg:py-32 flex flex-col justify-center font-sans border-b border-gray-100">
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* LEFT SECTOR: LOGIC & ACTION */}
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-6">
              {/* Category Breadcrumb */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{normalizedProduct.productType || 'Template'}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{normalizedProduct.category}</span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-slate-900 tracking-tighter leading-[0.9]">
                {title}
              </h1>
              
              <p className="text-slate-500 text-xl font-medium max-w-xl leading-relaxed">
                {description}
              </p>

              {/* Trust Signal Cluster */}
              <div className="flex items-center gap-8">
                {normalizedProduct && normalizedProduct.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={normalizedProduct.rating} numReviews={normalizedProduct.numReviews} size="md" />
                  </div>
                )}
                {normalizedProduct && normalizedProduct.numSales > 0 && (
                  <div className="flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">⚡ {normalizedProduct.numSales} Deployments</span>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION CENTER */}
            <div className="flex flex-col gap-8">
              <div className="flex flex-wrap items-center gap-5">
                {purchasedProductIds.includes(normalizedProduct.id) ? (
                  <>
                    <button
                      onClick={() => navigate('/profile')}
                      className="bg-emerald-500 text-white px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      ✓ Owned Intelligence
                    </button>
                    {normalizedProduct.fileURL && (
                      <a
                        href={normalizedProduct.fileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-900 text-white px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-slate-900/10 active:scale-95 transition-all flex items-center gap-3"
                      >
                        Source Code 📦
                      </a>
                    )}
                  </>
                ) : user?.subscriptionPlan === 'pro' && (normalizedProduct.requiresSubscription || normalizedProduct.isFree) ? (
                  <>
                    <a
                      href={normalizedProduct.fileURL || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-amber-400 text-black px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-3"
                    >
                      Pro Entitlement — Unlock 🔓
                    </a>
                    <button
                      onClick={handleWishlist}
                      className="bg-white border border-slate-200 text-slate-900 px-8 py-5 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                      Save to Library
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleBuyNow}
                      className="bg-primary hover:bg-blue-600 text-white px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-blue-500/20 active:scale-95 transition-all"
                    >
                      {normalizedProduct.isFree ? 'Get for Free' : `Acquire Now — ${price}`}
                    </button>
                    <button
                      onClick={handleAddToCart}
                      className="bg-white border border-slate-200 text-slate-900 px-10 py-5 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                      Add to Cart
                    </button>
                  </>
                )}

                {/* Secondary Actions */}
                <div className="flex items-center gap-3">
                    <button
                      onClick={handleWishlist}
                      className={`p-5 rounded-full transition-all active:scale-90 border ${isInWishlist(id) ? 'bg-red-50 border-red-100 text-red-500 shadow-xl shadow-red-500/10' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-900'}`}
                    >
                      <svg className={`w-6 h-6 ${isInWishlist(id) ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    {previewUrl && (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-5 rounded-full bg-white border border-slate-100 text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                        title="Live Preview"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                </div>
              </div>

              {/* Secure Transaction Link */}
              <div className="flex items-center gap-3 text-slate-400 font-bold uppercase text-[9px] tracking-widest">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm3 12H9v-2h6v2zm0-4H9V8h6v2z" />
                  </svg>
                  Encrypted Transaction
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>Razorpay Gateway</span>
              </div>
            </div>
          </div>

          {/* RIGHT SECTOR: VISUAL ASSET */}
          <div className="relative group lg:block">
            <div className="relative z-10 w-full aspect-[4/3] bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-50 overflow-hidden transform transition-transform duration-700 hover:scale-[1.02]">
                <img 
                    src={normalizedProduct.image} 
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none"></div>
            </div>
            
            {/* Social Verification Cluster */}
            {(avatars.length > 0) && (
              <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-indigo-900/10 border border-slate-50 flex items-center gap-6 z-20 animate-in slide-in-from-right-8 duration-700">
                <div className="flex -space-x-3">
                  {avatars.slice(0, 4).map((src, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm">
                       <img src={src} className="w-full h-full object-cover" alt="User" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                     {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-amber-400 text-xs">★</span>
                     ))}
                  </div>
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest mt-1">12k+ Trusted</span>
                </div>
              </div>
            )}
            
            {/* Asset Node (Floating) */}
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-slate-900 rounded-[2rem] shadow-2xl flex items-center justify-center text-3xl rotate-[-12deg] animate-bounce-slow z-20">💎</div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductHeader;
