import React from 'react';
import { Link } from 'react-router-dom';
import Meta from '../components/common/Meta';
import { absoluteUrl, breadcrumbSchema } from '../utils/seo';

const requirementBlocks = [
    'Product goal and target users',
    'Core SaaS workflows and dashboard screens',
    'Authentication, roles, and permissions',
    'Tech stack, integrations, and deployment needs',
    'Custom build scope and launch priorities',
];

const AIRequirementsGenerator = () => (
    <div className="ds-page px-6 py-16">
        <Meta
            title="AI Project Requirements Generator"
            description="Generate SaaS project requirements, dashboard build scopes, and fullstack app plans before buying templates or hiring developers."
            canonical={absoluteUrl('/ai-requirements-generator')}
            jsonLd={[breadcrumbSchema([
                { name: 'Home', path: '/' },
                { name: 'AI Requirements Generator', path: '/ai-requirements-generator' },
            ])]}
        />

        <div className="ds-shell grid gap-8 lg:grid-cols-[minmax(0,1fr),380px]">
            <section className="space-y-6">
                <p className="ds-eyebrow">AI planning</p>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                    AI project requirements generator for SaaS, dashboards, and fullstack apps
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600">
                    Turn a product idea into a clearer software scope before you buy a SaaS template,
                    choose a dashboard asset, or request custom development. BizCode helps you define
                    what to build, what to customize, and which developer asset can shorten the path.
                </p>
                <div className="flex flex-wrap gap-3">
                    <Link to="/support" className="ds-button-primary">Get Expert Help</Link>
                    <Link to="/custom-request" className="ds-button-secondary">Request Custom Build</Link>
                    <Link to="/assets" className="ds-button-ghost">Browse Assets</Link>
                </div>
            </section>

            <aside className="ds-card p-6">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">Requirement sections</h2>
                <ul className="mt-5 space-y-3">
                    {requirementBlocks.map((item) => (
                        <li key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                            {item}
                        </li>
                    ))}
                </ul>
            </aside>
        </div>
    </div>
);

export default AIRequirementsGenerator;
