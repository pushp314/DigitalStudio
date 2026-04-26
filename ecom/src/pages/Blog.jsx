import React from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import { BLOG_POSTS } from '../data/blogPosts';
import { CATEGORY_SEO } from '../data/seoContent';
import { absoluteUrl, breadcrumbSchema } from '../utils/seo';

const Blog = () => (
    <div className="ds-page px-6 py-16">
        <Meta
            title="SaaS Building Guides and Developer Tools"
            description="Read guides on SaaS templates, dashboard templates, fullstack projects, developer assets, deployment, and custom SaaS development."
            canonical={absoluteUrl('/blog')}
            jsonLd={[breadcrumbSchema([
                { name: 'Home', path: '/' },
                { name: 'Blog', path: '/blog' },
            ])]}
        />

        <div className="ds-shell space-y-10">
            <section className="max-w-4xl space-y-4">
                <p className="ds-eyebrow">BizCode Blog</p>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                    SaaS building guides, developer tools, and deployment playbooks
                </h1>
                <p className="text-base leading-7 text-slate-600">
                    Practical content for founders, developers, and agencies buying SaaS templates,
                    dashboard templates, fullstack projects, and ready-made apps.
                </p>
            </section>

            <section className="grid gap-4 md:grid-cols-5">
                {Object.values(CATEGORY_SEO).map((category) => (
                    <Link key={category.slug} to={`/assets/${category.slug}`} className="ds-card p-5 hover:border-slate-300">
                        <p className="text-sm font-semibold text-slate-900">{category.title}</p>
                        <p className="mt-2 text-xs leading-5 text-slate-500">Browse matching products</p>
                    </Link>
                ))}
            </section>

            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {BLOG_POSTS.map((post) => (
                    <article key={post.slug} className="ds-card p-6">
                        <p className="ds-eyebrow mb-3">{post.category}</p>
                        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{post.title}</h2>
                        <p className="mt-3 text-sm leading-6 text-slate-600">{post.description}</p>
                        <div className="mt-5 flex flex-wrap gap-2">
                            {post.relatedCategories.slice(0, 2).map((slug) => (
                                <Link key={slug} to={`/assets/${slug}`} className="ds-chip">
                                    {CATEGORY_SEO[slug]?.title || slug}
                                </Link>
                            ))}
                        </div>
                        <Link to={`/blog/${post.slug}`} className="ds-button-secondary mt-6">
                            Read guide
                        </Link>
                    </article>
                ))}
            </section>
        </div>
    </div>
);

export default Blog;
