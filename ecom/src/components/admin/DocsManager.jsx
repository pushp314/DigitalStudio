import React, { useCallback, useEffect, useState } from 'react';
import docService from '../../services/docService';
import { useToast } from '../../context/ToastContext';
import { normalizeDoc } from '../../utils/normalizers';

const initialForm = {
    title: '',
    category: '',
    description: '',
    previewContent: '',
    content: '',
    price: 0,
    isPremium: true,
    icon: '📄',
};

const DocsManager = () => {
    const { success, error } = useToast();
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(initialForm);

    const fetchDocs = useCallback(async () => {
        try {
            const data = await docService.getAll();
            setDocs(Array.isArray(data) ? data.map(normalizeDoc) : []);
        } catch (err) {
            error(err.message || 'Failed to load docs');
        } finally {
            setLoading(false);
        }
    }, [error]);

    useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);

    const resetForm = () => {
        setFormData(initialForm);
        setEditingId(null);
        setIsCreating(false);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content) {
            error('Title and content are required');
            return;
        }

        try {
            if (editingId) {
                await docService.update(editingId, formData);
                success('Doc updated successfully');
            } else {
                await docService.create(formData);
                success('Doc created successfully');
            }
            resetForm();
            fetchDocs();
        } catch (err) {
            error(err.message || 'Failed to save doc');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this doc?')) return;

        try {
            await docService.delete(id);
            success('Doc deleted');
            fetchDocs();
        } catch (err) {
            error(err.message || 'Failed to delete doc');
        }
    };

    const startEdit = (doc) => {
        setEditingId(doc.id);
        setIsCreating(true);
        setFormData({
            title: doc.title,
            category: doc.category,
            description: doc.description || '',
            previewContent: doc.previewContent || '',
            content: doc.content || '',
            price: doc.price || 0,
            isPremium: doc.isPremium,
            icon: doc.icon || '📄',
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-black">Premium Docs Management</h2>
                <button
                    onClick={() => {
                        if (isCreating) {
                            resetForm();
                        } else {
                            setIsCreating(true);
                        }
                    }}
                    className="bg-[#0055FF] text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                >
                    {isCreating ? 'Cancel' : '+ New Doc'}
                </button>
            </div>

            {isCreating && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6 space-y-4">
                    <h3 className="text-lg font-bold text-black">{editingId ? 'Edit Doc' : 'Create New Doc'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Title">
                            <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-[#0055FF]" />
                        </Field>
                        <Field label="Category">
                            <input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-[#0055FF]" />
                        </Field>
                        <Field label="Price (USD)">
                            <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-[#0055FF]" />
                        </Field>
                        <Field label="Icon">
                            <input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-[#0055FF]" />
                        </Field>
                    </div>

                    <Field label="Description">
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-[#0055FF]" />
                    </Field>

                    <Field label="Preview Content">
                        <textarea value={formData.previewContent} onChange={(e) => setFormData({ ...formData, previewContent: e.target.value })} rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-[#0055FF]" />
                    </Field>

                    <Field label="Full Content">
                        <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={8} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-[#0055FF]" />
                    </Field>

                    <label className="flex items-center gap-2 text-black">
                        <input type="checkbox" checked={formData.isPremium} onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })} className="w-4 h-4 text-[#0055FF]" />
                        <span className="text-sm font-bold">Premium Content</span>
                    </label>

                    <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20">
                        {editingId ? 'Update Doc' : 'Create Doc'}
                    </button>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-8 text-gray-500">Loading docs...</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Title</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Category</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Price</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Access</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {docs.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-black font-bold">{doc.title}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{doc.category || 'General'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-green-600 font-bold">{doc.formattedPrice}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${doc.isPremium ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                            {doc.isPremium ? 'Premium' : 'Free'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => startEdit(doc)} className="bg-[#0055FF] text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-600 shadow-sm">
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(doc.id)} className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-600 shadow-sm">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <StatCard label="Total Docs" value={docs.length} />
                <StatCard label="Premium Docs" value={docs.filter((doc) => doc.isPremium).length} />
                <StatCard label="Free Docs" value={docs.filter((doc) => !doc.isPremium).length} />
            </div>
        </div>
    );
};

const Field = ({ label, children }) => (
    <div>
        <label className="block text-sm font-bold text-gray-500 mb-2">{label}</label>
        {children}
    </div>
);

const StatCard = ({ label, value }) => (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="text-gray-500 text-sm mb-1">{label}</div>
        <div className="text-2xl font-black text-black">{value}</div>
    </div>
);

export default DocsManager;
