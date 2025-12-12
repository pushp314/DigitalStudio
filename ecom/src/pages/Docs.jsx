import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const Docs = () => {
    const { addToast } = useToast();
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    // Mock data - in production, fetch from API
    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setDocs([
                {
                    _id: '1',
                    title: 'Production-Grade React Architecture',
                    description: 'Complete guide to building scalable React applications with best practices, folder structure, and performance optimization.',
                    category: 'React',
                    price: 29,
                    isPremium: true,
                    previewContent: 'Learn how to structure React apps like a pro...',
                    tags: ['React', 'Architecture', 'Best Practices'],
                    icon: '⚛️'
                },
                {
                    _id: '2',
                    title: 'Stripe Payment Integration Handbook',
                    description: 'Step-by-step guide to integrating Stripe payments, webhooks, subscriptions, and handling edge cases.',
                    category: 'Payments',
                    price: 39,
                    isPremium: true,
                    previewContent: 'Master Stripe integration from setup to production...',
                    tags: ['Stripe', 'Payments', 'Backend'],
                    icon: '💳'
                },
                {
                    _id: '3',
                    title: 'MongoDB Performance Optimization',
                    description: 'Advanced MongoDB techniques for indexing, aggregation pipelines, and query optimization.',
                    category: 'Database',
                    price: 34,
                    isPremium: true,
                    previewContent: 'Optimize your MongoDB queries and scale...',
                    tags: ['MongoDB', 'Database', 'Performance'],
                    icon: '🍃'
                },
                {
                    _id: '4',
                    title: 'Next.js 14 Complete Guide',
                    description: 'Everything you need to know about Next.js 14, App Router, Server Components, and deployment.',
                    category: 'Next.js',
                    price: 44,
                    isPremium: true,
                    previewContent: 'Build modern web apps with Next.js 14...',
                    tags: ['Next.js', 'React', 'SSR'],
                    icon: '▲'
                },
                {
                    _id: '5',
                    title: 'API Security Best Practices',
                    description: 'Comprehensive security guide for REST APIs including authentication, rate limiting, and vulnerability prevention.',
                    category: 'Security',
                    price: 49,
                    isPremium: true,
                    previewContent: 'Secure your APIs against common attacks...',
                    tags: ['Security', 'API', 'Backend'],
                    icon: '🔐'
                },
                {
                    _id: '6',
                    title: 'Getting Started Guide',
                    description: 'Free guide to getting started with CodeStudio and understanding our documentation system.',
                    category: 'General',
                    price: 0,
                    isPremium: false,
                    previewContent: 'Start your journey with CodeStudio...',
                    tags: ['Beginner', 'Free'],
                    icon: '🚀'
                }
            ]);
            setLoading(false);
        }, 500);
    }, []);

    const categories = ['all', 'React', 'Payments', 'Database', 'Next.js', 'Security'];
    const filteredDocs = filter === 'all' ? docs : docs.filter(doc => doc.category === filter);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0055FF] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] px-4 md:px-6 lg:px-8 py-24 md:py-32 font-sans">
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-black text-black mb-4">
                        Premium Documentation
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                        In-depth technical guides, tutorials, and blueprints for modern development.
                        Learn from production-grade documentation.
                    </p>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 justify-center mb-12">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setFilter(category)}
                            className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${filter === category
                                    ? 'bg-[#0055FF] text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-white text-black hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Docs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {filteredDocs.map(doc => (
                        <div
                            key={doc._id}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                                    {doc.icon}
                                </div>
                                {doc.isPremium ? (
                                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
                                        PREMIUM
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full">
                                        FREE
                                    </span>
                                )}
                            </div>

                            <h3 className="text-xl font-black text-black mb-2 group-hover:text-[#0055FF] transition-colors">
                                {doc.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                {doc.description}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {doc.tags.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="text-2xl font-black text-black">
                                    {doc.price === 0 ? 'Free' : `$${doc.price}`}
                                </div>
                                <Link
                                    to={`/docs/${doc._id}`}
                                    className="bg-[#0055FF] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-600 transition-colors"
                                >
                                    {doc.price === 0 ? 'Read' : 'View Details'}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-[#0055FF] to-blue-600 rounded-2xl p-8 md:p-12 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-black mb-4">
                        Want Access to All Docs?
                    </h2>
                    <p className="text-lg mb-6 opacity-90">
                        Subscribe to CodeStudio Pro and get unlimited access to all premium documentation
                    </p>
                    <Link
                        to="/profile"
                        className="inline-block bg-white text-[#0055FF] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
                    >
                        Upgrade to Pro
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Docs;
