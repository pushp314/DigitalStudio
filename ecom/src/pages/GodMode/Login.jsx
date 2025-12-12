import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const GodModeLogin = () => {
    const [email, setEmail] = useState('admin@codestudio.com');
    const [password, setPassword] = useState('admin');
    const { login, user, error } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.role === 'admin') {
            navigate('/godmode/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await login(email, password);
    };

    return (
        <div className="min-h-screen bg-black flex flex-col justify-center items-center font-mono">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

            <div className="w-full max-w-md p-8 bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl shadow-2xl relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tighter">GOD MODE</h1>
                    <p className="text-zinc-500 text-sm">System Administration Access</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-zinc-400 text-xs uppercase font-bold mb-2">Identifier</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black border border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                            placeholder="admin@codestudio.com"
                        />
                    </div>
                    <div>
                        <label className="block text-zinc-400 text-xs uppercase font-bold mb-2">Passkey</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black border border-zinc-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors mt-4"
                    >
                        INITIALIZE SESSION
                    </button>
                    <p className="text-xs text-zinc-600 text-center mt-4">
                        Restricted Access. All IP addresses are logged.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default GodModeLogin;
