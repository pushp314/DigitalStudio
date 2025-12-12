const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },

    // Basic Info
    title: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    images: [String], // Multiple screenshots
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    longDescription: {
        type: String,
        required: false
    },
    price: {
        type: String,
        required: true
    },
    file_url: {
        type: String,
        required: false // Optional, can be empty if it's external link or handled via codePreview
    },
    version: {
        type: String,
        default: '1.0.0'
    },
    requires_subscription: {
        type: Boolean,
        default: false
    },

    // Marketplace-Specific Fields
    productType: {
        type: String,
        enum: ['fullstack', 'api', 'component', 'mobile', 'template', 'tool', 'bundle'],
        default: 'template'
    },

    // Tech Stack
    techStack: [{
        type: String,
        enum: ['React', 'Vue', 'Angular', 'Next.js', 'Node.js', 'Express', 'NestJS',
            'MongoDB', 'PostgreSQL', 'MySQL', 'Firebase', 'Supabase',
            'TypeScript', 'JavaScript', 'Python', 'Django', 'FastAPI',
            'Tailwind', 'Bootstrap', 'Material-UI', 'Chakra UI',
            'React Native', 'Flutter', 'Swift', 'Kotlin']
    }],

    // Technical Details
    hasBackend: { type: Boolean, default: false },
    hasFrontend: { type: Boolean, default: true },
    hasDatabase: { type: Boolean, default: false },
    hasMobileApp: { type: Boolean, default: false },
    hasTests: { type: Boolean, default: false },
    testCoverage: { type: Number, default: 0 }, // percentage

    // Documentation
    documentation: {
        setup: String,
        deployment: String,
        apiDocs: String,
        videoUrl: String
    },

    // Demo & Preview
    liveDemo: String,
    githubRepo: String,
    codePreview: [{
        fileName: String,
        language: String,
        code: String
    }],

    // Ratings & Reviews
    rating: {
        type: Number,
        required: true,
        default: 0
    },
    numReviews: {
        type: Number,
        required: true,
        default: 0
    },

    // Sales & Popularity
    numSales: {
        type: Number,
        default: 0
    },
    numViews: {
        type: Number,
        default: 0
    },

    // Status Badges
    isFeatured: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    isNewProduct: { type: Boolean, default: false }, // Renamed from isNew to avoid Mongoose conflict
    isTrending: { type: Boolean, default: false },
    isFree: { type: Boolean, default: false },

    // Stock & Availability
    countInStock: {
        type: Number,
        required: true,
        default: 999 // Digital products = unlimited
    },

    // Legacy Fields (keep for backwards compatibility)
    features: [String],
    pages: [String],
    previewUrl: String,
    purchaseLink: String,

    // SEO
    slug: {
        type: String
    },
    tags: [String],

    // License Types Available
    licenses: [{
        type: {
            type: String,
            enum: ['personal', 'team', 'extended']
        },
        price: String,
        description: String
    }]
}, {
    timestamps: true
});

// Auto-generate slug from title
productSchema.pre('save', function (next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);
