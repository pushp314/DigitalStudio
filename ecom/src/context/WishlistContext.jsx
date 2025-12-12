import { createContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState([]);

    useEffect(() => {
        const storedWishlist = localStorage.getItem('wishlistItems');
        if (storedWishlist) {
            setWishlistItems(JSON.parse(storedWishlist));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    const addToWishlist = (product) => {
        const existItem = wishlistItems.find((x) => (x._id || x.id) === (product._id || product.id));
        if (existItem) {
            return; // Already in wishlist
        }
        setWishlistItems([...wishlistItems, product]);
    };

    const removeFromWishlist = (id) => {
        setWishlistItems(wishlistItems.filter((x) => (x._id || x.id) !== id));
    };

    const isInWishlist = (id) => {
        return wishlistItems.some((x) => (x._id || x.id) === id);
    };

    return (
        <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export default WishlistContext;
