import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import ConfigContext from '../../context/ConfigContext';

const Footer = () => {
    const { config } = useContext(ConfigContext);
    const supportEmail = config?.contact?.email || config?.supportEmail || 'support@digitalstudio.com';

    const links = [
        { label: 'Templates', to: '/templates' },
        ...(config?.features?.docs ? [{ label: 'Docs', to: '/docs' }] : []),
        ...(config?.features?.subscriptions ? [{ label: 'Pricing', to: '/pricing' }] : []),
        { label: 'FAQ', to: '/faq' },
        { label: 'Contact', to: '/contact' },
    ];

    return (
        <footer className="ds-page border-t border-slate-200 px-6 py-12">
            <div className="ds-shell grid gap-8 md:grid-cols-[1.2fr,0.8fr,0.8fr]">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
                            DS
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-900">Devnity</div>
                            <div className="text-sm text-slate-600">Premium developer platform for SaaS, APIs, and beyond.</div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="ds-eyebrow mb-2">Support</p>
                        <a href={`mailto:${supportEmail}`} className="text-sm font-medium text-slate-900 hover:underline">
                            {supportEmail}
                        </a>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="ds-eyebrow mb-3">Navigate</p>
                    <div className="flex flex-col gap-2">
                        {links.map((item) => (
                            <Link key={item.to} to={item.to} className="text-sm font-medium text-slate-700 hover:text-slate-900">
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="ds-eyebrow mb-3">Need Help?</p>
                    <p className="text-sm leading-6 text-slate-600">
                        Questions about a product, purchase, or account? Send us a message and we will reply as soon as possible.
                    </p>
                    <div className="mt-4">
                        <Link to="/contact" className="ds-button-primary">
                            Contact Support
                        </Link>
                    </div>
                </div>
            </div>

            <div className="ds-shell mt-8 flex flex-col gap-2 border-t border-slate-200 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
                <p>&copy; {new Date().getFullYear()} Devnity. Powered by Appnity Softwares.</p>
                <div className="flex gap-4">
                    <Link to="/terms" className="hover:text-slate-900 font-medium">Terms</Link>
                    <Link to="/privacy" className="hover:text-slate-900 font-medium">Privacy</Link>
                    <Link to="/contact" className="hover:text-slate-900 font-medium">Contact</Link>
                    {config?.features?.docs && (
                        <Link to="/docs" className="hover:text-slate-900 font-medium whitespace-nowrap">Docs</Link>
                    )}
                </div>
            </div>
        </footer>
    );
};

export default Footer;
