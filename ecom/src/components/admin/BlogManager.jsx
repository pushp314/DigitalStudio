import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import blogService from '../../services/blogService';
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    ExternalLink, 
    BookOpen, 
    X, 
    Save, 
    Loader2,
    Calendar,
    Tag,
    AlertCircle
} from 'lucide-react';

const BlogManager = () => {
    const queryClient = useQueryClient();
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [search, setSearch] = useState('');

    const { data: posts, isLoading } = useQuery({
        queryKey: ['admin-blogs'],
        queryFn: () => blogService.list(),
    });

    const createMutation = useMutation({
        mutationFn: (data) => blogService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-blogs']);
            setIsEditorOpen(false);
            setEditingPost(null);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => blogService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-blogs']);
            setIsEditorOpen(false);
            setEditingPost(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => blogService.delete(id),
        onSuccess: () => queryClient.invalidateQueries(['admin-blogs']),
    });

    const handleSave = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            title: formData.get('title'),
            slug: formData.get('slug'),
            category: formData.get('category'),
            content: formData.get('content'),
        };

        if (editingPost?.id) {
            updateMutation.mutate({ id: editingPost.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const filteredPosts = posts?.filter(p => 
        p.title.toLowerCase().includes(search.toLowerCase()) || 
        p.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">Blog Management</h2>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Publish guides & playbooks</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                            type="text" 
                            placeholder="Filter posts..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-64 transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => { setEditingPost(null); setIsEditorOpen(true); }}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
                    >
                        <Plus size={14} />
                        New Post
                    </button>
                </div>
            </div>

            {/* List View */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Article</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-6 py-4"><div className="h-10 bg-slate-50 rounded-lg"></div></td>
                                    </tr>
                                ))
                            ) : filteredPosts?.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                <BookOpen size={24} />
                                            </div>
                                            <p className="text-xs font-bold text-slate-400">No blog posts found in the archives</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPosts?.map(post => (
                                <tr key={post.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{post.title}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">/{post.slug}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-tight">
                                            <Tag size={10} />
                                            {post.category || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[11px] text-slate-500 font-medium">
                                        {new Date(post.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><ExternalLink size={14} /></a>
                                            <button onClick={() => { setEditingPost(post); setIsEditorOpen(true); }} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><Edit2 size={14} /></button>
                                            <button onClick={() => deleteMutation.mutate(post.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Editor Modal */}
            {isEditorOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                    <Plus size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">{editingPost ? 'Edit Article' : 'New Publication'}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Drafting engine v2.0</p>
                                </div>
                            </div>
                            <button onClick={() => setIsEditorOpen(false)} className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Title</label>
                                    <input 
                                        name="title"
                                        required
                                        defaultValue={editingPost?.title}
                                        placeholder="Article headline..."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Slug</label>
                                    <input 
                                        name="slug"
                                        defaultValue={editingPost?.slug}
                                        placeholder="custom-slug-here"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                <select 
                                    name="category"
                                    defaultValue={editingPost?.category}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                                >
                                    <option value="Guide">Guide</option>
                                    <option value="Playbook">Playbook</option>
                                    <option value="Tutorial">Tutorial</option>
                                    <option value="Industry">Industry</option>
                                    <option value="Showcase">Showcase</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Content (Markdown)</label>
                                    <span className="text-[10px] text-blue-600 font-bold tracking-tighter uppercase">Rich editor active</span>
                                </div>
                                <textarea 
                                    name="content"
                                    required
                                    defaultValue={editingPost?.content}
                                    rows={15}
                                    placeholder="Write your article in markdown..."
                                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono leading-relaxed"
                                />
                            </div>
                        </form>

                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-400">
                                <AlertCircle size={14} />
                                <span className="text-[10px] font-medium italic">Changes are live upon saving.</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => setIsEditorOpen(false)} className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">Cancel</button>
                                <button 
                                    onClick={(e) => {
                                        const form = e.target.closest('.bg-white').querySelector('form');
                                        form.requestSubmit();
                                    }}
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                >
                                    {createMutation.isPending || updateMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                    {editingPost ? 'Update Publication' : 'Launch Article'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlogManager;
