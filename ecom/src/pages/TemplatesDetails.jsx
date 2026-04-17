import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductHeader from '../components/ProductHeader';
import TemplateCarousel from '../components/TemplateCarousel';
import TemplateDetails from '../components/TemplateDetails';
import ProductReviews from '../components/ProductReviews';
import { templates } from '../data/templates';
import productService from '../services/productService';
import { FEATURES } from '../config/features';
import { normalizeProduct } from '../utils/normalizers';

const TemplatesDetails = () => {
    const { id } = useParams();
    const [template, setTemplate] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);

        const fetchProduct = async () => {
            try {
                const data = await productService.getById(id);
                setTemplate(normalizeProduct(data));
            } catch {
                const fallback = templates.find(t => t.id === Number(id));
                setTemplate(fallback ? normalizeProduct(fallback) : null);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (!template) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7]">
                <h2 className="text-3xl font-bold mb-4">Template not found</h2>
                <Link to="/templates" className="text-blue-600 underline">Back to templates</Link>
            </div>
        );
    }

    return (
        <div>
            <ProductHeader product={template} />
            <TemplateCarousel />
            <TemplateDetails
                description={template.longDescription || template.description}
                features={template.features}
                pages={template.pages}
                techStack={template.techStack}
                productType={template.productType}
                documentation={template.documentationInfo}
                liveDemo={template.liveDemo}
                githubRepo={template.githubRepo}
                rating={template.rating}
                numReviews={template.numReviews}
            />
            {FEATURES.reviews && <ProductReviews productId={template.id} />}
        </div>
    );
}

export default TemplatesDetails;
