import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const decodeUserParam = (value) => {
    if (!value) return null;

    try {
        const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
        return JSON.parse(window.atob(padded));
    } catch (error) {
        console.error('Failed to decode OAuth user payload', error);
        return null;
    }
};

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { completeOAuth } = useContext(AuthContext);
    const [error, setError] = useState('');

    useEffect(() => {
        const finishOAuth = async () => {
            const token = searchParams.get('token');
            const user = decodeUserParam(searchParams.get('user'));
            const result = await completeOAuth({ token, user });

            if (result.success) {
                navigate('/profile', { replace: true });
            } else {
                setError(result.error || 'OAuth login failed');
            }
        };

        finishOAuth();
    }, [completeOAuth, navigate, searchParams]);

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-6">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 md:p-12 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 text-center">
                {error ? (
                    <>
                        <h1 className="text-2xl font-black text-black mb-3">OAuth Sign-In Failed</h1>
                        <p className="text-gray-500 mb-6">{error}</p>
                        <button
                            onClick={() => navigate('/login', { replace: true })}
                            className="bg-primary text-white px-6 py-3 rounded-full font-bold hover:bg-blue-600 transition-colors"
                        >
                            Back to Login
                        </button>
                    </>
                ) : (
                    <>
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
                        <h1 className="text-2xl font-black text-black mb-3">Signing you in</h1>
                        <p className="text-gray-500">Finalizing your OAuth session and loading your account.</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default OAuthCallback;
