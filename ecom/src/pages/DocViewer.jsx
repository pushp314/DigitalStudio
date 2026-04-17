import React, { useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AuthContext from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import docService from '../services/docService';
import { FEATURES } from '../config/features';
import { normalizeDoc } from '../utils/normalizers';

const DocViewer = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const { info } = useToast();
    const navigate = useNavigate();
    const { data: rawDoc, isLoading: loading } = useQuery({
        queryKey: ['doc', id],
        queryFn: () => docService.getById(id),
    });

    const doc = rawDoc ? normalizeDoc(rawDoc) : null;

    const handleProtectedAccess = () => {
        if (!user) {
            info('Please login to access protected docs.');
            navigate('/login');
            return;
        }

        if (FEATURES.subscriptions) {
            navigate('/profile');
            return;
        }

        info('Premium access is currently managed outside the self-serve UI.');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!doc) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7]">
                <h2 className="text-3xl font-bold mb-4">Doc not found</h2>
                <Link to="/docs" className="text-blue-600 underline">Back to docs</Link>
            </div>
        );
    }

    const hasToc = doc.tableOfContents.length > 0;
    const showLockCta = doc.isPremium && doc.locked;

    return (
        <div className="min-h-screen bg-[#F5F5F7] py-24 md:py-32 font-sans">
            <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8">
                <div className="mb-8">
                    <Link to="/docs" className="text-primary font-bold hover:underline mb-4 inline-block">
                        ← Back to Docs
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black text-black mb-4">{doc.title}</h1>
                    <div className="flex flex-wrap items-center gap-4">
                        {doc.category && (
                            <span className="px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                                {doc.category}
                            </span>
                        )}
                        {doc.isPremium && (
                            <span className={`px-4 py-2 rounded-full text-sm font-bold ${doc.locked
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                                : 'bg-green-100 text-green-700'
                                }`}>
                                {doc.locked ? `Premium Preview • ${doc.formattedPrice}` : 'Unlocked'}
                            </span>
                        )}
                    </div>
                </div>

                <div className={`grid grid-cols-1 ${hasToc ? 'lg:grid-cols-4' : ''} gap-8`}>
                    {hasToc && (
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl p-6 border border-gray-100 sticky top-24">
                                <h3 className="font-black text-black mb-4">Contents</h3>
                                <ul className="space-y-2">
                                    {doc.tableOfContents.map((item) => (
                                        <li key={item.id}>
                                            <a href={`#section-${item.id}`} className="text-sm text-gray-600 hover:text-primary transition-colors">
                                                {item.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className={hasToc ? 'lg:col-span-3' : ''}>
                        <div className="bg-white rounded-2xl p-8 md:p-12 border border-gray-100 shadow-sm">
                            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                {doc.content}
                            </div>

                            {showLockCta && (
                                <div className="mt-12 p-8 bg-gradient-to-r from-primary to-blue-600 rounded-2xl text-white text-center">
                                    <h3 className="text-2xl font-black mb-4">Locked Premium Content</h3>
                                    <p className="text-lg mb-6 opacity-90">
                                        This page is showing preview content only. Full access is granted by the backend when the account has the correct entitlement or plan.
                                    </p>
                                    <button
                                        onClick={handleProtectedAccess}
                                        className="bg-white text-primary px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
                                    >
                                        {user ? 'Check Access' : 'Login to Continue'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocViewer;
