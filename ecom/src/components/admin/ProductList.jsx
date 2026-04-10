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
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            addToast('Error fetching products', 'error');
            console.error(error);
            setProducts([]);
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

    if (loading) return <div className="text-gray-500">Loading products...</div>;

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-black">Product Inventory</h3>
                <button onClick={createProductHandler} className="bg-[#0055FF] hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-blue-500/30">
                    + Create New
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                    <thead className="text-xs uppercase bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-4 py-3 rounded-l-lg">ID</th>
                            <th className="px-4 py-3">Product Name</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {Array.isArray(products) && products.length > 0 ? (
                            products.map((product) => (
                                <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{product._id.substring(0, 6)}...</td>
                                    <td className="px-4 py-3 font-medium text-black">{product.title}</td>
                                    <td className="px-4 py-3 text-green-600 font-bold">${product.price}</td>
                                    <td className="px-4 py-3 text-xs uppercase">{product.category}</td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <Link
                                            to={`/admin/product/${product._id}/edit`}
                                            className="text-gray-600 hover:text-[#0055FF] transition-colors"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => deleteHandler(product._id)}
                                            className="text-red-500 hover:text-red-600 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                    No products found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductList;
