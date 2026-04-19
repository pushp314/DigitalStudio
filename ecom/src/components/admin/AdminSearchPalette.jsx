import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import userService from '../../services/userService';
import orderService from '../../services/orderService';
import productService from '../../services/productService';
import docService from '../../services/docService';

const AdminSearchPalette = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    const { data: results, isLoading } = useQuery({
        queryKey: ['admin-search', query],
        queryFn: async () => {
            if (query.length < 2) return { users: [], orders: [], products: [], docs: [] };
            const [users, orders, products, docs] = await Promise.all([
                userService.adminList(), // We'll filter client-side for simplicity if no search endpoint
                orderService.adminList('all'),
                productService.getAll(),
                docService.getAll()
            ]);

            const q = query.toLowerCase();
            return {
                users: (users || []).filter(u => u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q)).slice(0, 5),
                orders: (orders || []).filter(o => String(o.id).toLowerCase().includes(q)).slice(0, 5),
                products: (products || []).filter(p => p.title?.toLowerCase().includes(q)).slice(0, 5),
                docs: (docs || []).filter(d => d.title?.toLowerCase().includes(q)).slice(0, 5),
            };
        },
        enabled: isOpen && query.length > 1
    });

    const flatResults = [
        ...(results?.users || []).map(u => ({ ...u, type: 'user', icon: '👤', label: u.name, sub: u.email })),
        ...(results?.orders || []).map(o => ({ ...o, type: 'order', icon: '💳', label: `Order #${String(o.id).slice(-8)}`, sub: `Value: ₹${o.totalPrice}` })),
        ...(results?.products || []).map(p => ({ ...p, type: 'product', icon: '💎', label: p.title, sub: `Product Template` })),
        ...(results?.docs || []).map(d => ({ ...d, type: 'doc', icon: '📚', label: d.title, sub: `Documentation` })),
    ];

    useEffect(() => {
        const handleKeys = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                onClose();
            }
            if (isOpen) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1));
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
                    e.preventDefault();
                    handleSelect(flatResults[selectedIndex]);
                } else if (e.key === 'Escape') {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [isOpen, flatResults, selectedIndex, onClose]);

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
        const routes = {
            user: '/admin/users',
            order: '/admin/orders',
            product: `/admin/product/${item.id}/edit`,
            doc: `/admin/doc/${item.id}/edit`,
        };
        navigate(routes[item.type]);
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl transition-all" onClick={onClose} />
            <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-4 px-8 py-6 border-b border-gray-50 bg-gray-50/50">
                    <span className="text-xl grayscale opacity-40">🔍</span>
                    <input
                        ref={inputRef}
                        className="flex-grow bg-transparent border-none outline-none text-lg font-black text-black placeholder-gray-300 tracking-tight"
                        placeholder="Jump to User, Order, or Asset..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <div className="flex items-center gap-2" onClick={onClose}>
                        <kbd className="flex items-center justify-center p-1.5 min-w-[2rem] bg-white border border-gray-100 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-widest shadow-sm hover:bg-black hover:text-white transition-all cursor-pointer">esc</kbd>
                    </div>
                </div>

                <div className="max-h-[50vh] overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {query.length < 2 ? (
                        <div className="py-16 text-center space-y-6">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-3xl border border-gray-100/50 shadow-inner">⌨️</div>
                            <div>
                                <h3 className="text-sm font-black text-black tracking-widest uppercase mb-1">Command Hub</h3>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">Universal Intelligence Interface</p>
                            </div>
                        </div>
                    ) : isLoading ? (
                        <div className="p-16 text-center animate-pulse space-y-3">
                            <div className="w-6 h-6 border-3 border-gray-100 border-t-black rounded-full mx-auto animate-spin"></div>
                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">Indexing stream...</p>
                        </div>
                    ) : flatResults.length > 0 ? (
                        flatResults.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSelect(item)}
                                className={`w-full flex items-center gap-5 p-5 rounded-xl transition-all duration-300 text-left group relative overflow-hidden ${
                                    idx === selectedIndex 
                                    ? 'bg-black text-white shadow-xl scale-[1.01] z-10' 
                                    : 'hover:bg-gray-50/80 active:scale-95'
                                }`}
                            >
                                {idx === selectedIndex && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full -translate-y-4 translate-x-4"></div>
                                )}
                                <span className={`text-2xl transition-transform duration-500 ${idx === selectedIndex ? 'scale-110 grayscale-0' : 'grayscale opacity-30 group-hover:opacity-100 group-hover:grayscale-0'}`}>
                                    {item.icon}
                                </span>
                                <div className="flex-1 min-w-0 relative z-10">
                                    <p className={`font-black tracking-tight text-sm leading-none mb-1.5 ${idx === selectedIndex ? 'text-white' : 'text-black'}`}>{item.label}</p>
                                    <p className={`text-[9px] font-bold uppercase tracking-widest ${idx === selectedIndex ? 'text-white/40' : 'text-gray-400'}`}>{item.sub}</p>
                                </div>
                                <span className={`relative z-10 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-all duration-500 ${
                                    idx === selectedIndex 
                                    ? 'bg-white/10 text-white' 
                                    : 'bg-gray-100 text-gray-400 group-hover:bg-black group-hover:text-white'
                                }`}>
                                    {item.type}
                                </span>
                            </button>
                        ))
                    ) : (
                        <div className="p-24 text-center space-y-4">
                            <div className="text-3xl opacity-20 grayscale">🛰️</div>
                            <p className="text-gray-300 font-black uppercase text-[9px] tracking-[0.3em]">No entities found in registry</p>
                        </div>
                    )}
                </div>

                <div className="px-8 py-5 bg-gray-50/50 flex justify-between items-center border-t border-gray-100/50">
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2.5 opacity-40">
                            <kbd className="px-1.5 py-0.5 bg-white border border-gray-100 rounded text-[9px] font-black shadow-sm">ENT</kbd>
                            <span className="text-[8px] font-black uppercase tracking-widest">Open</span>
                        </div>
                        <div className="flex items-center gap-2.5 opacity-40">
                            <kbd className="px-1.5 py-0.5 bg-white border border-gray-100 rounded text-[9px] font-black shadow-sm">↑↓</kbd>
                            <span className="text-[8px] font-black uppercase tracking-widest">Navigate</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSearchPalette;
