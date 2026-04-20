import React, { useContext, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import api from '../../services/api';

const AIRecommendationModal = ({ isOpen, onClose, selectedTechStack }) => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    if (!isOpen) {
        return null;
    }

    const handleFetchAI = async () => {
        setLoading(true);
        setError('');
        setResponse('');

        try {
            const stack = selectedTechStack !== 'all' ? selectedTechStack : 'modern web stack';
            const result = await api.get(`/ai/recommend?techStack=${encodeURIComponent(stack)}`);
            setResponse(result.answer || result);
        } catch (err) {
            setError(err.message || 'Recommendations are unavailable right now.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpgradeClick = () => {
        onClose();
        navigate('/pricing');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                        <p className="ds-eyebrow">AI recommendations</p>
                        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Suggested starting points</h2>
                    </div>
                    <button type="button" onClick={onClose} className="ds-button-ghost">
                        Close
                    </button>
                </div>

                <div className="space-y-4 p-6">
                    {!user ? (
                        <div className="ds-card-muted p-5 text-sm text-slate-600">
                            Sign in to request recommendations based on the current catalog filters.
                        </div>
                    ) : user.subscriptionPlan !== 'pro' && user.role !== 'admin' ? (
                        <div className="ds-card-muted p-6">
                            <h3 className="text-lg font-semibold tracking-tight text-slate-900">Membership required</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Recommendations are available to members with broader platform access.
                            </p>
                            <button type="button" onClick={handleUpgradeClick} className="ds-button-primary mt-4">
                                View pricing
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="ds-card-muted p-4">
                                <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Current filter</p>
                                <p className="mt-2 text-sm font-medium text-slate-900">
                                    {selectedTechStack === 'all' ? 'All categories' : selectedTechStack}
                                </p>
                            </div>

                            {response ? (
                                <div className="ds-card max-h-[420px] overflow-y-auto p-5">
                                    <article className="markdown-content prose prose-slate max-w-none text-sm">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {typeof response === 'string' ? response : JSON.stringify(response)}
                                        </ReactMarkdown>
                                    </article>
                                </div>
                            ) : error ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            ) : (
                                <div className="ds-card-muted p-6 text-sm leading-6 text-slate-600">
                                    Generate a short list of products that fit the selected category.
                                </div>
                            )}

                            <div className="flex flex-wrap gap-3">
                                <button type="button" onClick={handleFetchAI} disabled={loading} className="ds-button-primary disabled:cursor-not-allowed disabled:opacity-50">
                                    {loading ? 'Generating...' : 'Generate recommendations'}
                                </button>
                                <button type="button" onClick={onClose} className="ds-button-secondary">
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIRecommendationModal;
