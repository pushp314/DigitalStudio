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
                navigate('/account', { replace: true });
                return;
            }

            setError(result.error || 'OAuth sign-in failed.');
        };

        finishOAuth();
    }, [completeOAuth, navigate, searchParams]);

    return (
        <div className="ds-page flex min-h-screen items-center justify-center px-6 pt-20">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-10">
                {error ? (
                    <>
                        <p className="ds-eyebrow">Sign-in error</p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Unable to complete sign-in</h1>
                        <p className="mt-3 text-sm text-slate-600">{error}</p>
                        <button
                            type="button"
                            onClick={() => navigate('/login', { replace: true })}
                            className="ds-button-primary mt-6"
                        >
                            Back to sign in
                        </button>
                    </>
                ) : (
                    <>
                        <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                        <p className="ds-eyebrow">Signing in</p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Finalizing your account</h1>
                        <p className="mt-3 text-sm text-slate-600">Please wait while we finish your sign-in.</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default OAuthCallback;
