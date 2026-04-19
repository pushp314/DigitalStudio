import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import productService from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { normalizeProduct } from '../../utils/normalizers';

const ProductList = () => {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();
    const [selectedIds, setSelectedIds] = useState([]);

    const { data: productData, isLoading: loading, error } = useQuery({
        queryKey: ['products'],
        queryFn: () => productService.getAll(),
    });

    const products = useMemo(() => 
        Array.isArray(productData) ? productData.map(normalizeProduct) : [],
    [productData]);

    const deleteMutation = useMutation({
        mutationFn: (id) => productService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            success('Product deleted successfully');
        },
    });

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        setSelectedIds(prev => prev.length === products.length ? [] : products.map(p => p.id));
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedIds.length} items forever?`)) return;
        try {
            await Promise.all(selectedIds.map(id => productService.delete(id)));
            queryClient.invalidateQueries({ queryKey: ['products'] });
            success('Items deleted successfully');
            setSelectedIds([]);
        } catch (err) {
            toastError('Some items could not be deleted');
        }
    };

    if (loading) return (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-20 text-center animate-pulse">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Inventory...</p>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-12 text-red-500">
            <h3 className="text-xs font-bold uppercase tracking-widest">Connection Error</h3>
            <p className="text-sm font-medium">{error.message}</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-700 relative" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            {/* Enterprise Toolbar - Dense */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 rounded-bl-full -translate-y-4 translate-x-4"></div>
                <div className="relative z-10">
                    <h2 className="text-xl font-black text-black tracking-tight leading-none mb-3">Master Inventory</h2>
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-widest">{products.length} Items</span>
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Registry Synchronized
                        </span>
                    </div>
                </div>
                <button 
                    onClick={() => navigate('/admin/product/new')} 
                    className="relative z-10 px-8 py-3.5 bg-black text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20 flex items-center gap-2"
                >
                    <span>+</span> New Asset
                </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-gray-100">
                                <th className="px-6 py-5 w-8 text-center">
                                    <input type="checkbox" checked={selectedIds.length === products.length && products.length > 0} onChange={toggleSelectAll} className="w-4 h-4 accent-black rounded-lg cursor-pointer" />
                                </th>
                                <th className="px-6 py-5">Template Identity</th>
                                <th className="px-6 py-5">Pricing</th>
                                <th className="px-6 py-5">Classification</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <tr key={product.id} className={`hover:bg-gray-50/30 transition-all group ${selectedIds.includes(product.id) ? 'bg-gray-50/50' : ''}`}>
                                        <td className="px-6 py-4 text-center">
                                            <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleSelect(product.id)} className="w-4 h-4 accent-black rounded-lg cursor-pointer" />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-500">
                                                    {product.image ? (
                                                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xl grayscale">📦</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-black text-sm truncate tracking-tight mb-0.5">{product.title}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                                        ID: <span className="font-mono text-gray-400">{String(product.id || '').slice(-8)}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-black tracking-tighter">₹{product.price}</span>
                                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Base Rate</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1.5 bg-gray-50 border border-gray-100 text-black text-[9px] font-black rounded-lg uppercase tracking-widest">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                <span className="text-[9px] font-black text-black uppercase tracking-widest">Active</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <button
                                                    onClick={() => navigate(`/admin/product/${product.id}/edit`)}
                                                    className="w-9 h-9 bg-white border border-gray-100 text-black hover:bg-black hover:text-white rounded-xl transition-all shadow-sm flex items-center justify-center"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if(window.confirm('Erase this template?')) deleteMutation.mutate(product.id);
                                                    }}
                                                    className="w-9 h-9 bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-40 text-center">
                                        <p className="text-[9px] font-black uppercase text-gray-300 tracking-[0.4em]">Inventory Empty</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductList;
