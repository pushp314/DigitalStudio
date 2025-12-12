import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import productService from '../../services/productService';

const ProductEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        image: '',
        category: '',
        description: '',
        longDescription: '',
        productType: 'template',
        techStack: '', // Comma separated string for input
        liveDemo: '',
        githubRepo: '',
        hasBackend: false, // New field for documentation
        hasFrontend: false, // New field for documentation
        file_url: '', // New field for product file
        version: '1.0.0', // New field for version
        requires_subscription: false // New field
    });

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchProduct();
    }, [id]); // Added id to dependency array

    const fetchProduct = async () => {
        try {
            const { data } = await api.get(`/products/${id}`); // Changed to api.get
            setFormData({
                title: data.title || '',
                price: data.price || '',
                image: data.image || '',
                category: data.category || '',
                description: data.description || '',
                longDescription: data.longDescription || '', // New
                productType: data.productType || 'fullstack', // New
                techStack: data.techStack ? data.techStack.join(', ') : '', // New
                liveDemo: data.liveDemo || '', // New
                githubRepo: data.githubRepo || '', // New
                hasBackend: data.documentation?.includes('Backend Guide') || false, // Hacky map
                hasFrontend: data.documentation?.includes('Frontend Guide') || false,
                file_url: data.file_url || '', // New
                version: data.version || '1.0.0', // New
                requires_subscription: data.requires_subscription || false // New
            });
        } catch (error) {
            addToast('Error fetching product details', 'error'); // Added toast
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleUploadFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        setUploading(true);

        try {
            const { data } = await api.post('/upload', formDataUpload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setFormData(prev => ({ ...prev, file_url: data.filePath })); // server returns path string, assuming data.filePath
            setUploading(false);
            addToast('File uploaded successfully!', 'success');
        } catch (error) {
            console.error(error);
            setUploading(false);
            addToast('File upload failed', 'error');
        }
    };

    const handleSubmit = async (e) => { // Renamed from submitHandler
        e.preventDefault();

        // Transform techStack back to array
        const submissionData = {
            ...formData,
            techStack: formData.techStack.split(',').map(item => item.trim()).filter(i => i),
            documentation: [ // Re-construct docs array
                formData.hasBackend ? 'Backend Guide' : '',
                formData.hasFrontend ? 'Frontend Guide' : ''
            ].filter(Boolean)
        };

        try {
            await api.put(`/products/${id}`, submissionData); // Changed to api.put
            addToast('Product updated successfully', 'success'); // Added toast
            navigate('/admin/dashboard');
        } catch (error) {
            addToast('Error updating product', 'error'); // Added toast
            console.error(error);
        }
    };

    if (loading) return <div className="p-20 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#F5F5F7] px-6 py-20 font-sans">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-black text-black">Edit Product</h1>
                    <button onClick={() => navigate('/admin/dashboard')} className="text-gray-500 hover:text-black">Cancel</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="label">Product Title</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="label">Price ($)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} className="input-field" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="label">Category</label>
                            <input type="text" name="category" value={formData.category} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="label">Version</label>
                            <input type="text" name="version" value={formData.version} onChange={handleChange} className="input-field" placeholder="1.0.0" />
                        </div>
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="label">Image URL</label>
                        <input type="text" name="image" value={formData.image} onChange={handleChange} className="input-field" required />
                    </div>

                    {/* File Upload Section */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label className="label mb-2 block">Product File (Zip/PDF)</label>
                        <div className="flex gap-4 items-center">
                            <input
                                type="text"
                                name="file_url"
                                value={formData.file_url}
                                onChange={handleChange}
                                className="input-field flex-grow"
                                placeholder="/uploads/file.zip"
                            />
                            <div className="relative">
                                <input
                                    type="file"
                                    id="file-upload"
                                    onChange={handleUploadFile}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className={`bg-black text-white px-4 py-3 rounded-lg text-sm font-bold cursor-pointer hover:bg-gray-800 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {uploading ? 'Uploading...' : 'Upload File'}
                                </label>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Upload the actual digital product file here.</p>
                    </div>

                    {/* Descriptions */}
                    <div>
                        <label className="label">Short Description</label>
                        <input type="text" name="description" value={formData.description} onChange={handleChange} className="input-field" required />
                    </div>

                    <div>
                        <label className="label">Long Description (Markdown supported)</label>
                        <textarea name="longDescription" value={formData.longDescription} onChange={handleChange} className="input-field h-32" />
                    </div>

                    {/* CodeStudio Specifics */}
                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="font-bold text-lg mb-4">Marketplace Details</h3>

                        <div className="grid grid-cols-2 gap-6 mb-4">
                            <div>
                                <label className="label">Product Type</label>
                                <select name="productType" value={formData.productType} onChange={handleChange} className="input-field">
                                    <option value="fullstack">Full Stack App</option>
                                    <option value="api">API Collection</option>
                                    <option value="component">UI Library</option>
                                    <option value="template">Static Template</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Tech Stack (comma separated)</label>
                                <input type="text" name="techStack" value={formData.techStack} onChange={handleChange} className="input-field" placeholder="React, Node, MongoDB" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-4">
                            <div>
                                <label className="label">Live Demo URL</label>
                                <input type="text" name="liveDemo" value={formData.liveDemo} onChange={handleChange} className="input-field" />
                            </div>
                            <div>
                                <label className="label">GitHub Repo</label>
                                <input type="text" name="githubRepo" value={formData.githubRepo} onChange={handleChange} className="input-field" />
                            </div>
                        </div>

                        <div className="flex gap-6 mt-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="hasBackend" checked={formData.hasBackend} onChange={handleChange} className="w-5 h-5 rounded text-blue-600" />
                                <span className="text-sm font-medium">Includes Backend Guide</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="hasFrontend" checked={formData.hasFrontend} onChange={handleChange} className="w-5 h-5 rounded text-blue-600" />
                                <span className="text-sm font-medium">Includes Frontend Guide</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="requires_subscription" checked={formData.requires_subscription} onChange={handleChange} className="w-5 h-5 rounded text-blue-600" />
                                <span className="text-sm font-medium text-orange-600">Requires Subscription</span>
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-[#0055FF] text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
                        Update Product
                    </button>

                </form>
            </div>
        </div>
    );
};

const InputField = ({ label, ...props }) => (
    <div>
        <label className="label">{label}</label>
        <input {...props} className="input-field" />
    </div>
);

export default ProductEdit;
