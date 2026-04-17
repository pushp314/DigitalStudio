import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import productService from '../../services/productService';
import { useToast } from '../../context/ToastContext';
import { normalizeProduct } from '../../utils/normalizers';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const navigate = useNavigate();

    const fetchProducts = useCallback(async () => {
        try {
            const data = await productService.getAll();
            setProducts(Array.isArray(data) ? data.map(normalizeProduct) : []);
        } catch (error) {
            addToast('Error fetching products', 'error');
            console.error(error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

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

    const createProductHandler = async () => {
        navigate('/admin/product/new');
    }

    if (loading) return <div className="text-gray-500">Loading products...</div>;

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-black">Product Inventory</h3>
                <button onClick={createProductHandler} className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-blue-500/30">
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
                                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-gray-400">#{product.id}</td>
                                    <td className="px-4 py-3 font-medium text-black">{product.title}</td>
                                    <td className="px-4 py-3 text-green-600 font-bold">{product.formattedPrice}</td>
                                    <td className="px-4 py-3 text-xs uppercase">{product.category}</td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <Link
                                            to={`/admin/product/${product.id}/edit`}
                                            className="text-gray-600 hover:text-primary transition-colors"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => deleteHandler(product.id)}
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
