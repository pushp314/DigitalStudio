import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import productService from '../services/productService';
import { normalizeProduct } from '../utils/normalizers';
import { productCanonicalPath } from '../utils/seo';

const ProductRedirect = () => {
    const { id } = useParams();
    const { data, isLoading } = useQuery({
        queryKey: ['product-redirect', id],
        queryFn: () => productService.getById(id),
        enabled: Boolean(id),
    });

    if (isLoading) {
        return <div className="ds-page flex min-h-screen items-center justify-center text-slate-600">Opening product...</div>;
    }

    if (!data) {
        return <Navigate to="/assets" replace />;
    }

    return <Navigate to={productCanonicalPath(normalizeProduct(data))} replace />;
};

export default ProductRedirect;
