import React, { useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfigContext from '../context/ConfigContext';

const FAQItem = ({ answer, isOpen, onClick, question }) => (
    <article className="ds-card p-6">
        <button type="button" onClick={onClick} className="flex w-full items-start justify-between gap-4 text-left">
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">{question}</h3>
            <span className="text-xl font-medium text-slate-400">{isOpen ? '−' : '+'}</span>
        </button>
        {isOpen && <p className="mt-4 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-600">{answer}</p>}
    </article>
);

const FAQSection = () => {
    const { config } = useContext(ConfigContext);
    const faqData = useMemo(() => (Array.isArray(config?.faqs) ? config.faqs : []), [config?.faqs]);
    const [openItems, setOpenItems] = useState({ 0: true });

    const toggleItem = (index) => {
        setOpenItems((current) => ({
            ...current,
            [index]: !current[index],
        }));
    };

    if (!faqData.length) {
        return null;
    }

    return (
        <section className="ds-page px-6 py-16">
            <div className="ds-shell space-y-8">
                <div className="space-y-3">
                    <p className="ds-eyebrow">FAQ</p>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                        Common questions about products, access, and support
                    </h2>
                    <p className="max-w-3xl text-base leading-7 text-slate-600">
                        These answers cover the most common questions customers ask before and after purchase.
                    </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    {faqData.map((item, index) => (
                        <FAQItem
                            key={`${item.question}-${index}`}
                            question={item.question}
                            answer={item.answer}
                            isOpen={Boolean(openItems[index])}
                            onClick={() => toggleItem(index)}
                        />
                    ))}
                </div>

                <div className="ds-card p-6 text-center">
                    <p className="text-sm text-slate-600">Need help with a specific order, account issue, or product question?</p>
                    <Link to="/contact" className="ds-button-primary mt-4">
                        Contact support
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
