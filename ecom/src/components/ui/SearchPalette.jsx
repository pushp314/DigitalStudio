import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import productService from '../../services/productService';
import { normalizeProduct } from '../../utils/normalizers';
import docService from '../../services/docService';
import { useDebounce } from '../../hooks/useDebounce';

const SearchPalette = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 300);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ['search-palette', debouncedQuery],
        queryFn: async () => {
            if (debouncedQuery.length < 2) {
                return { products: [], docs: [] };
            }

            const [productsRes, docsRes] = await Promise.all([
                productService.getAll(debouncedQuery),
                docService.getAll('', debouncedQuery),
            ]);

            return {
                products: Array.isArray(productsRes) ? productsRes.map(normalizeProduct) : [],
                docs: Array.isArray(docsRes) ? docsRes : [],
            };
        },
        enabled: isOpen && debouncedQuery.length > 1,
    });

    const products = data?.products || [];
    const docs = data?.docs || [];
    const allResults = [
        ...products.map((product) => ({ ...product, type: 'product' })),
        ...docs.map((doc) => ({ ...doc, type: 'doc' })),
    ];

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setSelectedIndex(0);
        } else {
            setQuery('');
        }
    }, [isOpen]);

    const handleSelect = (item) => {
        onClose();
        if (item.type === 'product') {
            navigate(`/apps/${item.id}`);
            return;
        }

        navigate(`/docs/${item.id}`);
    };

    useEffect(() => {
        const handleKeys = (event) => {
            if (!isOpen) {
                return;
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSelectedIndex((current) => Math.min(current + 1, allResults.length - 1));
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSelectedIndex((current) => Math.max(current - 1, 0));
            } else if (event.key === 'Enter' && allResults[selectedIndex]) {
                event.preventDefault();
                handleSelect(allResults[selectedIndex]);
            } else if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [allResults, isOpen, onClose, selectedIndex]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[15vh] sm:px-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center gap-4 border-b border-slate-200 px-6 py-5">
                    <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search products and docs"
                        className="flex-grow bg-transparent text-lg font-medium text-slate-900 outline-none placeholder:text-slate-400"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        esc
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {query.length === 0 ? (
                        <div className="p-10 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="mb-1 text-xl font-semibold tracking-tight text-slate-900">Quick search</h3>
                            <p className="text-sm text-slate-600">Find products and documentation from anywhere in the site.</p>
                        </div>
                    ) : isLoading ? (
                        <div className="flex flex-col items-center justify-center gap-4 p-20">
                            <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
                            <span className="text-sm font-medium text-slate-500">Searching...</span>
                        </div>
                    ) : allResults.length > 0 ? (
                        <div className="space-y-4">
                            {products.length > 0 && (
                                <div className="space-y-1">
                                    <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Products</div>
                                    {products.map((item, index) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className={`flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors ${
                                                index === selectedIndex ? 'bg-slate-100' : 'hover:bg-slate-50'
                                            }`}
                                            onClick={() => handleSelect(item)}
                                        >
                                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                                <img src={item.image} alt="" className="h-full w-full object-cover" />
                                            </div>
                                            <div className="min-w-0 flex-grow">
                                                <div className="flex items-center justify-between gap-4">
                                                    <h4 className="truncate font-semibold text-slate-900">{item.title}</h4>
                                                    <span className="text-sm font-semibold text-slate-900">{item.formattedPrice}</span>
                                                </div>
                                                <p className="truncate text-[13px] text-slate-500">{item.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {docs.length > 0 && (
                                <div className="space-y-1">
                                    <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Documentation</div>
                                    {docs.map((item, index) => {
                                        const globalIndex = products.length + index;
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                className={`flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors ${
                                                    globalIndex === selectedIndex ? 'bg-slate-100' : 'hover:bg-slate-50'
                                                }`}
                                                onClick={() => handleSelect({ ...item, type: 'doc' })}
                                            >
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
                                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18.477 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                </div>
                                                <div className="min-w-0 flex-grow">
                                                    <h4 className="truncate font-semibold text-slate-900">{item.title}</h4>
                                                    <p className="truncate text-[13px] text-slate-500">{item.description}</p>
                                                </div>
                                                {item.isPremium && (
                                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                                        Paid
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-20 text-center">
                            <div className="mb-2 text-slate-300">
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="font-medium text-slate-600">No results for "{query}"</h3>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">↵</span>
                            <span className="text-[11px] font-medium text-slate-500">select</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">↑↓</span>
                            <span className="text-[11px] font-medium text-slate-500">navigate</span>
                        </div>
                    </div>

                    <div className="text-[11px] font-medium text-slate-500">Search across products and docs</div>
                </div>
            </div>
        </div>
    );
};

export default SearchPalette;
