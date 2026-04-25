import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import ConfigContext from '../../context/ConfigContext';

const Footer = () => {
    const { config } = useContext(ConfigContext);
    const supportEmail = config?.contact?.email || config?.supportEmail || 'support@bizcode.appnity.co.in';

    const links = [
        { label: 'Explore Apps', to: '/apps' },
        { label: 'Hire Developer', to: '/hire-developer' },
        { label: 'Sell Your Project', to: '/sell-your-project' },
        ...(config?.features?.docs ? [{ label: 'Docs', to: '/docs' }] : []),
        { label: 'Pricing', to: '/pricing' },
        { label: 'Contact', to: '/contact' },
    ];

    return (
        <footer className="ds-page border-t border-slate-200 px-6 py-12">
            <div className="ds-shell grid gap-8 md:grid-cols-[1.2fr,0.8fr,0.8fr]">
                <div className="space-y-4">
                    <Link to="/" className="inline-block">
                        <img src="/logo.png" alt="BizCode" className="h-10 w-auto" />
                    </Link>
                    <p className="text-sm text-slate-600 max-w-xs">Premium ready apps, technical guides, and expert implementation support.</p>
                    
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
                        Questions about a product, deployment, customization, or account? Send us a message and we will reply as soon as possible.
                    </p>
                    <div className="mt-4">
                        <Link to="/contact" className="ds-button-primary">
                            Talk to an Expert
                        </Link>
                    </div>
                </div>
            </div>

            <div className="ds-shell mt-8 flex flex-col gap-2 border-t border-slate-200 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
                <p>&copy; {new Date().getFullYear()} BizCode. Powered by Appnity Softwares.</p>
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
