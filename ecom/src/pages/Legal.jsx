import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Legal = ({ type = 'terms' }) => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    const isTerms = type === 'terms';

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="bg-slate-950 py-24 px-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#3b82f6_0%,transparent_50%)]"></div>
                </div>
                <div className="max-w-4xl mx-auto relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6 animate-in slide-in-from-bottom-4 duration-700">
                        {isTerms ? 'Terms & Conditions' : 'Privacy Policy'}
                    </h1>
                    <div className="flex items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
                        <span>Last Updated: April 20, 2026</span>
                        <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                        <span>Devnity © Appnity Softwares</span>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="prose prose-slate prose-lg max-w-none">
                    {isTerms ? (
                        <div className="space-y-12 animate-in fade-in duration-1000">
                            <Section title="1. Definitions">
                                <p>Welcome to <strong>Devnity</strong>. These Terms & Conditions ("Terms") govern your access to and use of the Devnity platform, including any services, digital products, and subscriptions provided by <strong>Appnity Softwares (India)</strong> ("Company," "we," "us," or "our").</p>
                                <ul className="list-disc pl-6 space-y-2 text-slate-600">
                                    <li><strong>Platform</strong>: Refers to https://devnity.appnity.co.in and all associated subdomains.</li>
                                    <li><strong>User</strong>: Any individual or entity accessing the Platform or using our Services.</li>
                                    <li><strong>Services</strong>: Development services, SaaS builds, APIs, LMS systems, and digital product delivery.</li>
                                    <li><strong>Digital Products</strong>: Code templates, snippets, documentation, and design assets.</li>
                                </ul>
                            </Section>

                            <Section title="2. Eligibility">
                                <p className="text-slate-600 leading-relaxed">By using Devnity, you represent that you are at least 18 years of age and have the legal capacity to enter into a binding contract under the laws of India. If you are using the Services on behalf of a company, you represent that you have the authority to bind that entity.</p>
                            </Section>

                            <Section title="3. Account Registration & Responsibilities">
                                <p className="text-slate-600 leading-relaxed">You must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your credentials. Any activity occurring under your account is your sole responsibility.</p>
                            </Section>

                            <Section title="4. Acceptable Use Policy">
                                <p className="text-slate-600 mb-4">You agree NOT to:</p>
                                <ul className="list-disc pl-6 space-y-2 text-slate-600">
                                    <li>Scrape, crawl, or reverse engineer any part of the Platform or its source code.</li>
                                    <li>Use the Services for any illegal or unauthorized purpose.</li>
                                    <li>Attempt to bypass security measures or access data not intended for you.</li>
                                </ul>
                            </Section>

                            <Section title="5. Payments & Digital Products">
                                <p className="text-slate-600 leading-relaxed mb-4">All prices are as listed on the Platform and are subject to change. Membership plans are billed on a recurring cycle. Given the digital nature of our products, refunds are strictly conditional.</p>
                                <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-2">Licensing Protocol</p>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium capitalize">Upon purchase, Devnity grants you a non-transferable, non-sublicensable, and non-exclusive license to use the digital product for your projects. Reselling or redistribution is strictly prohibited.</p>
                                </div>
                            </Section>

                            <Section title="6. AI Tools Disclaimer">
                                <p className="text-slate-600 leading-relaxed">Devnity provides AI-powered tools (e.g., Description Generation, Pricing Suggestions). These outputs are generated based on probabilistic models and are intended as <strong>suggestions only</strong>. We do not guarantee the accuracy, legality, or suitability of AI-generated content.</p>
                            </Section>

                            <Section title="7. Governing Law">
                                <p className="text-slate-600 leading-relaxed">These Terms shall be governed by and construed in accordance with the laws of <strong>India</strong>. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.</p>
                            </Section>
                        </div>
                    ) : (
                        <div className="space-y-12 animate-in fade-in duration-1000">
                            <Section title="1. Information Collected">
                                <p className="text-slate-600 mb-4">At Devnity, we respect your privacy. We collect the following types of information:</p>
                                <ul className="list-disc pl-6 space-y-2 text-slate-600">
                                    <li><strong>Personal Data</strong>: Name, email, and professional details provided during registration.</li>
                                    <li><strong>Technical Data</strong>: IP address, browser type, and device information collected via automated logs.</li>
                                    <li><strong>Payment Data</strong>: We use secure third-party processors (Razorpay). We do <strong>not</strong> store sensitive card details on our servers.</li>
                                </ul>
                            </Section>

                            <Section title="2. How Data is Used">
                                <p className="text-slate-600 leading-relaxed">We process your information to manage your account, deliver purchased products, improve Platform performance using analytics, and communicate security alerts or updates.</p>
                            </Section>

                            <Section title="3. Data Security">
                                <p className="text-slate-600 leading-relaxed">We implement industry-standard security measures, including SSL/TLS encryption and secure hashing for passwords. However, no method of transmission over the internet is 100% secure.</p>
                            </Section>

                            <Section title="4. Sharing & Retention">
                                <p className="text-slate-600 leading-relaxed">We share data only with trusted third parties necessary for service delivery (Payment processing, Hosting). We retain your personal information only as long as your account is active or as needed to provide Services and comply with legal obligations.</p>
                            </Section>

                            <Section title="5. Your Rights">
                                <p className="text-slate-600 leading-relaxed">You have the right to access, update, or request the deletion of your personal information via your Profile settings. Significant changes to this policy will be notified via the Platform.</p>
                            </Section>
                        </div>
                    )}
                </div>

                <div className="mt-20 pt-12 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Need Legal Clarification?</p>
                    <a href="mailto:business@appnity.co.in" className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all">
                        Contact Legal Team
                    </a>
                </div>
            </div>
        </div>
    );
};

const Section = ({ title, children }) => (
    <section>
        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-4">
            <span className="w-8 h-px bg-blue-600"></span>
            {title}
        </h2>
        <div className="text-sm font-medium leading-relaxed">
            {children}
        </div>
    </section>
);

export default Legal;
