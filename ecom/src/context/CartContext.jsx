import { createContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        const fromStorage = localStorage.getItem('cartItems');
        if (fromStorage) {
            setCartItems(JSON.parse(fromStorage));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product) => {
        const existItem = cartItems.find((x) => x._id === product._id || x.id === product.id);
        if (existItem) {
            // If exists, usually update quantity, but for digital templates, maybe just warn or do nothing?
            // Assuming quantity is 1 for templates.
            // Or we can just overwrite.
            setCartItems(
                cartItems.map((x) =>
                    (x._id === product._id || x.id === product.id) ? product : x
                )
            );
        } else {
            setCartItems([...cartItems, product]);
        }
    };

    const removeFromCart = (id) => {
        setCartItems(cartItems.filter((x) => (x._id !== id && x.id !== id)));
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
