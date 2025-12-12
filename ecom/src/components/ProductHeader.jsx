import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import CartContext from '../context/CartContext';
import WishlistContext from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import StarRating from './ui/StarRating';

const ProductHeader = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useContext(WishlistContext);
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
    const id = product._id || product.id;
    if (isInWishlist(id)) {
      removeFromWishlist(id);
      success('Removed from wishlist');
    } else {
      addToWishlist(product);
      success('Added to wishlist ❤️');
    }
  };

  const {
    title = "AI Chatbot",
    description = "Transform customer engagement with intelligent AI solutions",
    price = "$79",
    previewUrl = "#"
  } = product || {};

  const id = product ? (product._id || product.id) : null;

  // Avatars for the social proof section
  const avatars = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces&q=80",
    "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop&crop=faces&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces&q=80",
  ];

  return (
    <div className="w-full bg-[#F5F5F7] px-6 py-20 min-h-[50vh] flex flex-col justify-center font-sans border-b border-gray-200/50">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-10 w-full pt-10">

        {/* 1. TITLE & SUBTITLE */}
        <div className="flex flex-col gap-4">
          <h1 className="text-6xl md:text-7xl lg:text-[6rem] font-black text-black tracking-tighter leading-none">
            {title}
          </h1>
          <p className="text-gray-500 text-xl font-medium max-w-2xl leading-relaxed">
            {description}
          </p>

          {/* Star Rating & Sales Info */}
          <div className="flex items-center gap-6 mt-2">
            {product && product.rating > 0 && (
              <StarRating rating={product.rating} numReviews={product.numReviews} size="md" />
            )}
            {product && product.numSales > 0 && (
              <span className="text-gray-500 text-sm">
                🔥 {product.numSales} sales
              </span>
            )}
          </div>

          {/* Tech Stack */}
          {product && product.techStack && product.techStack.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm font-medium text-gray-600 mr-2">Tech Stack:</span>
              {product.techStack.map((tech, idx) => (
                <span key={idx} className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 2. ACTIONS & SOCIAL PROOF ROW */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 lg:gap-0 mt-2">

          {/* LEFT: Buttons & Trust Badge */}
          <div className="flex flex-col gap-6">

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Add To Cart Button */}
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg active:scale-95"
              >
                Add to Cart
              </button>

              {/* Buy Now Button */}
              <button
                onClick={handleBuyNow}
                className="flex items-center gap-2 bg-[#0055FF] hover:bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <svg className="w-3 h-3 text-[#0055FF]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 21h10v-9h-10v9zm2-7h6v5h-6v-5zm-5-4l10-10 10 10h-20z" transform="scale(0.8) translate(3,3)" />
                    {/* Simplified lightning icon path */}
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                Buy Now {price}
              </button>

              {/* Wishlist Button */}
              <button
                onClick={handleWishlist}
                className={`flex items-center gap-2 bg-white hover:bg-gray-50 text-black px-4 py-4 rounded-full font-bold text-lg transition-all shadow-sm active:scale-95 border ${isInWishlist(id) ? 'border-red-200 text-red-500' : 'border-transparent'}`}
              >
                <svg className={`w-6 h-6 ${isInWishlist(id) ? 'fill-current text-red-500' : 'text-black'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              {/* Preview Button */}
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-black px-8 py-4 rounded-full font-bold text-lg transition-all shadow-sm active:scale-95 border border-gray-100"
              >
                {/* Framer Icon */}
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black">
                  <path d="M4 0h16v8h-8zM4 8h8l8 8h-16zM4 16h8v8z" />
                </svg>
                Preview
              </a>
            </div>

            {/* Trust Badge: Lemon Squeezy */}
            <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
              <span>Payments secured by</span>
              <div className="flex items-center gap-1.5 text-black font-bold opacity-80">
                {/* Lemon Squeezy Icon SVG */}
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M19.4 6.7c-2.4-2.7-6.3-2.7-8.7 0L12 5.5l1.3 1.2c1.7-1.9 4.4-1.9 6.1 0 1.7 1.9 1.7 5 0 6.9l-6.1 6.8-1.3-1.4 4.8-5.4c1.2-1.3 1.2-3.5 0-4.8l2.6 2.1zM4.6 17.3c2.4 2.7 6.3 2.7 8.7 0L12 18.5l-1.3-1.2c-1.7 1.9-4.4 1.9-6.1 0-1.7-1.9-1.7-5 0-6.9l6.1-6.8 1.3 1.4-4.8 5.4c-1.2 1.3-1.2 3.5 0 4.8l-2.6-2.1z" />
                </svg>
                <span>lemon squeezy</span>
              </div>
            </div>

          </div>

          {/* RIGHT: Social Proof */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

            {/* Avatar Group */}
            <div className="flex items-center pl-2">
              {avatars.map((src, index) => (
                <div
                  key={index}
                  className="relative w-12 h-12 rounded-full overflow-hidden -ml-3 border-[3px] border-[#F5F5F7] z-0 hover:z-10 hover:scale-110 transition-transform duration-200"
                  style={{ zIndex: avatars.length - index }}
                >
                  <img
                    src={src}
                    alt={`User ${index}`}
                    className="w-full h-full object-cover grayscale brightness-110 contrast-125"
                  />
                </div>
              ))}
            </div>

            {/* Rating Details */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-600">4.9/5</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-[#0055FF]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-gray-500 font-medium text-sm">
                Loved by 1000+ creators
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default ProductHeader;