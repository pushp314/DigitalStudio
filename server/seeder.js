const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Product = require('./models/Product');
const User = require('./models/User');
const PremiumDoc = require('./models/PremiumDoc');
const SiteConfig = require('./models/SiteConfig');

dotenv.config();
connectDB();

// Helper to create slugs
const createSlug = (text) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

const marketplaceProducts = [
    // FULL-STACK PROJECTS
    {
        title: "SaaS Starter Kit Pro",
        slug: createSlug("SaaS Starter Kit Pro"),
        productType: "fullstack",
        category: "Full-Stack Project",
        price: "$199",
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
        images: [
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800"
        ],
        description: "Complete SaaS platform with authentication, billing, multi-tenancy, and admin dashboard.",
        longDescription: "The ultimate SaaS starter kit with everything you need: user authentication (email, Google, GitHub), Stripe billing integration, team management, role-based permissions, admin dashboard, email notifications, and more.",
        techStack: ["Next.js", "TypeScript", "PostgreSQL", "Tailwind", "Node.js"],
        hasBackend: true,
        hasFrontend: true,
        hasDatabase: true,
        rating: 4.9,
        numReviews: 47,
        numSales: 234,
        isBestseller: true,
        isFeatured: true,
        features: ["Complete Auth", "Stripe Billing", "Multi-tenancy", "Admin Dashboard"],
        liveDemo: "https://saas-demo.flowgrid.dev",
        countInStock: 999,
        version: "2.1.0"
    },
    // API COLLECTIONS
    {
        title: "Authentication API Complete",
        slug: createSlug("Authentication API Complete"),
        productType: "api",
        category: "API Collection",
        price: "$49",
        image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=800",
        description: "Production-ready authentication API with JWT, OAuth, 2FA, email verification.",
        longDescription: "Save weeks of development with this battle-tested authentication API. Includes JWT token management, OAuth integration, two-factor authentication, and rate limiting.",
        techStack: ["Node.js", "Express", "MongoDB"],
        hasBackend: true,
        rating: 5.0,
        numReviews: 124,
        isBestseller: true,
        features: ["JWT Auth", "OAuth 2.0", "Two-Factor Auth", "Rate Limiting"],
        countInStock: 999,
        version: "1.5.0"
    },
    // COMPONENT LIBRARIES
    {
        title: "Premium UI Components",
        slug: createSlug("Premium UI Components"),
        productType: "component",
        category: "Component Library",
        price: "$39",
        image: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&q=80&w=800",
        description: "50+ production-ready React components with TypeScript and animations.",
        longDescription: "Build beautiful interfaces faster. Includes forms, buttons, modals, data tables, charts, navigation, and more. Fully typed with TypeScript.",
        techStack: ["React", "TypeScript", "Tailwind"],
        hasFrontend: true,
        rating: 4.8,
        numReviews: 156,
        isFeatured: true,
        features: ["50+ Components", "TypeScript Support", "Dark Mode", "Accessible"],
        countInStock: 999
    }
];

const premiumDocs = [
    {
        title: "Production-Grade React Native Boilerplate",
        slug: createSlug("Production-Grade React Native Boilerplate"),
        description: "A complete guide to building scalable mobile apps.",
        content_md: "# React Native Boilerplate\n\nThis guide covers...\n\n## Table of Contents\n1. Setup\n2. Navigation\n3. State Management",
        category: "Mobile Development",
        price: "$29",
        requires_subscription: true
    },
    {
        title: "FastAPI Authentication Handbook",
        slug: createSlug("FastAPI Authentication Handbook"),
        description: "Deep dive into securing Python APIs.",
        content_md: "# FastAPI Auth\n\nLearn how to implement OAuth2 and JWT in FastAPI...",
        category: "Backend Development",
        price: "$19",
        requires_subscription: true
    }
];

const importData = async () => {
    try {
        await Product.deleteMany();
        await User.deleteMany();
        await PremiumDoc.deleteMany();
        await SiteConfig.deleteMany();

        // 1. Create Admin
        const adminUser = await User.create({
            name: 'CodeStudio Admin',
            email: 'admin@codestudio.com',
            password: 'admin', // As requested
            role: 'admin',
            avatar: '/uploads/admin-avatar.png',
            subscription_plan: 'enterprise'
        });

        const sampleUser = await User.create({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'password',
            role: 'user',
            subscription_plan: 'free'
        });

        // 2. Create Products
        const sampleProducts = marketplaceProducts.map((product) => {
            return { ...product, user: adminUser._id };
        });

        await Product.insertMany(sampleProducts);

        // 3. Create Premium Docs
        await PremiumDoc.insertMany(premiumDocs);

        // 4. Create Site Config
        await SiteConfig.create({
            heroTitle: "Building quality CodeStudio resources.",
            heroSubtitle: "The official marketplace for premium developer tools.",
            announcementMessage: "🎉 CodeStudio Pro Subscription is now live!",
            showAnnouncement: true,
            features: {
                saas: true,
                docs: true,
                hub: true
            }
        });

        console.log('✅ CodeStudio Data Imported!');
        console.log(`📦 ${sampleProducts.length} products added`);
        console.log(`📝 ${premiumDocs.length} docs added`);
        console.log(`👤 Admin created: admin@codestudio.com / admin`);

        process.exit();
    } catch (error) {
        console.error(`❌ Error: ${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Product.deleteMany();
        await User.deleteMany();
        await PremiumDoc.deleteMany();
        await SiteConfig.deleteMany();
        console.log('🗑️  Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`❌ Error: ${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
