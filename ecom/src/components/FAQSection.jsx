import React, { useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfigContext from '../context/ConfigContext';

const FAQItem = ({ answer, isOpen, onClick, question }) => (
    <article className={`ds-card p-5 sm:p-6 transition-all duration-300 ${isOpen ? 'ring-1 ring-slate-200 shadow-lg' : 'hover:border-slate-300'}`}>
        <button type="button" onClick={onClick} className="flex w-full items-start justify-between gap-4 text-left">
            <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight">{question}</h3>
            <span className={`text-xl font-bold transition-transform duration-300 ${isOpen ? 'text-slate-900 rotate-0' : 'text-slate-400'}`}>
                {isOpen ? '−' : '+'}
            </span>
        </button>
        {isOpen && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="mt-4 border-t border-slate-100 pt-4 text-xs sm:text-sm leading-relaxed text-slate-600 font-medium">
                    {answer}
                </p>
            </div>
        )}
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
        <section className="ds-page px-4 sm:px-6 py-10 sm:py-12">
            <div className="ds-shell space-y-8 sm:space-y-12">
                <div className="space-y-3 sm:space-y-4">
                    <p className="ds-eyebrow">Details</p>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                        Common questions about products, access, and support
                    </h2>
                    <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-slate-600 font-medium">
                        These answers cover the most common questions customers ask before and after purchase.
                    </p>
                </div>

                <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
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

                <div className="ds-card p-6 sm:p-10 text-center border-slate-100 shadow-xl shadow-slate-100/50">
                    <p className="text-xs sm:text-sm text-slate-600 font-medium mb-6">Need help with a specific order, account issue, or product question?</p>
                    <Link to="/contact" className="ds-button-primary px-8 py-3.5 text-xs font-black uppercase tracking-widest inline-flex">
                        Contact support
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
