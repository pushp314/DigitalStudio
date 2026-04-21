import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { Loader2, ChevronLeft, ShieldCheck } from 'lucide-react';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register, user, loading } = useContext(AuthContext);
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
        const referrerCode = sessionStorage.getItem('ds_partner_ref');
        const result = await register(name, email, password, referrerCode);

        if (result.success) {
            sessionStorage.removeItem('ds_partner_ref');
            if (redirectUrl) {
                navigate(`/${redirectUrl}`);
            } else {
                navigate('/account');
            }
            return;
        }

        setError(result.error);
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
                    alt="DigitalStudio workspace" 
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-12 left-12 right-12 z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 text-white font-bold">D</div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest">DigitalStudio</h2>
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight leading-tight mb-4 max-w-xl">
                        Start with a ready product or ask us to build.
                    </h1>
                    <p className="text-slate-300 font-medium max-w-md">
                        Create an account to buy products, request support, join the community, or submit your own project for listing.
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
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Create a DigitalStudio account</h2>
                        <p className="text-sm text-slate-500 font-medium">Buy ready apps, get expert help, or submit your own project.</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 animate-in shake duration-500">
                            <ShieldCheck size={18} />
                            <p className="text-[11px] font-bold uppercase tracking-widest">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                                placeholder="Your full name"
                                required
                            />
                        </div>

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
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                                placeholder="Create a password"
                                required
                            />
                        </div>

                        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10">
                            Sign Up
                        </button>
                    </form>

                    <p className="mt-10 text-center text-[9px] text-slate-400 font-bold uppercase leading-relaxed tracking-wider">
                        By creating an account, you agree to our <Link to="/terms" className="text-slate-900 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-slate-900 hover:underline">Privacy Policy</Link>.
                    </p>

                    <div className="mt-12 text-center pt-8 border-t border-slate-50">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            Already have an account?{' '}
                            <Link to={redirectUrl ? `/login?redirect=${redirectUrl}` : "/login"} className="text-blue-600 hover:underline">Sign In</Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Register;
