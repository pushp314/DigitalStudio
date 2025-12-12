const asyncHandler = require('express-async-handler');
const SiteConfig = require('../models/SiteConfig');

// @desc    Get site config
// @route   GET /api/config
// @access  Public
const getId = asyncHandler(async (req, res) => {
    // We only need one config document. Find the first one or create default.
    let config = await SiteConfig.findOne();

    if (!config) {
        config = await SiteConfig.create({});
    }

    res.json(config);
});

// @desc    Update site config
// @route   PUT /api/config
// @access  Private/Admin
const updateConfig = asyncHandler(async (req, res) => {
    let config = await SiteConfig.findOne();

    if (!config) {
        config = new SiteConfig({});
    }

    config.heroTitle = req.body.heroTitle || config.heroTitle;
    config.heroSubtitle = req.body.heroSubtitle || config.heroSubtitle;
    config.announcementMessage = req.body.announcementMessage || config.announcementMessage;
    // Check if boolean explicitly (to allow false)
    if (req.body.showAnnouncement !== undefined) {
        config.showAnnouncement = req.body.showAnnouncement;
    }
    config.supportEmail = req.body.supportEmail || config.supportEmail;

    if (req.body.features) {
        config.features = req.body.features;
    }

    const updatedConfig = await config.save();
    res.json(updatedConfig);
});

module.exports = {
    getId,
    updateConfig
};
