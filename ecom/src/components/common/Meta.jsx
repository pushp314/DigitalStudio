import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '../../utils/seo';

const Meta = ({ title, description, image, url, canonical, type = 'website', robots = 'index,follow', schema, jsonLd }) => {
    const siteName = 'BizCode';
    const fullTitle = title ? (title.includes(siteName) ? title : `${title} | ${siteName}`) : siteName;
    const defaultDescription = 'BizCode helps you buy SaaS templates, dashboards, fullstack projects, ready-made apps, and developer assets.';
    const defaultImage = 'https://bizcode.appnity.co.in/og-image.png';
    const currentUrl = canonical || url || (typeof window !== 'undefined' ? window.location.href : SITE_URL);
    const schemas = [
        ...(Array.isArray(jsonLd) ? jsonLd : []),
        ...(schema ? [schema] : []),
    ].filter(Boolean);

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="title" content={fullTitle} />
            <meta name="description" content={description || defaultDescription} />
            <meta name="robots" content={robots} />
            <link rel="canonical" href={currentUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description || defaultDescription} />
            <meta property="og:image" content={image || defaultImage} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description || defaultDescription} />
            <meta name="twitter:image" content={image || defaultImage} />
            <meta name="twitter:url" content={currentUrl} />

            {schemas.map((item, index) => (
                <script key={`json-ld-${index}`} type="application/ld+json">
                    {JSON.stringify(item)}
                </script>
            ))}
        </Helmet>
    );
};

export default Meta;
