import React, { useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfigContext from '../context/ConfigContext';

const FAQItem = ({ question, answer, isOpen, onClick }) => {
    return (
        <div
            className="bg-white rounded-3xl p-6 md:p-8 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl border border-gray-100 group"
            onClick={onClick}
        >
            <div className="flex justify-between items-start gap-4">
                <h3 className="text-lg md:text-xl font-black text-black leading-tight select-none group-hover:text-primary transition-colors">
                    {question}
                </h3>

                <button type="button" className={`mt-1 transition-all duration-500 ${isOpen ? 'rotate-45 text-primary' : 'text-gray-400'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}`}
            >
                <p className="text-gray-500 font-medium leading-relaxed border-t border-gray-50 pt-6">
                    {answer}
                </p>
            </div>
        </div>
    );
};

const FAQSection = () => {
    const { config } = useContext(ConfigContext);
    const faqData = useMemo(() => Array.isArray(config?.faqs) ? config.faqs : [], [config?.faqs]);
    const [openItems, setOpenItems] = useState({ 0: true });

    const toggleItem = (index) => {
        setOpenItems((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    if (!faqData.length) return null;

    const midpoint = Math.ceil(faqData.length / 2);
    const col1 = faqData.slice(0, midpoint);
    const col2 = faqData.slice(midpoint);

    return (
        <div className="w-full bg-[#F5F5F7] px-6 py-32 font-sans overflow-hidden">
            <div className="max-w-[1400px] mx-auto">
                <div className="text-center mb-20 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 blur-[100px] -z-10"></div>
                    <h2 className="text-4xl md:text-6xl font-black text-black mb-6 tracking-tight">Got Questions?</h2>
                    <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium">
                        Everything you need to know about our templates, licensing, and technical support in one place.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="flex flex-col gap-6">
                        {col1.map((item, index) => (
                            <FAQItem
                                key={`${item.question}-${index}`}
                                question={item.question}
                                answer={item.answer}
                                isOpen={openItems[index]}
                                onClick={() => toggleItem(index)}
                            />
                        ))}
                    </div>

                    <div className="flex flex-col gap-6">
                        {col2.map((item, index) => {
                            const actualIndex = index + midpoint;
                            return (
                                <FAQItem
                                    key={`${item.question}-${actualIndex}`}
                                    question={item.question}
                                    answer={item.answer}
                                    isOpen={openItems[actualIndex]}
                                    onClick={() => toggleItem(actualIndex)}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className="mt-24 text-center">
                    <div className="inline-block bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100">
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-4">Still have doubts?</p>
                        <Link to="/contact" className="inline-flex items-center gap-2 text-primary font-black hover:opacity-80 transition-all group text-xl">
                            Contact our support team
                            <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQSection;
