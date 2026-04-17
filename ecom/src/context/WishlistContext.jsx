import { createContext, useState, useEffect } from 'react';
import { normalizeProduct } from '../utils/normalizers';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState([]);

    useEffect(() => {
        const storedWishlist = localStorage.getItem('wishlistItems');
        if (storedWishlist) {
            setWishlistItems(JSON.parse(storedWishlist).map(normalizeProduct));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    const addToWishlist = (product) => {
        const normalizedProduct = normalizeProduct(product);
        const existItem = wishlistItems.find((x) => x.id === normalizedProduct.id);
        if (existItem) {
            return;
        }
        setWishlistItems([...wishlistItems, normalizedProduct]);
    };

    const removeFromWishlist = (id) => {
        setWishlistItems(wishlistItems.filter((x) => x.id !== id));
    };

    const isInWishlist = (id) => {
        return wishlistItems.some((x) => x.id === id);
    };

    return (
        <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export default WishlistContext;
