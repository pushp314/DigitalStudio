import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';

const DocsManager = () => {
    const { addToast } = useToast();
    const [docs, setDocs] = useState([
        {
            _id: '1',
            title: 'Production-Grade React Architecture',
            category: 'React',
            price: 29,
            isPremium: true,
            status: 'published'
        },
        {
            _id: '2',
            title: 'Stripe Payment Integration',
            category: 'Payments',
            price: 39,
            isPremium: true,
            status: 'published'
        },
        {
            _id: '3',
            title: 'MongoDB Performance Guide',
            category: 'Database',
            price: 34,
            isPremium: true,
            status: 'draft'
        }
    ]);

    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        price: 0,
        isPremium: true
    });

    const handleCreate = () => {
        if (!formData.title || !formData.category) {
            addToast('Please fill all fields', 'error');
            return;
        }

        const newDoc = {
            _id: Date.now().toString(),
            ...formData,
            status: 'draft'
        };

        setDocs([...docs, newDoc]);
        addToast('Doc created successfully!', 'success');
        setIsCreating(false);
        setFormData({ title: '', category: '', price: 0, isPremium: true });
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this doc?')) {
            setDocs(docs.filter(doc => doc._id !== id));
            addToast('Doc deleted', 'success');
        }
    };

    const toggleStatus = (id) => {
        setDocs(docs.map(doc =>
            doc._id === id
                ? { ...doc, status: doc.status === 'published' ? 'draft' : 'published' }
                : doc
        ));
        addToast('Status updated', 'success');
    };

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-black">Premium Docs Management</h2>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="bg-[#0055FF] text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                >
                    {isCreating ? 'Cancel' : '+ New Doc'}
                </button>
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-6">
                    <h3 className="text-lg font-bold text-black mb-4">Create New Doc</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-2">Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-[#0055FF]"
                                placeholder="e.g., Next.js 14 Complete Guide"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-2">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-[#0055FF]"
                            >
                                <option value="">Select category</option>
                                <option value="React">React</option>
                                <option value="Next.js">Next.js</option>
                                <option value="Payments">Payments</option>
                                <option value="Database">Database</option>
                                <option value="Security">Security</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-2">Price ($)</label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-[#0055FF]"
                            />
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-2 text-black">
                                <input
                                    type="checkbox"
                                    checked={formData.isPremium}
                                    onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                                    className="w-4 h-4 text-[#0055FF]"
                                />
                                <span className="text-sm font-bold">Premium Content</span>
                            </label>
                        </div>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20"
                    >
                        Create Doc
                    </button>
                </div>
            )}

            {/* Docs List */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Title</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Price</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {docs.map(doc => (
                            <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-black font-bold">{doc.title}</td>
                                <td className="px-6 py-4">
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                        {doc.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-green-600 font-bold">${doc.price}</td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => toggleStatus(doc._id)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold ${doc.status === 'published'
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-yellow-100 text-yellow-600'
                                            }`}
                                    >
                                        {doc.status}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        <button className="bg-[#0055FF] text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-600 shadow-sm">
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(doc._id)}
                                            className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-600 shadow-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="text-gray-500 text-sm mb-1">Total Docs</div>
                    <div className="text-2xl font-black text-black">{docs.length}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="text-gray-500 text-sm mb-1">Published</div>
                    <div className="text-2xl font-black text-green-500">
                        {docs.filter(d => d.status === 'published').length}
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="text-gray-500 text-sm mb-1">Total Value</div>
                    <div className="text-2xl font-black text-[#0055FF]">
                        ${docs.reduce((sum, doc) => sum + doc.price, 0)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocsManager;
