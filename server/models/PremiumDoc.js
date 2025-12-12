const mongoose = require('mongoose');

const premiumDocSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    content_md: {
        type: String,
        required: true // Markdown content
    },
    category: {
        type: String,
        required: true
    },
    price: {
        type: String,
        default: '0' // Can be sold individually
    },
    requires_subscription: {
        type: Boolean,
        default: true
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    tags: [String]
}, {
    timestamps: true
});

// Auto-generate slug
premiumDocSchema.pre('save', function (next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

module.exports = mongoose.model('PremiumDoc', premiumDocSchema);
