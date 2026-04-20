import React, { useContext, useState } from 'react';
import ConfigContext from '../context/ConfigContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const ContactSection = () => {
    const { config } = useContext(ConfigContext);
    const { success, error: toastError } = useToast();
    const [loading, setLoading] = useState(false);

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
                subject: form.subject || 'Marketplace question',
                message: form.message,
            });
            success('Your message has been sent.');
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
                    <p className="ds-eyebrow">Contact</p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                        {contact.heading || 'Contact us'}
                    </h1>
                    <p className="text-base leading-7 text-slate-600">
                        {contact.subheading || 'Questions about a product, your account, or an order? Send us a message and we will reply as soon as possible.'}
                    </p>

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
                                placeholder="How can we help?"
                                className="ds-input"
                            />
                        </Field>

                        <Field label="Message">
                            <textarea
                                rows="5"
                                value={form.message}
                                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                                placeholder="Tell us what you need."
                                className="ds-input resize-none"
                            />
                        </Field>

                        <button type="submit" disabled={loading} className="ds-button-primary w-full">
                            {loading ? 'Sending...' : 'Send message'}
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
