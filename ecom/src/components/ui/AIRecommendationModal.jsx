import React, { useState, useContext } from 'react';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';

const AIRecommendationModal = ({ isOpen, onClose, selectedTechStack }) => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState('');
    const [error, setError] = useState('');

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-3xl w-full max-w-xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#F5F5F7]">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#0055FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Recommendations
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        <div className="text-center py-8 bg-blue-50 text-blue-800 rounded-xl">
                            <h3 className="font-bold text-lg mb-2">Pro Feature ✨</h3>
                            <p className="mb-4">Upgrade to our Pro Plan to access AI-powered personalized module curations.</p>
                            <button className="bg-[#0055FF] text-white px-6 py-2 rounded-lg font-bold">Upgrade Now</button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                <p className="text-sm font-bold text-gray-700">Refining stack: "{selectedTechStack === 'all' ? 'Modern Frameworks' : selectedTechStack}"</p>
                            </div>
                            
                            {response ? (
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                    <div className="prose prose-sm text-gray-700 whitespace-pre-wrap">{response.answer || response}</div>
                                </div>
                            ) : error ? (
                                <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-medium">{error}</div>
                            ) : (
                                <div className="text-center py-10">
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0055FF] mx-auto"></div>
                                    ) : (
                                        <button 
                                            onClick={handleFetchAI}
                                            className="bg-[#0055FF] hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md"
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
