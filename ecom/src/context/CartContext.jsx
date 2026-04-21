import React, { createContext, useContext, useMemo } from 'react';
import { normalizeProduct } from '../utils/normalizers';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useLocalStorageState('cartItems', []);

    // AOV bundle logic (10% off for 3+ items)
    const isBundleEligible = cartItems.length >= 3;
    const itemsCount = cartItems.length;

    const addToCart = (product) => {
        const normalizedProduct = normalizeProduct(product);
        const existItem = cartItems.find((x) => x.id === normalizedProduct.id);
        if (existItem) {
            setCartItems(
                cartItems.map((x) =>
                    x.id === normalizedProduct.id ? normalizedProduct : x
                )
            );
        } else {
            setCartItems([...cartItems, normalizedProduct]);
        }
    };

    const removeFromCart = (id) => {
        setCartItems(cartItems.filter((x) => x.id !== id));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const value = useMemo(() => ({
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        isBundleEligible,
        itemsCount
    }), [cartItems, isBundleEligible, itemsCount]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;
