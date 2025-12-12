const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    const keyword = req.query.keyword ? {
        title: {
            $regex: req.query.keyword,
            $options: 'i'
        }
    } : {};

    const products = await Product.find({ ...keyword });
    res.json(products);
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    let product;

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        product = await Product.findById(req.params.id);
    }

    if (product) {
        res.json(product);
    } else {
        // Try finding by internal "id" field (from legacy data seeder)
        // We assume legacy ID is a number or string in "id" field
        const productByIntId = await Product.findOne({ id: req.params.id });

        if (productByIntId) {
            res.json(productByIntId);
        } else {
            res.status(404);
            throw new Error('Product not found');
        }
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        await product.deleteOne();
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
    const product = new Product({
        title: 'Sample Name',
        price: '$0.00',
        user: req.user._id,
        image: '/images/sample.jpg',
        category: 'Sample Category',
        countInStock: 0,
        description: 'Sample description',
        longDescription: 'Long description',
        features: ['Sample Config'],
        pages: ['Home']
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
    const {
        title,
        price,
        description,
        image,
        category,
        countInStock,
        features,
        pages,
        longDescription,
        productType,
        techStack,
        liveDemo,
        githubRepo,
        documentation
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        product.title = title;
        product.price = price;
        product.description = description;
        product.image = image;
        product.category = category;
        product.countInStock = countInStock;
        product.features = features || product.features;
        product.pages = pages || product.pages;

        // New Fields
        product.longDescription = longDescription;
        product.productType = productType;
        product.techStack = techStack;
        product.liveDemo = liveDemo;
        product.githubRepo = githubRepo;
        product.documentation = documentation;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

module.exports = {
    getProducts,
    getProductById,
    deleteProduct,
    createProduct,
    updateProduct
};
