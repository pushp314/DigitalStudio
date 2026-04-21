import React, { useEffect } from 'react';

const Meta = ({ title, description, image, url, type = 'website' }) => {
    const siteName = 'DigitalStudio';
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const defaultDescription = 'DigitalStudio helps you buy ready apps, customize them, or hire developers to build for you.';
    const defaultImage = 'https://digitalstudio.dev/og-image.png';
    const defaultUrl = window.location.href;

    useEffect(() => {
        document.title = fullTitle;

        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', description || defaultDescription);
        }

        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', fullTitle);

        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) ogDescription.setAttribute('content', description || defaultDescription);

        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) ogImage.setAttribute('content', image || defaultImage);

        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) ogUrl.setAttribute('content', url || defaultUrl);

        const ogType = document.querySelector('meta[property="og:type"]');
        if (ogType) ogType.setAttribute('content', type);

        const twitterTitle = document.querySelector('meta[property="twitter:title"]');
        if (twitterTitle) twitterTitle.setAttribute('content', fullTitle);

        const twitterDescription = document.querySelector('meta[property="twitter:description"]');
        if (twitterDescription) twitterDescription.setAttribute('content', description || defaultDescription);

        const twitterImage = document.querySelector('meta[property="twitter:image"]');
        if (twitterImage) twitterImage.setAttribute('content', image || defaultImage);
    }, [title, description, image, url, type, fullTitle]);

    return null;
};

export default Meta;
