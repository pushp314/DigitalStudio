import React, { useEffect, useMemo, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import docService from '../services/docService';
import { useToast } from '../context/ToastContext';
import { normalizeDoc } from '../utils/normalizers';
import ConfigContext from '../context/ConfigContext';

const Docs = () => {
    const { config } = useContext(ConfigContext);
    const { error } = useToast();
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const navigate = useNavigate();

    // Feature Enforcement
    useEffect(() => {
        if (config && config.features && config.features.docs === false) {
            navigate('/');
        }
    }, [config, navigate]);

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
    
    const filteredDocs = useMemo(() => {
        return docs.filter((doc) => {
            const matchesFilter = filter === 'all' || doc.category === filter;
            const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesFilter && matchesSearch;
        });
    }, [docs, filter, searchQuery]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] px-4 md:px-6 lg:px-8 py-24 md:py-32 font-sans">
            <div className="max-w-[1400px] mx-auto">
                {/* Search & Filter Bar */}
                <div className="bg-white rounded-3xl p-4 shadow-xl shadow-gray-200/50 mb-12 border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input 
                            type="text" 
                            placeholder="Search guides, tags, or topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-black placeholder:text-gray-400"
                        />
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 px-2 border-r border-gray-100 pr-4">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setFilter(category)}
                                    className={`px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${filter === category
                                        ? 'bg-black text-white shadow-lg'
                                        : 'bg-white text-gray-500 hover:bg-gray-50 border border-transparent'
                                        }`}
                                >
                                    {category === 'all' ? 'All Guides' : category}
                                </button>
                            ))}
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-2xl">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                        {filteredDocs.map((doc) => (
                            <Link 
                                to={`/docs/${doc.id}`} 
                                key={doc.id} 
                                className="group flex flex-col bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden h-full"
                            >
                                {/* Thumbnail Image */}
                                <div className="relative h-48 overflow-hidden">
                                    {doc.image ? (
                                        <img 
                                            src={doc.image} 
                                            alt={doc.title} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-4xl">
                                            {doc.icon || '📄'}
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                                        {doc.isPremium ? (
                                            <span className="px-4 py-1.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/20">Premium</span>
                                        ) : (
                                            <span className="px-4 py-1.5 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-green-500/20">Free</span>
                                        )}
                                    </div>
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur shadow-sm px-3 py-1 rounded-full text-[10px] font-bold text-gray-900 uppercase tracking-wider">
                                        {doc.category}
                                    </div>
                                </div>

                                <div className="p-8 flex flex-col flex-1 relative">
                                    <h3 className="text-2xl font-black text-black mb-3 leading-tight group-hover:text-primary transition-colors line-clamp-2">{doc.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2 flex-1">{doc.description || doc.previewContent}</p>
                                    
                                    <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Pass Required</p>
                                            <div className="text-sm font-black text-black">
                                                {doc.isPremium ? '💎 DigitalStudio Pro' : '✅ Free Content'}
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all shadow-lg">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 mb-16">
                        {filteredDocs.map((doc) => (
                            <Link 
                                to={`/docs/${doc.id}`} 
                                key={doc.id} 
                                className="group flex items-center bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all gap-6"
                            >
                                <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 relative shadow-inner">
                                    {doc.image ? (
                                        <img src={doc.image} alt={doc.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-3xl">
                                            {doc.icon || '📄'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-xl font-black text-black group-hover:text-primary transition-colors">{doc.title}</h3>
                                        <span className="px-3 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-black uppercase rounded-full">
                                            {doc.category}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-sm line-clamp-1">{doc.description || doc.previewContent}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                        {doc.isPremium ? (
                                            <span className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1">
                                                <span className="text-xs">💎</span> Pro Membership
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-black text-green-500 uppercase flex items-center gap-1">
                                                <span className="text-xs">✅</span> Free Access
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all mr-4">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-8 md:p-12 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-black mb-4">Need More Premium Access?</h2>
                    <p className="text-lg mb-6 opacity-90">
                        Unlock premium guides and tutorials with a DigitalStudio Pro membership. Access exclusive resources to boost your workflow.
                    </p>
                    <Link
                        to="/profile"
                        className="inline-block bg-white text-primary px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
                    >
                        View Account
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Docs;
