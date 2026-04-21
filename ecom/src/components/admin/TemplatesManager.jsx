import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import productService from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { normalizeProduct } from '../../utils/normalizers';
import { 
    Plus, 
    Trash2, 
    Edit3, 
    Package, 
    Layers, 
    Tag, 
    DollarSign,
    MoreVertical,
    FileText,
    Archive
} from 'lucide-react';
import ConfirmationModal from '../ui/ConfirmationModal';

const TemplatesManager = () => {
    const queryClient = useQueryClient();
    const { success, error: toastError, info } = useToast();
    const navigate = useNavigate();
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
    const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

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
            success('Product removed from catalog.');
        },
    });

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        setSelectedIds(prev => prev.length === products.length ? [] : products.map(p => p.id));
    };

    const handleBulkDelete = async () => {
        try {
            await Promise.all(selectedIds.map(id => productService.delete(id)));
            queryClient.invalidateQueries({ queryKey: ['products'] });
            success('Batch deletion successful.');
            setSelectedIds([]);
        } catch (err) {
            toastError('Some assets persisted. Verify permissions.');
        }
    };

    if (loading) return (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Products...</p>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-red-600">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Catalog Error</h3>
            <p className="text-sm font-medium">{error.message}</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            <ConfirmationModal 
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={() => {
                    deleteMutation.mutate(deleteModal.id);
                    setDeleteModal({ isOpen: false, id: null });
                }}
                title="Confirm Product Deletion"
                message="Are you sure you want to permanently delete this product? Associated catalog data will be removed."
                confirmText="Delete Product"
                type="danger"
                isLoading={deleteMutation.isPending}
            />

            <ConfirmationModal 
                isOpen={bulkDeleteModal}
                onClose={() => setBulkDeleteModal(false)}
                onConfirm={async () => {
                    await handleBulkDelete();
                    setBulkDeleteModal(false);
                }}
                title="Confirm Batch Deletion"
                message={`Permanently delete ${selectedIds.length} products? This operation is irreversible and will impact the live catalog.`}
                confirmText={`Delete Selected (${selectedIds.length})`}
                type="danger"
            />

            {/* Professional Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-xl border border-slate-200">
                <div>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight mb-1">Product Catalog</h2>
                    <p className="text-xs text-slate-500">Manage ready apps, software kits, pricing, and approval status.</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                        <button 
                            onClick={() => setBulkDeleteModal(true)}
                            className="px-6 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 border border-red-100"
                        >
                            <Trash2 size={14} />
                            Delete ({selectedIds.length})
                        </button>
                    )}
                    <button 
                        onClick={() => navigate('/admin/templates/new')} 
                        className="px-6 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={16} /> New Product
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.length === products.length && products.length > 0} 
                                        onChange={toggleSelectAll} 
                                        className="w-4 h-4 accent-slate-900 rounded border-slate-300" 
                                    />
                                </th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Product Identity</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Licensing</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Classification</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <tr key={product.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.includes(product.id) ? 'bg-slate-50/80' : ''}`}>
                                        <td className="px-6 py-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.includes(product.id)} 
                                                onChange={() => toggleSelect(product.id)} 
                                                className="w-4 h-4 accent-slate-900 rounded border-slate-300" 
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                                    {product.image ? (
                                                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package size={16} className="text-slate-300" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 text-sm truncate uppercase tracking-tight">{product.title}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium font-mono">TPS_{String(product.id || '').toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 tracking-tight">₹{product.price}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Standard License</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-slate-50 border border-slate-100 text-slate-600 text-[9px] font-bold rounded-lg uppercase tracking-widest flex items-center gap-1.5 w-fit">
                                                <Layers size={10} />
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Live</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                <button
                                                    onClick={() => navigate(`/admin/templates/${product.id}/edit`)}
                                                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                                                    title="Edit Product"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, id: product.id })}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-40 text-center">
                                        <Archive size={40} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-[10px] font-bold uppercase text-slate-300 tracking-[0.4em]">Product catalog empty</p>
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

export default TemplatesManager;
