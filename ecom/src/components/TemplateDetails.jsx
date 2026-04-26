import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const DetailList = ({ items, title }) => {
    if (!items.length) {
        return null;
    }

    return (
        <section className="ds-card p-6">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
            <ul className="mt-4 space-y-3">
                {items.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                        <span className="mt-2 h-2 w-2 rounded-full bg-slate-900" />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
};

const TemplateDetails = ({ product }) => {
    const {
        title = 'this product',
        description = 'A product for teams that want a clean starting point and reliable setup guidance.',
        pages = [],
        features = [],
        techStack = [],
        productType = 'template',
        category = '',
        documentationInfo = {},
        liveDemo = '',
        githubRepo = '',
        rating = 0,
        numReviews = 0,
        snippet = '',
        snippetLanguage = '',
        courseOutline = '',
        duration = '',
        changelog = [],
    } = product || {};

    const includedItems = features.length > 0 ? features : [
        'Source files for the purchased product',
        'Product structure ready for customization',
        'Account-based access after payment verification',
    ];
    const bestFor = [
        category || 'Founders and teams shipping a product faster',
        productType === 'fullstack' ? 'Teams that need frontend and backend foundations' : 'Builders who want a reliable starting point',
        'Agencies, startups, and businesses that need implementation support',
    ];

    return (
        <section className="ds-page px-6 py-12 md:py-16">
            <div className="ds-shell grid gap-6 lg:grid-cols-[minmax(0,1.5fr),minmax(280px,0.8fr)]">
                <div className="space-y-6">
                    <article className="ds-card p-6 md:p-8">
                        <p className="ds-eyebrow mb-3">What this helps you launch</p>
                        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{title}</h2>
                        <div className="markdown-content prose prose-slate mt-6 max-w-none text-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {description}
                            </ReactMarkdown>
                        </div>

                        {(liveDemo || githubRepo) && (
                            <div className="mt-6 flex flex-wrap gap-3">
                                {liveDemo && (
                                    <a href={liveDemo} target="_blank" rel="noopener noreferrer" className="ds-button-primary">
                                        View Demo
                                    </a>
                                )}
                                {githubRepo && (
                                    <a href={githubRepo} target="_blank" rel="noopener noreferrer" className="ds-button-secondary">
                                        View repository
                                    </a>
                                )}
                            </div>
                        )}
                    </article>

                    {snippet && (
                        <section className="ds-card overflow-hidden">
                            <div className="border-b border-slate-200 px-6 py-4">
                                <h3 className="text-lg font-semibold tracking-tight text-slate-900">Code preview</h3>
                                {snippetLanguage && <p className="mt-1 text-sm text-slate-500">{snippetLanguage}</p>}
                            </div>
                            <pre className="overflow-x-auto bg-slate-950 p-6 text-sm leading-6 text-slate-100">
                                <code>{snippet}</code>
                            </pre>
                        </section>
                    )}

                    <section className="grid gap-4 md:grid-cols-2">
                        <div className="ds-card p-8 bg-slate-50/50">
                            <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase italic">Workflow Continuity</h3>
                            <p className="mt-4 text-[11px] leading-relaxed text-slate-500 font-medium tracking-tight">
                                Verified payment unlocks the product in your account. Every software asset includes established implementation paths. If you need deployment help or strategic technical guidance, you can initiate a support request immediately after purchase.
                            </p>
                            <Link to="/support" className="inline-flex items-center gap-2 mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 hover:text-indigo-800 transition-all">
                                Get Expert Help <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="ds-card p-8 border-indigo-100 bg-indigo-50/20">
                            <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase italic">Need modifications?</h3>
                            <p className="mt-4 text-[11px] leading-relaxed text-slate-500 font-medium tracking-tight">
                                If this product fits your vision but requires custom branding, specific feature development, or a dedicated deployment team, we are ready to assist. Our developers can forked this product and build exactly what you need.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-6">
                                <Link to="/custom-request" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 hover:opacity-70 transition-all flex items-center gap-2">
                                    Request Custom Build <ArrowRight size={12} />
                                </Link>
                                <Link to="/support" className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 hover:text-indigo-800 transition-all flex items-center gap-2">
                                    Get Expert Help <ArrowRight size={12} />
                                </Link>
                            </div>
                        </div>
                    </section>

                    {courseOutline && (
                        <section className="ds-card p-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h3 className="text-xl font-semibold tracking-tight text-slate-900">Course outline</h3>
                                {duration && <span className="text-sm text-slate-500">{duration}</span>}
                            </div>
                            <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{courseOutline}</div>
                        </section>
                    )}

                    {Array.isArray(changelog) && changelog.length > 0 && (
                        <section className="ds-card p-6">
                            <h3 className="text-xl font-semibold tracking-tight text-slate-900">Updates</h3>
                            <div className="mt-5 space-y-4">
                                {changelog.map((entry, index) => (
                                    <article key={`${entry.version}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <span className="text-sm font-medium text-slate-900">Version {entry.version}</span>
                                            <span className="text-sm text-slate-500">{entry.date}</span>
                                        </div>
                                        <ul className="mt-3 space-y-2">
                                            {(entry.changes || []).map((change, changeIndex) => (
                                                <li key={`${change}-${changeIndex}`} className="text-sm leading-6 text-slate-600">
                                                    {change}
                                                </li>
                                            ))}
                                        </ul>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <div className="space-y-6">
                    <section className="ds-card p-6">
                        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Product info</h2>
                        <dl className="mt-4 space-y-3 text-sm">
                            <div className="flex items-center justify-between gap-4">
                                <dt className="text-slate-500">Type</dt>
                                <dd className="font-medium capitalize text-slate-900">{productType}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <dt className="text-slate-500">Rating</dt>
                                <dd className="font-medium text-slate-900">{rating} ({numReviews})</dd>
                            </div>
                            {duration && (
                                <div className="flex items-center justify-between gap-4">
                                    <dt className="text-slate-500">Duration</dt>
                                    <dd className="font-medium text-slate-900">{duration}</dd>
                                </div>
                            )}
                        </dl>
                    </section>

                    <DetailList title="Best for" items={bestFor} />
                    <DetailList title="What's included" items={includedItems} />
                    <DetailList title="Pages" items={pages} />
                    <DetailList title="Tech stack" items={techStack} />

                    {(documentationInfo?.setup || documentationInfo?.deployment) && (
                        <section className="ds-card p-6">
                            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Setup and deployment support</h2>
                            <ul className="mt-4 space-y-3">
                                {documentationInfo.setup && (
                                    <li className="text-sm leading-6 text-slate-600">Setup guide included</li>
                                )}
                                {documentationInfo.deployment && (
                                    <li className="text-sm leading-6 text-slate-600">Deployment guide included</li>
                                )}
                            </ul>
                        </section>
                    )}

                    <section className="ds-card p-8 bg-white border-slate-200 shadow-sm">
                        <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4 mb-6 italic">Support Options</h2>
                        <div className="space-y-6 mb-8">
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">1. Standard Documentation</span>
                                <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase tracking-widest">Buy the product and use the included technical documentation for self-deployment.</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">2. Guided Setup</span>
                                <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase tracking-widest">Open a priority technical ticket after purchase for 1:1 setup and configuration help.</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">3. Custom Development</span>
                                <p className="text-[9px] text-slate-500 font-medium leading-relaxed uppercase tracking-widest">Talk to an expert before purchase to discuss architecture changes or full custom builds.</p>
                            </div>
                        </div>
                        <Link to="/support" className="w-full ds-button-secondary py-4 flex items-center justify-center bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100">
                           <Sparkles size={14} className="mr-2 text-indigo-500" /> Get Expert Help
                        </Link>
                    </section>
                </div>
            </div>
        </section>
    );
};

export default TemplateDetails;
