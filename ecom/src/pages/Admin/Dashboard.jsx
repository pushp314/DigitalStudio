import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import productService from '../../services/productService';
import { useToast } from '../../context/ToastContext';

const Dashboard = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);
    const { addToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
        } else {
            fetchProducts();
        }
    }, [user, navigate]);

    const fetchProducts = async () => {
        try {
            const data = await productService.getAll();
            setProducts(data);
        } catch (error) {
            addToast('Error loading products', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const deleteHandler = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await productService.delete(id);
                addToast('Product deleted successfully', 'success');
                fetchProducts();
            } catch (error) {
                addToast('Error deleting product', 'error');
                console.error(error);
            }
        }
    };

    const createHandler = async () => {
        try {
            const data = await productService.create({});
            navigate(`/admin/product/${data._id}/edit`);
        } catch (error) {
            addToast('Error creating product', 'error');
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0055FF] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] px-4 md:px-6 lg:px-8 py-24 md:py-32 font-sans">
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-black mb-2">Admin Dashboard</h1>
                        <p className="text-gray-500">Manage your CodeStudio products</p>
                    </div>
                    <button
                        onClick={createHandler}
                        className="bg-[#0055FF] text-white px-6 py-3 rounded-full font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 justify-center"
                    >
                        <span className="text-xl">+</span> Create Product
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="text-gray-500 text-sm font-bold uppercase mb-2">Total Products</div>
                        <div className="text-3xl font-black text-black">{products.length}</div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="text-gray-500 text-sm font-bold uppercase mb-2">Active</div>
                        <div className="text-3xl font-black text-green-600">{products.length}</div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="text-gray-500 text-sm font-bold uppercase mb-2">Total Revenue</div>
                        <div className="text-3xl font-black text-black">$0</div>
                    </div>
                </div>

                {/* Products Grid */}
                {products.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-xl font-bold text-black mb-2">No Products Yet</h3>
                        <p className="text-gray-500 mb-6">Create your first product to get started</p>
                        <button onClick={createHandler} className="bg-black text-white px-6 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors">
                            Create Product
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {products.map((product) => (
                                        <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                        {product.image && <img src={product.image} alt={product.title} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <div className="font-bold text-black max-w-xs truncate">{product.title}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-black">${product.price}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-400">{product._id.substring(0, 8)}...</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        to={`/admin/product/${product._id}/edit`}
                                                        className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => deleteHandler(product._id)}
                                                        className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
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

                        {/* Mobile Card View */}
                        <div className="lg:hidden divide-y divide-gray-100">
                            {products.map((product) => (
                                <div key={product._id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            {product.image && <img src={product.image} alt={product.title} className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-black truncate">{product.title}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="font-bold text-black">${product.price}</span>
                                                <span className="text-gray-400">•</span>
                                                <span className="text-xs text-gray-500 uppercase">{product.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/admin/product/${product._id}/edit`}
                                            className="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors text-center"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => deleteHandler(product._id)}
                                            className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
