import React from 'react';
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
        description = 'A product for teams that want a clean starting point and reliable setup guidance.',
        pages = [],
        features = [],
        techStack = [],
        productType = 'template',
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

    return (
        <section className="ds-page px-6 py-12 md:py-16">
            <div className="ds-shell grid gap-6 lg:grid-cols-[minmax(0,1.5fr),minmax(280px,0.8fr)]">
                <div className="space-y-6">
                    <article className="ds-card p-6 md:p-8">
                        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Product details</h2>
                        <div className="markdown-content prose prose-slate mt-6 max-w-none text-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {description}
                            </ReactMarkdown>
                        </div>

                        {(liveDemo || githubRepo) && (
                            <div className="mt-6 flex flex-wrap gap-3">
                                {liveDemo && (
                                    <a href={liveDemo} target="_blank" rel="noopener noreferrer" className="ds-button-primary">
                                        Open live demo
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

                    <DetailList title="Included features" items={features} />
                    <DetailList title="Pages" items={pages} />
                    <DetailList title="Tech stack" items={techStack} />

                    {(documentationInfo?.setup || documentationInfo?.deployment) && (
                        <section className="ds-card p-6">
                            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Documentation</h2>
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
                </div>
            </div>
        </section>
    );
};

export default TemplateDetails;
