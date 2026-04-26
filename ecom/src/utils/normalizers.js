import { calculateReadingTime } from './content';

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const toArray = (value) => (Array.isArray(value) ? value : []);
const toString = (value, fallback = '') => (typeof value === 'string' ? value : fallback);
const toObject = (value, fallback = {}) => (value && typeof value === 'object' && !Array.isArray(value) ? value : fallback);

export const normalizeId = (value) => {
    const raw = value ?? null;
    const numeric = Number(raw);
    return Number.isFinite(numeric) && raw !== '' && raw !== null ? numeric : raw;
};

export const formatCurrency = (value) => {
    const amount = Number(value ?? 0);
    return CURRENCY_FORMATTER.format(Number.isFinite(amount) ? amount : 0);
};

export const normalizeUser = (user = {}) => ({
    ...user,
    id: normalizeId(user.id ?? user._id),
    name: toString(user.name, 'Anonymous User'),
    email: toString(user.email),
    role: toString(user.role, 'user'),
    subscriptionPlan: toString(user.subscriptionPlan ?? user.subscription_plan, 'free'),
    isPro: Boolean(user.isPro ?? user.is_pro ?? (user.subscriptionPlan === 'pro' || user.subscription_plan === 'pro') ?? false),
    proExpiresAt: user.proExpiresAt ?? user.pro_expires_at ?? null,
    provider: toString(user.provider, 'local'),
    providerId: toString(user.providerId ?? user.provider_id),
    suspended: Boolean(user.suspended ?? false),
    createdAt: user.createdAt ?? user.created_at ?? null,
    updatedAt: user.updatedAt ?? user.updated_at ?? null,
});

const normalizeStatusFlags = (statusFlags) => {
    const flags = Array.isArray(statusFlags)
        ? statusFlags
        : String(statusFlags || '')
            .split(',')
            .map((flag) => flag.trim())
            .filter(Boolean);

    return {
        raw: flags,
        isFree: flags.includes('free'),
        isBestseller: flags.includes('bestseller'),
        isNewProduct: flags.includes('new'),
        isTrending: flags.includes('trending'),
        isFeatured: flags.includes('featured'),
    };
};

const normalizeDocumentationInfo = (documentation) => {
    const items = toArray(documentation).filter(Boolean);
    return {
        items,
        setup: items.some((item) => /setup|frontend/i.test(item)),
        deployment: items.some((item) => /deploy|backend/i.test(item)),
    };
};

export const normalizePreviewAsset = (asset, index = 0) => {
    if (typeof asset === 'string') {
        return {
            url: asset,
            alt: '',
            caption: '',
            sortOrder: index + 1,
        };
    }

    const normalized = toObject(asset);
    return {
        url: toString(normalized.url),
        alt: toString(normalized.alt),
        caption: toString(normalized.caption),
        sortOrder: Number(normalized.sortOrder ?? index + 1),
    };
};

export const normalizeProduct = (product = {}) => {
    const id = normalizeId(product.id ?? product._id);
    const price = Number(product.price ?? 0);
    const status = normalizeStatusFlags(product.statusFlags ?? product.status_flags ?? []);
    const documentation = normalizeDocumentationInfo(product.documentation);
    const previewImages = toArray(product.previewImages ?? product.preview_images).map(normalizePreviewAsset).filter((item) => item.url);

    return {
        ...product,
        id,
        price: Number.isFinite(price) ? price : 0,
        formattedPrice: formatCurrency(price),
        productType: product.productType ?? product.type ?? 'template',
        fileURL: product.fileURL ?? product.file_url ?? '',
        previewUrl: product.previewUrl ?? product.liveDemo ?? product.live_demo ?? '',
        image: toString(product.image),
        liveDemo: toString(product.liveDemo ?? product.live_demo),
        githubRepo: toString(product.githubRepo ?? product.github_repo),
        videoUrl: toString(product.videoUrl ?? product.video_url),
        courseOutline: toString(product.courseOutline ?? product.course_outline),
        duration: toString(product.duration),
        snippetLanguage: toString(product.snippetLanguage ?? product.snippet_language),
        snippet: toString(product.snippet),
        techStack: toArray(product.techStack ?? product.tech_stack),
        documentation: documentation.items,
        documentationInfo: documentation,
        previewImages,
        features: toArray(product.features),
        pages: toArray(product.pages),
        rating: Number(product.rating ?? 0),
        numReviews: Number(product.numReviews ?? product.num_reviews ?? 0),
        numSales: Number(product.numSales ?? product.num_sales ?? 0),
        revenue: Number(product.revenue ?? 0),
        requiresSubscription: Boolean(product.requiresSubscription ?? product.requires_subscription ?? false),
        tags: toArray(product.tags).map((tag) => typeof tag === 'string' ? tag : toString(tag?.name)).filter(Boolean),
        moderationStatus: toString(product.moderationStatus ?? product.moderation_status, 'approved'),
        createdAt: product.createdAt ?? product.created_at ?? null,
        updatedAt: product.updatedAt ?? product.updated_at ?? null,
        isFree: product.isFree ?? (price === 0 || status.isFree),
        isBestseller: product.isBestseller ?? status.isBestseller,
        isNewProduct: product.isNewProduct ?? status.isNewProduct,
        isTrending: product.isTrending ?? status.isTrending,
        isFeatured: product.isFeatured ?? status.isFeatured,
    };
};

