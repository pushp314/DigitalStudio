import { createContext } from 'react';
import { normalizeProduct } from '../utils/normalizers';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useLocalStorageState('cartItems', []);

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

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;
