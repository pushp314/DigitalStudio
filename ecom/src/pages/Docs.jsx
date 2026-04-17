import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import docService from '../services/docService';
import { useToast } from '../context/ToastContext';
import { normalizeDoc } from '../utils/normalizers';

const Docs = () => {
    const { error } = useToast();
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const data = await docService.getAll();
                setDocs(Array.isArray(data) ? data.map(normalizeDoc) : []);
            } catch (err) {
                error(err.message || 'Failed to load docs');
            } finally {
                setLoading(false);
            }
        };

        fetchDocs();
    }, [error]);

    const categories = useMemo(() => ['all', ...new Set(docs.map((doc) => doc.category).filter(Boolean))], [docs]);
    const filteredDocs = filter === 'all' ? docs : docs.filter((doc) => doc.category === filter);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0055FF] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] px-4 md:px-6 lg:px-8 py-24 md:py-32 font-sans">
            <div className="max-w-[1400px] mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-black text-black mb-4">Premium Documentation</h1>
                    <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                        Technical walkthroughs, implementation notes, and premium write-ups pulled directly from the live docs API.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center mb-12">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setFilter(category)}
                            className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${filter === category
                                ? 'bg-[#0055FF] text-white shadow-lg shadow-blue-500/30'
                                : 'bg-white text-black hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            {category === 'all' ? 'All' : category}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {filteredDocs.map((doc) => (
                        <div key={doc.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                                    {doc.icon || '📄'}
                                </div>
                                {doc.isPremium ? (
                                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
                                        PREMIUM
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full">
                                        FREE
                                    </span>
                                )}
                            </div>

                            <h3 className="text-xl font-black text-black mb-2 group-hover:text-[#0055FF] transition-colors">
                                {doc.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                {doc.description || doc.previewContent || 'Technical documentation preview.'}
                            </p>

                            {doc.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {doc.tags.map((tag) => (
                                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="text-2xl font-black text-black">{doc.formattedPrice}</div>
                                <Link
                                    to={`/docs/${doc.id}`}
                                    className="bg-[#0055FF] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-600 transition-colors"
                                >
                                    {doc.isPremium ? 'Read Preview' : 'Read'}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-gradient-to-r from-[#0055FF] to-blue-600 rounded-2xl p-8 md:p-12 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-black mb-4">Need More Premium Access?</h2>
                    <p className="text-lg mb-6 opacity-90">
                        Protected docs now respect backend access flags and preview content. Upgrade or assign eligible plans before exposing full content.
                    </p>
                    <Link
                        to="/profile"
                        className="inline-block bg-white text-[#0055FF] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
                    >
                        View Account
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Docs;
