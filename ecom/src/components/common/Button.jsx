import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({
    children,
    to,
    onClick,
    variant = 'primary', // primary, secondary, outline, ghost
    className = '',
    type = 'button',
    ...props
}) => {

    const baseStyles = "inline-flex items-center justify-center px-6 py-3 rounded-full font-bold transition-all duration-200 active:scale-95";

    const variants = {
        primary: "bg-[#0055FF] hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20",
        secondary: "bg-black hover:bg-gray-800 text-white shadow-lg",
        outline: "bg-transparent border-2 border-white/20 hover:bg-white/10 text-white",
        ghost: "bg-transparent hover:bg-gray-100 text-gray-900",
        white: "bg-white text-black hover:bg-gray-50 shadow-lg"
    };

    const combinedClasses = `${baseStyles} ${variants[variant] || variants.primary} ${className}`;

    if (to) {
        return (
            <Link to={to} className={combinedClasses} {...props}>
                {children}
            </Link>
        );
    }

    return (
        <button type={type} onClick={onClick} className={combinedClasses} {...props}>
            {children}
        </button>
    );
};

export default Button;
