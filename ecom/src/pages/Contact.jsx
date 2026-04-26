import React from 'react';
import { useLocation } from 'react-router-dom';
import ContactSection from '../components/ContactSection';
import Meta from '../components/common/Meta';
import { absoluteUrl, breadcrumbSchema } from '../utils/seo';

const Contact = () => {
    const location = useLocation();
    const isHire = location.pathname.startsWith('/hire-developer');
    const isCustom = location.pathname.startsWith('/custom-request');

    const title = isHire
        ? 'Hire Developers for SaaS and Dashboards'
        : isCustom
            ? 'Request a Custom SaaS Build'
            : 'Contact BizCode';
    const description = isHire
        ? 'Hire developers to customize SaaS templates, build dashboards, deploy fullstack apps, or create custom software.'
        : isCustom
            ? 'Request a custom SaaS app, admin dashboard, website, or fullstack project built from scratch or from a BizCode template.'
            : 'Contact BizCode for product help, deployment support, custom builds, and developer marketplace questions.';

    return (
        <>
            <Meta
                title={title}
                description={description}
                canonical={absoluteUrl(isHire ? '/hire-developer' : isCustom ? '/custom-request' : '/contact')}
                jsonLd={[breadcrumbSchema([
                    { name: 'Home', path: '/' },
                    { name: title, path: isHire ? '/hire-developer' : isCustom ? '/custom-request' : '/contact' },
                ])]}
            />
            <ContactSection />
        </>
    );
};

export default Contact;
