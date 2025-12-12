const mongoose = require('mongoose');

const siteConfigSchema = mongoose.Schema({
    heroTitle: {
        type: String,
        default: "Building quality Framer templates for creators & founders."
    },
    heroSubtitle: {
        type: String,
        default: "Ship your startup faster with production-grade templates."
    },
    announcementMessage: {
        type: String,
        default: "🚀 New SaaS Starter Kit Released!"
    },
    showAnnouncement: {
        type: Boolean,
        default: true
    },
    supportEmail: {
        type: String,
        default: "support@codestudio.com"
    },
    features: {
        type: Map,
        of: Boolean,
        default: {
            saas: true,
            docs: true,
            hub: true
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SiteConfig', siteConfigSchema);
