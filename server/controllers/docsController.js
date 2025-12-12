const PremiumDoc = require('../models/PremiumDoc');

// @desc    Get all premium docs
// @route   GET /api/docs
// @access  Public
exports.getDocs = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category && category !== 'all' ? { category } : {};

        const docs = await PremiumDoc.find(filter).sort({ createdAt: -1 });
        res.json(docs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching docs', error: error.message });
    }
};

// @desc    Get single doc by ID
// @route   GET /api/docs/:id
// @access  Public
exports.getDocById = async (req, res) => {
    try {
        const doc = await PremiumDoc.findById(req.params.id);

        if (!doc) {
            return res.status(404).json({ message: 'Doc not found' });
        }

        res.json(doc);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching doc', error: error.message });
    }
};

// @desc    Create new doc
// @route   POST /api/docs
// @access  Private/Admin
exports.createDoc = async (req, res) => {
    try {
        const { title, description, content, category, price, isPremium, tags } = req.body;

        const doc = await PremiumDoc.create({
            title,
            description,
            content,
            category,
            price: price || 0,
            isPremium: isPremium !== undefined ? isPremium : false,
            tags: tags || [],
            author: req.user ? req.user._id : null
        });

        res.status(201).json(doc);
    } catch (error) {
        res.status(400).json({ message: 'Error creating doc', error: error.message });
    }
};

// @desc    Update doc
// @route   PUT /api/docs/:id
// @access  Private/Admin
exports.updateDoc = async (req, res) => {
    try {
        const doc = await PremiumDoc.findById(req.params.id);

        if (!doc) {
            return res.status(404).json({ message: 'Doc not found' });
        }

        const { title, description, content, category, price, isPremium, tags, status } = req.body;

        doc.title = title || doc.title;
        doc.description = description || doc.description;
        doc.content = content || doc.content;
        doc.category = category || doc.category;
        doc.price = price !== undefined ? price : doc.price;
        doc.isPremium = isPremium !== undefined ? isPremium : doc.isPremium;
        doc.tags = tags || doc.tags;
        doc.status = status || doc.status;

        const updatedDoc = await doc.save();
        res.json(updatedDoc);
    } catch (error) {
        res.status(400).json({ message: 'Error updating doc', error: error.message });
    }
};

// @desc    Delete doc
// @route   DELETE /api/docs/:id
// @access  Private/Admin
exports.deleteDoc = async (req, res) => {
    try {
        const doc = await PremiumDoc.findById(req.params.id);

        if (!doc) {
            return res.status(404).json({ message: 'Doc not found' });
        }

        await doc.deleteOne();
        res.json({ message: 'Doc removed' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting doc', error: error.message });
    }
};
