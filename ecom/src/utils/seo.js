import { CATEGORY_SEO } from '../data/seoContent';

export const SITE_URL = 'https://bizcode.appnity.co.in';

export const absoluteUrl = (path = '/') => {
    if (/^https?:\/\//i.test(path)) return path;
    return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const slugify = (value = '') => String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const productCategorySlug = (product = {}) => {
    const productType = product.productType || product.type;
    if (productType === 'fullstack') return 'fullstack-projects';

    const source = product.categoryRel?.slug || product.category || '';
    const normalized = slugify(source);
    const aliases = {
        saas: 'saas-templates',
        'saas-starters': 'saas-templates',
        dashboards: 'dashboard-templates',
        dashboard: 'dashboard-templates',
        portfolio: 'website-templates',
        website: 'website-templates',
        'website-kits': 'website-templates',
        'ui-systems': 'ui-systems',
        'ui-kits': 'ui-systems',
        components: 'ui-systems',
    };

    return aliases[normalized] || normalized || 'developer-assets';
};

export const productCanonicalPath = (product = {}) => {
    const productSlug = product.slug || slugify(product.title) || `product-${product.id}`;
    return `/assets/${productCategorySlug(product)}/${productSlug}`;
};

export const categoryCanonicalPath = (slug) => {
    const aliases = {
        'saas-starters': 'saas-templates',
        dashboards: 'dashboard-templates',
        'website-kits': 'website-templates',
    };
    const cleanSlug = slugify(slug);
    return `/assets/${aliases[cleanSlug] || cleanSlug}`;
};

export const productSeoTitle = (product = {}) => {
    if (product.seoTitle) return product.seoTitle;
    const techStack = Array.isArray(product.techStack) && product.techStack.length > 0
        ? product.techStack.slice(0, 2).join(' + ')
        : 'Production-Ready';
    const category = product.category || CATEGORY_SEO[productCategorySlug(product)]?.title || 'Developer Asset';
    const type = String(product.productType || product.type || 'template').replace(/_/g, ' ');
    return `${techStack} ${category} ${type}`;
};

export const productSeoDescription = (product = {}) => (
    product.seoDescription ||
    `Buy ${product.title} with source code, demo, setup docs, and support. Customize or deploy this ready-made app with BizCode.`
);

export const organizationSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BizCode',
    url: SITE_URL,
    logo: absoluteUrl('/logo.png'),
    sameAs: ['https://bizcode.appnity.co.in'],
});

export const websiteSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BizCode',
    url: SITE_URL,
    potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/assets?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
    },
});

export const breadcrumbSchema = (items = []) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: absoluteUrl(item.path),
    })),
});

export const faqSchema = (faqs = []) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
        },
    })),
});

export const productSchema = (product = {}) => {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: productSeoDescription(product),
        image: product.ogImage || product.image,
        brand: { '@type': 'Brand', name: 'BizCode' },
        category: product.category,
        sku: String(product.id || product.slug || product.title),
        offers: {
            '@type': 'Offer',
            url: absoluteUrl(productCanonicalPath(product)),
            priceCurrency: 'INR',
            price: Number(product.price || 0),
            availability: 'https://schema.org/InStock',
        },
    };

    if (Number(product.numReviews) > 0 && Number(product.rating) > 0) {
        schema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: Number(product.rating),
            reviewCount: Number(product.numReviews),
        };
    }

    return schema;
};

export const blogPostingSchema = (post = {}) => ({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    keywords: post.targetKeyword,
    url: absoluteUrl(`/blog/${post.slug}`),
    publisher: {
        '@type': 'Organization',
        name: 'BizCode',
        logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.png') },
    },
});
