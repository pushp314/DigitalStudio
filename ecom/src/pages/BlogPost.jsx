import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Meta from '../components/common/Meta';
import { getBlogPost } from '../data/blogPosts';
import { CATEGORY_SEO } from '../data/seoContent';
import { absoluteUrl, blogPostingSchema, breadcrumbSchema } from '../utils/seo';

const productLinks = {
    'horizon-ai': '/assets/fullstack-projects/horizon-ai',
    'launch-portfolio-kit': '/assets/website-templates/launch-portfolio-kit',
};

const BlogPost = () => {
    const { slug } = useParams();
    const post = getBlogPost(slug);

    if (!post) {
        return <Navigate to="/blog" replace />;
    }

    return (
        <div className="ds-page px-6 py-16">
            <Meta
                title={post.title}
                description={post.description}
                canonical={absoluteUrl(`/blog/${post.slug}`)}
                type="article"
                jsonLd={[
                    blogPostingSchema(post),
                    breadcrumbSchema([
                        { name: 'Home', path: '/' },
                        { name: 'Blog', path: '/blog' },
                        { name: post.title, path: `/blog/${post.slug}` },
                    ]),
                ]}
            />

            <div className="ds-shell grid gap-10 lg:grid-cols-[minmax(0,1fr),320px]">
                <article className="ds-card p-6 md:p-10">
                    <p className="ds-eyebrow mb-4">{post.category} · {post.targetKeyword}</p>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{post.title}</h1>
                    <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">{post.description}</p>

                    <div className="mt-10 space-y-10">
                        {post.sections.map(([heading, body]) => (
                            <section key={heading} className="space-y-3">
                                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{heading}</h2>
                                <p className="text-base leading-8 text-slate-600">{body}</p>
                            </section>
                        ))}
                    </div>

                    <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Turn this guide into a build plan</h2>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            Compare matching products, request a custom SaaS build, or ask BizCode to adapt a template into your product.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <Link to="/assets" className="ds-button-primary">Browse Developer Assets</Link>
                            <Link to="/custom-request" className="ds-button-secondary">Request Custom Build</Link>
                        </div>
                    </section>
                </article>

                <aside className="space-y-6">
                    <div className="ds-card sticky top-28 p-6">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Related links</h2>
                        <div className="mt-5 space-y-3">
                            {post.relatedCategories.map((categorySlug) => (
                                <Link key={categorySlug} to={`/assets/${categorySlug}`} className="block rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 hover:text-slate-900">
                                    {CATEGORY_SEO[categorySlug]?.title || categorySlug}
                                </Link>
                            ))}
                            {post.relatedProducts.map((productSlug) => (
                                <Link key={productSlug} to={productLinks[productSlug] || '/assets'} className="block rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 hover:text-slate-900">
                                    View {productSlug.replace(/-/g, ' ')}
                                </Link>
                            ))}
                            <Link to="/custom-request" className="block rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm font-semibold text-indigo-700">
                                Request Custom Build
                            </Link>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default BlogPost;
