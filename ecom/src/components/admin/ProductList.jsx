import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/products');
            setProducts(data);
        } catch (error) {
            addToast('Error fetching products', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const deleteHandler = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/products/${id}`);
                addToast('Product deleted successfully', 'success');
                fetchProducts();
            } catch (error) {
                addToast('Error deleting product', 'error');
                console.error(error);
            }
        }
    };

    const createProductHandler = async () => {
        try {
            const { data } = await api.post('/products', {}); // Creates sample
            addToast('Sample product created', 'success');
            fetchProducts(); // Refresh
        } catch (error) {
            addToast('Error creating product', 'error');
            console.error(error);
        }
    }

    if (loading) return <div className="text-white">Loading products...</div>;

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Product Inventory</h3>
                <button onClick={createProductHandler} className="bg-[#0055FF] hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                    + Create New
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="text-xs uppercase bg-zinc-800/50 text-zinc-300">
                        <tr>
                            <th className="px-4 py-3 rounded-l-lg">ID</th>
                            <th className="px-4 py-3">Product Name</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {products.map((product) => (
                            <tr key={product._id} className="hover:bg-zinc-800/30 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{product._id.substring(0, 6)}...</td>
                                <td className="px-4 py-3 font-medium text-white">{product.title}</td>
                                <td className="px-4 py-3 text-green-400">${product.price}</td>
                                <td className="px-4 py-3 text-xs uppercase">{product.category}</td>
                                <td className="px-4 py-3 text-right space-x-2">
                                    <Link
                                        to={`/admin/product/${product._id}/edit`}
                                        className="text-white hover:text-[#0055FF] transition-colors"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => deleteHandler(product._id)}
                                        className="text-red-500 hover:text-red-400 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductList;
