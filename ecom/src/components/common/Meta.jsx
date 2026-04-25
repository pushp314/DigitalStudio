import React from 'react';
import { Helmet } from 'react-helmet-async';

const Meta = ({ title, description, image, url, type = 'website' }) => {
    const siteName = 'BizCode';
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const defaultDescription = 'BizCode helps you buy ready apps, customize them, or hire developers to build for you.';
    const defaultImage = 'https://bizcode.appnity.co.in/og-image.png';
    const currentUrl = url || window.location.href;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description || defaultDescription} />

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
        </Helmet>
    );
};

export default Meta;
