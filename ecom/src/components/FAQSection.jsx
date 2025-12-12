import React, { useState } from 'react';

// Single FAQ Item Component
const FAQItem = ({ question, answer, isOpen, onClick }) => {
    return (
        <div
            className="bg-white rounded-2xl p-6 md:p-8 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md"
            onClick={onClick}
        >
            <div className="flex justify-between items-start gap-4">
                {/* Question Text */}
                <h3 className="text-lg md:text-xl font-bold text-black leading-tight select-none">
                    {question}
                </h3>

                {/* Toggle Icon */}
                <button className="mt-1 text-black transition-transform duration-300">
                    {isOpen ? (
                        // Close (X) Icon
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        // Open (+) Icon
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Answer Content (Collapsible) */}
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
                    }`}
            >
                <p className="text-gray-500 font-medium leading-relaxed">
                    {answer}
                </p>
            </div>
        </div>
    );
};

const FAQSection = () => {
    // State to track which items are open. 
    // You can use an array/object to allow multiple open, or a single ID for accordion style.
    // Here I allow independent toggling like the image suggests (some open, some closed).
    const [openItems, setOpenItems] = useState({
        0: true,  // First item open by default
        1: true,  // Second item open by default
    });

    const toggleItem = (index) => {
        setOpenItems(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const faqData = [
        // Column 1
        {
            question: "How long does it take to set up the chatbot?",
            answer: "Yes, each template has a live demo that you can explore to get a feel for its design and functionality."
        },
        {
            question: "Can the chatbot integrate with my existing tools?",
            answer: "Yes, you can use our templates for both personal and client projects. However, you cannot resell or redistribute the templates themselves."
        },
        {
            question: "Is the chatbot customizable for my brand?",
            answer: "Yes, all our templates are fully customizable. You can easily change colors, fonts, images, and layouts to match your brand."
        },
        {
            question: "How does the chatbot handle multilingual support?",
            answer: "Due to the digital nature of our products, we don't offer refunds. We encourage you to review the template details carefully before purchasing."
        },
        // Column 2
        {
            question: "What happens if the chatbot can’t answer a question?",
            answer: "Yes, each template has a live demo that you can explore to get a feel for its design and functionality."
        },
        {
            question: "Is there a limit to how many chats the chatbot can handle?",
            answer: "Yes, you can use our templates for both personal and client projects. However, you cannot resell or redistribute the templates themselves."
        },
        {
            question: "How secure is the chatbot?",
            answer: "Yes, all our templates are fully customizable. You can easily change colors, fonts, images, and layouts to match your brand."
        }
    ];

    // Split data into two columns for layout
    const col1 = faqData.slice(0, 4);
    const col2 = faqData.slice(4);

    return (
        <div className="w-full bg-[#F5F5F7] px-6 py-20 font-sans">
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/* Left Column */}
                <div className="flex flex-col gap-6">
                    {col1.map((item, index) => (
                        <FAQItem
                            key={index}
                            question={item.question}
                            answer={item.answer}
                            isOpen={openItems[index]}
                            onClick={() => toggleItem(index)}
                        />
                    ))}
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-6">
                    {col2.map((item, index) => {
                        const actualIndex = index + 4; // Offset index for the second column
                        return (
                            <FAQItem
                                key={actualIndex}
                                question={item.question}
                                answer={item.answer}
                                isOpen={openItems[actualIndex]}
                                onClick={() => toggleItem(actualIndex)}
                            />
                        );
                    })}
                </div>

            </div>
        </div>
    );
};

export default FAQSection;