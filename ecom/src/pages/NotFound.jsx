import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#F5F5F7] px-6 text-center">
            <h1 className="text-9xl font-black text-black mb-4">404</h1>
            <p className="text-2xl text-gray-500 mb-8">Page not found</p>
            <Link
                to="/"
                className="bg-[#0055FF] text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-600 transition-colors"
            >
                Go Back Home
            </Link>
        </div>
    );
};

export default NotFound;
