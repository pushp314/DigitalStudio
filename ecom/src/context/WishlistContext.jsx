import { createContext } from 'react';
import { normalizeProduct } from '../utils/normalizers';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useLocalStorageState('wishlistItems', []);

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
