import React, { useState, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import api from '../../services/api';

const AIRecommendationModal = ({ isOpen, onClose, selectedTechStack }) => {
    const { user } = useContext(AuthContext);
    const { data: rawUser } = useContext(AuthContext); // Just in case
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleFetchAI = async () => {
        setLoading(true);
        setError('');
        setResponse('');
        
        try {
            const stack = selectedTechStack !== 'all' ? selectedTechStack : 'modern web tech';
            const res = await api.get(`/ai/recommend?techStack=${encodeURIComponent(stack)}`);
            setResponse(res.answer || res);
        } catch (err) {
            setError(err.message || 'Failed to fetch recommendations. Ensure you are on a Pro plan.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpgradeClick = () => {
        onClose();
        navigate('/pricing');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all animate-in zoom-in duration-200">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-black flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        AI Curated Path
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="p-6">
                    {!user ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600 mb-4">Please sign in to use personalized AI features.</p>
                        </div>
                    ) : user.subscriptionPlan !== 'pro' && user.role !== 'admin' ? (
                        <div className="text-center py-10 px-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl">
                            <div className="text-3xl mb-4">✨</div>
                            <h3 className="font-black text-blue-900 text-lg mb-2">Pro Feature</h3>
                            <p className="text-blue-700/80 mb-6 text-sm">Upgrade to our Pro Plan to access AI-powered personalized module curations and roadmap generation.</p>
                            <button 
                                onClick={handleUpgradeClick}
                                className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                            >
                                Upgrade Now
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Target Stack</p>
                                <p className="text-sm font-black text-black">{selectedTechStack === 'all' ? 'All Modern Frameworks' : selectedTechStack}</p>
                            </div>
                            
                            {response ? (
                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    <article className="markdown-content text-sm">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {typeof response === 'string' ? response : (response.answer || JSON.stringify(response))}
                                        </ReactMarkdown>
                                    </article>
                                </div>
                            ) : error ? (
                                <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-medium">{error}</div>
                            ) : (
                                <div className="text-center py-10">
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                    ) : (
                                        <button 
                                            onClick={handleFetchAI}
                                            className="bg-primary hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md"
                                        >
                                            Generate AI Curated Recommendations
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIRecommendationModal;
