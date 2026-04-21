import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Plus, Pencil, Trash2, Save, X, Layers } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const CategoryManager = () => {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', slug: '', description: '', icon: '', sortOrder: 0 });
    const [isCreating, setIsCreating] = useState(false);

    const { data: categories, isLoading } = useQuery({
        queryKey: ['admin-categories'],
        queryFn: () => api.get('/admin/categories'),
    });

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/admin/categories', data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-categories']);
            success('Category created successfully.');
            setIsCreating(false);
            setEditForm({ name: '', slug: '', description: '', icon: '', sortOrder: 0 });
        },
        onError: () => toastError('Failed to create category.')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/admin/categories/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-categories']);
            success('Category updated successfully.');
            setEditingId(null);
        },
        onError: () => toastError('Failed to update category.')
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/admin/categories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-categories']);
            success('Category deleted.');
        },
        onError: () => toastError('Failed to delete category.')
    });

    const handleEdit = (cat) => {
        setEditingId(cat.id);
        setEditForm({ 
            name: cat.name, 
            slug: cat.slug, 
            description: cat.description, 
            icon: cat.icon || '', 
            sortOrder: cat.sortOrder || 0 
        });
    };

    const handleSave = () => {
        if (editingId) {
            updateMutation.mutate({ id: editingId, data: editForm });
        } else {
            createMutation.mutate(editForm);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Loading structural data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Information Architecture</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Manage product categories, slugs, and navigation hierarchy.</p>
                </div>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                    <Plus size={14} /> Add Category
                </button>
            </div>

            <div className="grid gap-4">
                {isCreating && (
                    <CategoryForm 
                        form={editForm} 
                        setForm={setEditForm} 
                        onSave={handleSave} 
                        onCancel={() => setIsCreating(false)} 
                        isSaving={createMutation.isLoading || updateMutation.isLoading}
                    />
                )}

                {categories?.map((cat) => (
                    <div key={cat.id}>
                        {editingId === cat.id ? (
                            <CategoryForm 
                                form={editForm} 
                                setForm={setEditForm} 
                                onSave={handleSave} 
                                onCancel={() => setEditingId(null)} 
                                isSaving={updateMutation.isLoading}
                            />
                        ) : (
                            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between group hover:border-slate-400 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-900 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all text-lg mb-1">
                                        {cat.icon || <Layers size={18} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-bold text-slate-900">{cat.name}</h4>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100 italic">/{cat.slug}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium mt-1 truncate max-w-md">{cat.description || "No description provided."}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEdit(cat)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                        <Pencil size={14} />
                                    </button>
                                    <button 
                                        onClick={() => { if(window.confirm('Delete category?')) deleteMutation.mutate(cat.id); }} 
                                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const CategoryForm = ({ form, setForm, onSave, onCancel, isSaving }) => (
    <div className="bg-slate-50 border-2 border-slate-900/5 p-6 rounded-2xl grid gap-4">
        <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Category Name</label>
                <input 
                    type="text" 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="e.g. SaaS Starters"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:border-slate-900 outline-none transition-all shadow-sm"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Icon / Emoji</label>
                <input 
                    type="text" 
                    value={form.icon} 
                    onChange={e => setForm({...form, icon: e.target.value})}
                    placeholder="e.g. 🚀"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:border-slate-900 outline-none transition-all shadow-sm"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order</label>
                <input 
                    type="number" 
                    value={form.sortOrder} 
                    onChange={e => setForm({...form, sortOrder: parseInt(e.target.value) || 0})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:border-slate-900 outline-none transition-all shadow-sm"
                />
            </div>
        </div>
        <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Route Slug</label>
            <input 
                type="text" 
                value={form.slug} 
                onChange={e => setForm({...form, slug: e.target.value})}
                placeholder="e.g. saas-starters"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:border-slate-900 outline-none transition-all shadow-sm"
            />
        </div>
        <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</label>
            <textarea 
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Marketplace subtitle and metadata..."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:border-slate-900 outline-none transition-all shadow-sm resize-none h-20"
            />
        </div>
        <div className="flex justify-end gap-3 pt-2">
            <button onClick={onCancel} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900">Cancel</button>
            <button 
                onClick={onSave} 
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all"
            >
                <Save size={14} /> {isSaving ? 'Synchronizing...' : 'Save Category'}
            </button>
        </div>
    </div>
);

export default CategoryManager;
