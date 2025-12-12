import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import WishlistContext from '../context/WishlistContext';
import CartContext from '../context/CartContext';

const Wishlist = () => {
    const { wishlistItems, removeFromWishlist } = useContext(WishlistContext);
    const { addToCart } = useContext(CartContext);

    if (wishlistItems.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 bg-[#F5F5F7]">
                <h2 className="text-3xl font-bold mb-4 text-black">Your wishlist is empty</h2>
                <p className="text-gray-500 mb-8">Save items you love to revisit later.</p>
                <Link to="/templates" className="bg-[#0055FF] text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition-opacity">
                    Explore Templates
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] px-6 py-20">
            <div className="max-w-[1200px] mx-auto">
                <h1 className="text-4xl font-black text-black mb-10">Your Wishlist</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {wishlistItems.map((item) => (
                        <div key={item._id || item.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative group">
                            <button
                                onClick={() => removeFromWishlist(item._id || item.id)}
                                className="absolute top-4 right-4 bg-gray-100 hover:bg-red-50 p-2 rounded-full transition-colors z-10"
                                title="Remove from wishlist"
                            >
                                <svg className="w-5 h-5 text-gray-500 hover:text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>

                            <Link to={`/templates/${item._id || item.id}`} className="block">
                                <div className="aspect-w-16 aspect-h-12 mb-4 rounded-xl overflow-hidden bg-gray-100">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <h3 className="text-xl font-bold text-black mb-1">{item.title}</h3>
                                <p className="text-[#0055FF] font-bold text-lg mb-4">{item.price}</p>
                            </Link>

                            <button
                                onClick={() => addToCart(item)}
                                className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                Add to Cart
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Wishlist;