export const normalizeOrder = (order = {}) => {
    const orderItems = toArray(order.orderItems ?? order.order_items).map((item) => {
        const normalizedProduct = normalizeProduct(item.product ?? item);
        const price = Number(item.price ?? normalizedProduct.price ?? 0);

        return {
            ...item,
            id: normalizeId(item.id ?? item._id),
            orderId: normalizeId(item.orderId ?? item.order_id),
            productId: normalizeId(item.productId ?? item.product_id ?? normalizedProduct.id),
            quantity: Number(item.quantity ?? 1),
            price,
            formattedPrice: formatCurrency(price),
            product: normalizedProduct,
            title: normalizedProduct.title,
            image: normalizedProduct.image,
        };
    });

    const totalPrice = Number(order.totalPrice ?? order.total_price ?? 0);

    return {
        ...order,
        id: normalizeId(order.id ?? order._id),
        userId: normalizeId(order.userId ?? order.user_id),
        totalPrice,
        formattedTotalPrice: formatCurrency(totalPrice),
        status: order.status ?? 'pending',
        paymentStatus: order.paymentStatus ?? order.payment_status ?? 'pending',
        entitlementStatus: order.entitlementStatus ?? order.entitlement_status ?? 'auto',
        razorpayOrderId: toString(order.razorpayOrderId ?? order.razorpay_order_id),
        razorpayPaymentId: toString(order.razorpayPaymentId ?? order.razorpay_payment_id),
        entitled: Boolean(
            order.entitled ??
            order.isPaid ??
            ((order.paymentStatus ?? order.payment_status) === 'paid' || (order.status ?? '') === 'paid')
        ),
        orderItems,
        addDeploymentService: Boolean(order.addDeploymentService ?? order.add_deployment_service ?? false),
        deploymentServiceFee: Number(order.deploymentServiceFee ?? order.deployment_service_fee ?? 0),
        createdAt: order.createdAt ?? order.created_at ?? null,
        updatedAt: order.updatedAt ?? order.updated_at ?? null,
    };
};

export const normalizeDoc = (doc = {}) => {
    const price = Number(doc.price ?? 0);

    return {
        ...doc,
        id: normalizeId(doc.id ?? doc._id),
        price,
        formattedPrice: price === 0 ? 'Free' : formatCurrency(price),
        isPremium: Boolean(doc.isPremium ?? doc.is_premium ?? price > 0),
        hasAccess: Boolean(doc.hasAccess ?? doc.has_access ?? false),
        locked: Boolean(doc.locked ?? false),
        previewContent: toString(doc.previewContent ?? doc.preview_content),
        tableOfContents: toArray(doc.tableOfContents ?? doc.table_of_contents),
        tags: toArray(doc.tags ?? doc.docTags),
        createdAt: doc.createdAt ?? doc.created_at ?? null,
        updatedAt: doc.updatedAt ?? doc.updated_at ?? null,
    };
};

