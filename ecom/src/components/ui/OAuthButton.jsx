import React from 'react';

const OAuthButton = ({ provider, icon, onClick }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center justify-center gap-3 w-full bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
        >
            <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
            <span>Continue with {provider}</span>
        </button>
    );
};

export default OAuthButton;
