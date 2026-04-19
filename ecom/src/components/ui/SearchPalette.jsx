import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import productService from '../../services/productService';
import { normalizeProduct } from '../../utils/normalizers';
import docService from '../../services/docService';

const SearchPalette = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Fetch products and docs based on query
    const { data, isLoading } = useQuery({
        queryKey: ['search-palette', query],
        queryFn: async () => {
            if (query.length < 2) return { products: [], docs: [] };
            const [productsRes, docsRes] = await Promise.all([
                productService.getAll(query),
                docService.getAll('', query)
            ]);
            return {
                products: Array.isArray(productsRes) ? productsRes.map(normalizeProduct) : [],
                docs: Array.isArray(docsRes) ? docsRes : []
            };
        },
        enabled: isOpen && query.length > 1
    });

    const products = data?.products || [];
    const docs = data?.docs || [];
    
    // Combine for selection logic
    const allResults = [
        ...products.map(p => ({ ...p, type: 'template' })),
        ...docs.map(d => ({ ...d, type: 'doc' }))
    ];

    // Keyboard shortcuts handled centrally in App.jsx

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setSelectedIndex(0);
        } else {
            setQuery('');
        }
    }, [isOpen]);

    // Handle selection
    const handleSelect = (item) => {
        onClose();
        if (item.type === 'template') {
            navigate(`/templates/${item.id}`);
        } else {
            navigate(`/docs/${item.id}`);
        }
    };

    // Navigation inside results
    useEffect(() => {
        const handleKeys = (e) => {
            if (!isOpen) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && allResults[selectedIndex]) {
                e.preventDefault();
                handleSelect(allResults[selectedIndex]);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [isOpen, allResults, selectedIndex]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 sm:px-6">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl shadow-blue-500/10 border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Search Header */}
                <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-50">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search templates, components, docs..."
                        className="flex-grow bg-transparent border-none outline-none text-xl font-medium text-black placeholder-gray-400"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        esc
                    </div>
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {query.length === 0 ? (
                        <div className="p-10 text-center">
                            <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" strokeDasharray="4 4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-black mb-1">Quick Search</h3>
                            <p className="text-gray-500 text-sm">Find templates, full-stack projects, and documentation instantly.</p>
                        </div>
                    ) : isLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Searching...</span>
                        </div>
                    ) : allResults.length > 0 ? (
                        <div className="space-y-4">
                            {products.length > 0 && (
                                <div className="space-y-1">
                                    <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Templates & Products</div>
                                    {products.map((item, index) => (
                                        <button
                                            key={item.id}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${
                                                index === selectedIndex ? 'bg-primary/5 border-l-4 border-primary translate-x-1' : 'hover:bg-gray-50'
                                            }`}
                                            onClick={() => handleSelect(item)}
                                        >
                                            <div className="w-12 h-12 rounded-xl border border-gray-100 overflow-hidden shrink-0 bg-gray-50">
                                                <img src={item.image} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center justify-between gap-4">
                                                    <h4 className="font-bold text-black truncate">{item.title}</h4>
                                                    <span className="text-primary font-black text-sm">${item.price}</span>
                                                </div>
                                                <p className="text-[13px] text-gray-500 truncate">{item.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {docs.length > 0 && (
                                <div className="space-y-1">
                                    <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Documentation</div>
                                    {docs.map((item, index) => {
                                        const globalIndex = products.length + index;
                                        return (
                                            <button
                                                key={item.id}
                                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${
                                                    globalIndex === selectedIndex ? 'bg-amber-50 border-l-4 border-amber-400 translate-x-1' : 'hover:bg-gray-50'
                                                }`}
                                                onClick={() => handleSelect({ ...item, type: 'doc' })}
                                            >
                                                <div className="w-12 h-12 rounded-xl border border-gray-100 flex items-center justify-center shrink-0 bg-amber-50 text-amber-500">
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18.477 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <h4 className="font-bold text-black truncate">{item.title}</h4>
                                                    <p className="text-[13px] text-gray-500 truncate">{item.description}</p>
                                                </div>
                                                {item.isPremium && (
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded uppercase">Premium</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-20 text-center">
                            <div className="text-gray-300 mb-2">
                                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="font-bold text-gray-500">No results for "{query}"</h3>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 grayscale opacity-60">
                            <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[9px] font-bold shadow-sm">↵</span>
                            <span className="text-[11px] font-bold text-gray-500">to select</span>
                        </div>
                        <div className="flex items-center gap-1.5 grayscale opacity-60">
                            <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[9px] font-bold shadow-sm">↑↓</span>
                            <span className="text-[11px] font-bold text-gray-500">to navigate</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-400">Powered by</span>
                        <span className="text-[11px] font-black text-primary tracking-tight">CODESTUDIO</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchPalette;