export const normalizeSiteConfig = (config = {}) => ({
    ...config,
    heroTitle: config.heroTitle ?? '',
    heroSubtitle: config.heroSubtitle ?? '',
    announcements: toArray(config.announcements).length > 0 
        ? toArray(config.announcements) 
        : (config.announcementMessage ? [config.announcementMessage] : []),
    carouselStack: toArray(config.carouselStack).map(item => ({
        image: toString(item.image),
        link: toString(item.link),
        title: toString(item.title)
    })),
    showAnnouncement: Boolean(config.showAnnouncement),
    supportEmail: config.supportEmail ?? '',
    features: config.features ?? {},
    memberPlans: toArray(config.memberPlans),
    faqs: toArray(config.faqs),
    socialProof: {
        rating: toString(config.socialProof?.rating),
        summary: toString(config.socialProof?.summary),
        creatorsLabel: toString(config.socialProof?.creatorsLabel),
        trustedCompanies: toArray(config.socialProof?.trustedCompanies),
        avatarImages: toArray(config.socialProof?.avatarImages),
    },
    showcaseItems: toArray(config.showcaseItems),
    contact: {
        heading: toString(config.contact?.heading, 'Contact us'),
        subheading: toString(config.contact?.subheading),
        email: toString(config.contact?.email ?? config.supportEmail),
        address: toString(config.contact?.address),
        phone: toString(config.contact?.phone),
    },
    aiSettings: {
        enabled: Boolean(config.aiSettings?.enabled ?? false),
        serviceUrl: toString(config.aiSettings?.serviceUrl),
        model: toString(config.aiSettings?.model),
        apiKey: toString(config.aiSettings?.apiKey),
    },
    eliteSettings: {
        deploymentFee: Number(config.eliteSettings?.deploymentFee ?? 149),
        negotiationEnabled: Boolean(config.eliteSettings?.negotiationEnabled),
        negotiationFee: Number(config.eliteSettings?.negotiationFee ?? 0),
    },
});

export const normalizeSalesSummary = (entry = {}) => ({
    ...entry,
    productId: normalizeId(entry.productId ?? entry.product_id),
    totalSold: Number(entry.totalSold ?? entry.total_sold ?? 0),
    revenue: Number(entry.revenue ?? 0),
    formattedRevenue: formatCurrency(entry.revenue ?? 0),
});

export const normalizeReview = (review = {}) => ({
    ...review,
    id: normalizeId(review.id ?? review._id),
    productId: normalizeId(review.productId ?? review.product_id),
    userId: normalizeId(review.userId ?? review.user_id),
    rating: Number(review.rating ?? 0),
    comment: toString(review.comment ?? review.text),
    status: toString(review.status, 'approved'),
    verifiedPurchase: Boolean(review.verifiedPurchase ?? review.verified_purchase ?? false),
    createdAt: review.createdAt ?? review.created_at ?? null,
    updatedAt: review.updatedAt ?? review.updated_at ?? null,
    user: review.user ? normalizeUser(review.user) : null,
    product: review.product ? normalizeProduct(review.product) : null,
});

export const normalizeLicense = (license = {}) => ({
    ...license,
    id: normalizeId(license.id ?? license._id),
    userId: normalizeId(license.userId ?? license.user_id),
    productId: normalizeId(license.productId ?? license.product_id),
    orderId: normalizeId(license.orderId ?? license.order_id),
    type: toString(license.type, 'personal'),
    status: toString(license.status, 'active'),
    licenseKey: toString(license.licenseKey ?? license.license_key),
    expiryDate: license.expiryDate ?? license.expiry_date ?? null,
    createdAt: license.createdAt ?? license.created_at ?? null,
    updatedAt: license.updatedAt ?? license.updated_at ?? null,
    product: license.product ? normalizeProduct(license.product) : null,
    order: license.order ? normalizeOrder(license.order) : null,
});

export const normalizePost = (post = {}) => {
    const readingTime = calculateReadingTime(post.content ?? '');
    
    return {
        ...post,
        id: normalizeId(post.id ?? post._id),
        title: toString(post.title, 'Untitled Post'),
        slug: toString(post.slug),
        content: toString(post.content),
        category: toString(post.category, 'Insight'),
        readingTime,
        author: post.author ? normalizeUser(post.author) : null,
        publishedAt: post.publishedAt ?? post.published_at ?? post.createdAt ?? post.created_at ?? null,
        createdAt: post.createdAt ?? post.created_at ?? null,
        updatedAt: post.updatedAt ?? post.updated_at ?? null,
    };
};
