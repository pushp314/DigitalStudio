import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import productService from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { normalizeProduct } from '../../utils/normalizers';

const emptyForm = {
    title: '',
    price: '',
    image: '',
    category: '',
    description: '',
    longDescription: '',
    productType: 'template',
    techStack: '',
    liveDemo: '',
    githubRepo: '',
    hasBackend: false,
    hasFrontend: false,
    fileURL: '',
    version: '1.0.0',
    requiresSubscription: false,
    previewImages: '',
};

const inputClassName = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition-all focus:border-[#0055FF] focus:ring-2 focus:ring-[#0055FF]/10';
const labelClassName = 'block text-sm font-bold text-gray-700 mb-2';

const ProductEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { success, error } = useToast();
    const isCreateMode = !id;

    const [loading, setLoading] = useState(!isCreateMode);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState(emptyForm);

    const pageTitle = useMemo(() => (isCreateMode ? 'Create Product' : 'Edit Product'), [isCreateMode]);

    useEffect(() => {
        if (isCreateMode) {
            setLoading(false);
            return;
        }

        const fetchProduct = async () => {
            try {
                const data = await productService.getById(id);
                const product = normalizeProduct(data);
                setFormData({
                    title: product.title || '',
                    price: product.price ? String(product.price) : '',
                    image: product.image || '',
                    category: product.category || '',
                    description: product.description || '',
                    longDescription: product.longDescription || '',
                    productType: product.productType || 'template',
                    techStack: product.techStack.join(', '),
                    liveDemo: product.liveDemo || '',
                    githubRepo: product.githubRepo || '',
                    hasBackend: product.documentation.some((item) => /backend/i.test(item)),
                    hasFrontend: product.documentation.some((item) => /frontend|setup/i.test(item)),
                    fileURL: product.fileURL || '',
                    version: product.version || '1.0.0',
                    requiresSubscription: product.requiresSubscription || false,
                    previewImages: product.previewImages.join(', '),
                });
            } catch (err) {
                error(err.message || 'Error fetching product details');
                navigate('/admin/dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [error, id, isCreateMode, navigate]);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleUploadFile = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const body = new FormData();
        body.append('file', file);
        setUploading(true);

        try {
            const response = await api.post('/upload', body);
            setFormData((prev) => ({ ...prev, fileURL: response.filePath || '' }));
            success('File uploaded successfully');
        } catch (err) {
            error(err.message || 'File upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = {
            title: formData.title,
            price: Number(formData.price || 0),
            image: formData.image,
            category: formData.category,
            description: formData.description,
            longDescription: formData.longDescription,
            productType: formData.productType,
            techStack: formData.techStack.split(',').map((item) => item.trim()).filter(Boolean),
            liveDemo: formData.liveDemo,
            githubRepo: formData.githubRepo,
            fileURL: formData.fileURL,
            version: formData.version,
            requiresSubscription: formData.requiresSubscription,
            previewImages: formData.previewImages.split(',').map((item) => item.trim()).filter(Boolean),
            documentation: [
                formData.hasFrontend ? 'Frontend Guide' : '',
                formData.hasBackend ? 'Backend Guide' : '',
            ].filter(Boolean),
        };

        try {
            if (isCreateMode) {
                const created = await productService.create(payload);
                success('Product created successfully');
                navigate(`/admin/product/${created.id}/edit`);
                return;
            }

            await productService.update(id, payload);
            success('Product updated successfully');
            navigate('/admin/dashboard');
        } catch (err) {
            error(err.message || `Failed to ${isCreateMode ? 'create' : 'update'} product`);
        }
    };

    if (loading) {
        return <div className="p-20 text-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] px-6 py-20 font-sans">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-black text-black">{pageTitle}</h1>
                    <button onClick={() => navigate('/admin/dashboard')} className="text-gray-500 hover:text-black">
                        Cancel
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Product Title">
                            <input type="text" name="title" value={formData.title} onChange={handleChange} className={inputClassName} required />
                        </Field>
                        <Field label="Price (USD)">
                            <input type="number" min="0" step="0.01" name="price" value={formData.price} onChange={handleChange} className={inputClassName} required />
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Category">
                            <input type="text" name="category" value={formData.category} onChange={handleChange} className={inputClassName} required />
                        </Field>
                        <Field label="Version">
                            <input type="text" name="version" value={formData.version} onChange={handleChange} className={inputClassName} placeholder="1.0.0" />
                        </Field>
                    </div>

                    <Field label="Image URL">
                        <input type="text" name="image" value={formData.image} onChange={handleChange} className={inputClassName} required />
                    </Field>

                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                        <label className={labelClassName}>Product File</label>
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <input
                                type="text"
                                name="fileURL"
                                value={formData.fileURL}
                                onChange={handleChange}
                                className={inputClassName}
                                placeholder="https://cdn.example.com/product.zip"
                            />
                            <label className={`bg-black text-white px-4 py-3 rounded-xl font-bold cursor-pointer hover:bg-gray-800 transition-colors ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                {uploading ? 'Uploading...' : 'Upload File'}
                                <input type="file" className="hidden" onChange={handleUploadFile} disabled={uploading} />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">Uploads use the shared API wrapper and Cloudflare R2 backend endpoint.</p>
                    </div>

                    <Field label="Short Description">
                        <input type="text" name="description" value={formData.description} onChange={handleChange} className={inputClassName} required />
                    </Field>

                    <Field label="Long Description">
                        <textarea name="longDescription" value={formData.longDescription} onChange={handleChange} rows={6} className={inputClassName} />
                    </Field>

                    <div className="border-t border-gray-100 pt-8">
                        <h2 className="text-xl font-black text-black mb-6">Marketplace Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <Field label="Product Type">
                                <select name="productType" value={formData.productType} onChange={handleChange} className={inputClassName}>
                                    <option value="template">Template</option>
                                    <option value="fullstack">Full Stack App</option>
                                    <option value="api">API Collection</option>
                                    <option value="component">UI Library</option>
                                    <option value="ui_kit">UI Kit</option>
                                    <option value="code_snippet">Code Snippet</option>
                                </select>
                            </Field>
                            <Field label="Tech Stack (comma separated)">
                                <input type="text" name="techStack" value={formData.techStack} onChange={handleChange} className={inputClassName} placeholder="React, Gin, PostgreSQL" />
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <Field label="Live Demo URL">
                                <input type="text" name="liveDemo" value={formData.liveDemo} onChange={handleChange} className={inputClassName} />
                            </Field>
                            <Field label="GitHub Repo">
                                <input type="text" name="githubRepo" value={formData.githubRepo} onChange={handleChange} className={inputClassName} />
                            </Field>
                        </div>

                        <Field label="Preview Image URLs (comma separated)">
                            <input type="text" name="previewImages" value={formData.previewImages} onChange={handleChange} className={inputClassName} placeholder="https://..., https://..." />
                        </Field>

                        <div className="flex flex-col md:flex-row gap-4 mt-6">
                            <Checkbox
                                name="hasFrontend"
                                checked={formData.hasFrontend}
                                onChange={handleChange}
                                label="Includes Frontend Guide"
                            />
                            <Checkbox
                                name="hasBackend"
                                checked={formData.hasBackend}
                                onChange={handleChange}
                                label="Includes Backend Guide"
                            />
                            <Checkbox
                                name="requiresSubscription"
                                checked={formData.requiresSubscription}
                                onChange={handleChange}
                                label="Requires Subscription"
                            />
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-[#0055FF] text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
                        {isCreateMode ? 'Create Product' : 'Update Product'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const Field = ({ label, children }) => (
    <div>
        <label className={labelClassName}>{label}</label>
        {children}
    </div>
);

const Checkbox = ({ name, checked, onChange, label }) => (
    <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" name={name} checked={checked} onChange={onChange} className="w-4 h-4 rounded text-[#0055FF]" />
        <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
);

export default ProductEdit;
