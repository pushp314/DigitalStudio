import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import docService from '../../services/docService';
import { useToast } from '../../context/ToastContext';
import { normalizeDoc } from '../../utils/normalizers';

const DocsManager = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { success, error } = useToast();

    const { data: docData, isLoading: loading } = useQuery({
        queryKey: ['docs'],
        queryFn: () => docService.getAll(),
    });

    const docs = useMemo(() => 
        Array.isArray(docData) ? docData.map(normalizeDoc) : [],
    [docData]);

    const deleteMutation = useMutation({
        mutationFn: (id) => docService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['docs'] });
            success('Documentation asset deleted');
        },
        onError: (err) => error(err.message || 'Failed to delete doc'),
    });

    const handleDelete = (id) => {
        if (!window.confirm('Are you sure you want to delete this documentation?')) return;
        deleteMutation.mutate(id);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-black">Technical Documentation</h2>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Manage your premium guides and setup manuals</p>
                </div>
                <button
                    onClick={() => navigate('/admin/doc/new')}
                    className="bg-black text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10"
                >
                    + Create New Doc
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Synchronizing Docs...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Title</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Section</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tier</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {docs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg">{doc.icon || '📄'}</div>
                                                <span className="text-sm font-bold text-black">{doc.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm text-gray-500 font-medium">
                                            {doc.section || 'General'}
                                        </td>
                                        <td className="px-8 py-6 text-sm font-bold text-black">
                                            {doc.formattedPrice}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${doc.isPremium ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                                {doc.isPremium ? 'Premium' : 'Public'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => navigate(`/admin/doc/${doc.id}/edit`)} 
                                                    className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-black hover:border-black transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(doc.id)} 
                                                    disabled={deleteMutation.isPending}
                                                    className="p-2.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-50"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Index', value: docs.length, color: 'text-black' },
                    { label: 'Monetized', value: docs.filter(d => d.isPremium).length, color: 'text-amber-600' },
                    { label: 'Public Access', value: docs.filter(d => !d.isPremium).length, color: 'text-emerald-600' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DocsManager;
