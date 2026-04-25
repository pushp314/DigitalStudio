import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import OAuthButton from '../../components/ui/OAuthButton';
import { getOAuthLoginUrl } from '../../services/api';
import { Loader2, Fingerprint, ChevronLeft, ShieldCheck } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, user, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const redirectUrl = queryParams.get('redirect');

    // Session Protection: Breakout if already authenticated
    useEffect(() => {
        if (!loading && user) {
            if (redirectUrl) {
                navigate(`/${redirectUrl}`);
            } else {
                navigate(user.role === 'admin' ? '/admin' : '/account');
            }
        }
    }, [user, loading, navigate, redirectUrl]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        const result = await login(email, password);

        if (result.success) {
            if (redirectUrl) {
                navigate(`/${redirectUrl}`);
            } else {
                navigate(result.user?.role === 'admin' ? '/admin' : '/account');
            }
            return;
        }

        setError(result.error);
    };

    const handleOAuth = (provider) => {
        window.location.href = getOAuthLoginUrl(provider);
    };

    if (loading) {
        return (
            <div className="h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex overflow-hidden font-sans text-slate-900 antialiased bg-white">
            
            {/* Immersive Visual Node (Left) */}
            <div className="hidden lg:block lg:w-[55%] relative overflow-hidden bg-slate-900">
                <img 
                    src="/assets/auth-bg.png" 
                    alt="BizCode workspace" 
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-12 left-12 right-12 z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 text-white font-bold">B</div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest">BizCode</h2>
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight leading-tight mb-4 max-w-xl">
                        Buy ready apps, customize them, or hire us to build.
                    </h1>
                    <p className="text-slate-300 font-medium max-w-md">
                        Access purchased products, support requests, premium guides, and community chat from one account.
                    </p>
                </div>
            </div>

            {/* Authentication Pane (Right) */}
            <main className="flex-1 flex flex-col justify-center items-center px-10 md:px-20 relative bg-white overflow-y-auto">
                <Link to="/" className="absolute top-10 left-10 text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest flex items-center gap-2 transition-all group">
                    <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
                </Link>

                <div className="w-full max-w-[400px] py-20 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Sign in to BizCode</h2>
                        <p className="text-sm text-slate-500 font-medium">Access your products, support, billing, and membership.</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 animate-in shake duration-500">
                            <ShieldCheck size={18} />
                            <p className="text-[11px] font-bold uppercase tracking-widest">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                                placeholder="you@company.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Password</label>
                                <Link to="/forgot-password" title="Standard recovery ignored in this pass" className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Forgot?</Link>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10">
                            Sign In
                        </button>
                    </form>

                    <div className="my-10 flex items-center gap-4">
                        <div className="h-px flex-1 bg-slate-100" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">Social Sign In</span>
                        <div className="h-px flex-1 bg-slate-100" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => handleOAuth('google')} className="flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 uppercase hover:bg-slate-50 transition-all shadow-sm">
                             Google
                        </button>
                        <button onClick={() => handleOAuth('github')} className="flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 uppercase hover:bg-slate-50 transition-all shadow-sm">
                             GitHub
                        </button>
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            New to the platform?{' '}
                            <Link to={redirectUrl ? `/register?redirect=${redirectUrl}` : "/register"} className="text-blue-600 hover:underline">Create Account</Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Login;
