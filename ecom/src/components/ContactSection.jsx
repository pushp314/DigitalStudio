import React, { useContext, useState, useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import ConfigContext from '../context/ConfigContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const ContactSection = () => {
    const { config } = useContext(ConfigContext);
    const location = useLocation();
    const { serviceType } = useParams();
    const { success, error: toastError } = useToast();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!!serviceType);
    const [activeIntent, setActiveIntent] = useState(null);
    const isHireFlow = location.pathname.includes('hire-developer');
    const isCustomRequest = location.pathname.includes('custom-request');
    
    React.useEffect(() => {
        if (serviceType) {
            const fetchIntent = async () => {
                try {
                    const data = await api.get(`/intents/service/${serviceType}`);
                    setActiveIntent(data);
                    setForm(prev => ({
                        ...prev,
                        subject: data.headline || data.name
                    }));
                } catch (err) {
                    console.error("Service intent discovery failed:", err);
                } finally {
                    setFetching(false);
                }
            };
            fetchIntent();
        }
    }, [serviceType]);

    const contact = config?.contact ?? {};
    const [form, setForm] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.name || !form.email || !form.message) {
            toastError('Please complete the required fields.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/contact', {
                name: form.name,
                email: form.email,
                subject: form.subject || activeIntent?.headline || (isHireFlow || isCustomRequest ? 'Custom SaaS development request' : 'Product or account question'),
                message: form.message,
                serviceIntentId: activeIntent?.id || null
            });
            success(isHireFlow ? 'Your request has been sent.' : 'Your message has been sent.');
            setForm({ name: '', email: '', subject: '', message: '' });
        } catch (_err) {
            toastError('Unable to send your message right now.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="ds-page px-6 py-16">
            <div className="ds-shell grid gap-8 lg:grid-cols-[320px,minmax(0,1fr)]">
                <div className="space-y-4">
                    <p className="ds-eyebrow">{isHireFlow ? 'Hire Developer' : isCustomRequest ? 'Custom SaaS Development' : 'Contact'}</p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                        {activeIntent?.headline || activeIntent?.name || (isHireFlow ? 'Hire a developer or get expert help' : isCustomRequest ? 'Request a custom SaaS build or dashboard' : (contact.heading || 'Contact BizCode'))}
                    </h1>
                    <p className="text-base leading-7 text-slate-600">
                        {activeIntent?.subheadline || (isHireFlow
                            ? 'Tell us what you want to launch, customize, deploy, or fix. We will help you choose a ready product or scope custom work.'
                            : isCustomRequest
                                ? 'Share your product idea, target users, must-have features, integrations, and launch timeline. We will help scope a custom SaaS app, dashboard, website, or fullstack project.'
                            : (contact.subheading || 'Questions about a product, your account, deployment, or an order? Send us a message and we will reply as soon as possible.'))}
                    </p>

                    <div className="grid gap-3">
                        <div className="ds-card p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Context</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                {activeIntent?.description || 'Custom builds, product selection, implementation help, deployment support, and paid consultation.'}
                            </p>
                        </div>
                        <div className="ds-card p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Want to sell?</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">Submit your own app, template, or software kit for approval-based listing.</p>
                            <Link to="/sell-your-project" className="ds-button-secondary mt-4">Sell your project</Link>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {[contact.email || config?.supportEmail, contact.phone, contact.address].filter(Boolean).map((value) => (
                            <div key={value} className="ds-card p-4 text-sm text-slate-600">
                                {value}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="ds-panel p-6 md:p-8">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Name">
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                    placeholder="Your name"
                                    className="ds-input"
                                />
                            </Field>
                            <Field label="Email">
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                                    placeholder="you@company.com"
                                    className="ds-input"
                                />
                            </Field>
                        </div>

                        <Field label="Subject">
                            <input
                                type="text"
                                value={form.subject}
                                onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                                placeholder={isHireFlow || isCustomRequest ? 'Custom build, deployment, or product advice' : 'How can we help?'}
                                className="ds-input"
                            />
                        </Field>

                        <Field label="Message">
                            <textarea
                                rows="5"
                                value={form.message}
                                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                                placeholder={isHireFlow || isCustomRequest ? 'Tell us your goal, timeline, budget range, existing product link, or what you need customized.' : 'Tell us what you need.'}
                                className="ds-input resize-none"
                            />
                        </Field>

                        <button type="submit" disabled={loading} className="ds-button-primary w-full">
                            {loading ? 'Sending...' : (activeIntent?.cta || (isHireFlow || isCustomRequest ? 'Request Custom Build' : 'Send message'))}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

const Field = ({ label, children }) => (
    <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {children}
    </label>
);

export default ContactSection;
