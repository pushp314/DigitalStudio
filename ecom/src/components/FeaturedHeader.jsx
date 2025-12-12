import React from 'react';

const FeaturedHeader = () => {
    // Dummy data for avatars (using grayscale to match image)
    const avatars = [
        "https://i.pravatar.cc/150?u=a042581f4e29026024d",
        "https://i.pravatar.cc/150?u=a042581f4e29026704d",
        "https://i.pravatar.cc/150?u=a04258114e29026302d",
        "https://i.pravatar.cc/150?u=a042581f4e29026704f",
        "https://i.pravatar.cc/150?u=a042581f4e29026703d",
    ];

    return (
        <div className="w-full bg-[#F5F5F7] px-6 py-12 md:py-20 pl-6 font-sans">
            <div className="max-w-[1400px] mx-auto flex flex-col items-start gap-6">

                {/* 1. Main Heading */}
                <h2 className="text-5xl md:text-6xl lg:text-[4.5rem] font-black text-black tracking-tight leading-[1.1]">
                    Featured Framer templates
                </h2>

                {/* 2. Social Proof Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-2">

                    {/* Avatar Stack */}
                    <div className="flex items-center pl-3">
                        {avatars.map((src, index) => (
                            <div
                                key={index}
                                className="relative w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-[#F5F5F7] -ml-3 overflow-hidden shrink-0 first:ml-0 z-0 hover:z-10 hover:scale-110 transition-transform duration-200"
                            >
                                <img
                                    src={src}
                                    alt={`User ${index}`}
                                    className="w-full h-full object-cover grayscale"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Ratings & Text Info */}
                    <div className="flex flex-col gap-0.5">

                        {/* Top Line: Score + Stars */}
                        <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-700">4.9/5</span>

                            {/* 5 Stars */}
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <svg
                                        key={i}
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="w-5 h-5 text-[#0055FF]" // Using the same Electric Blue as other components
                                    >
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Line: Loved by text */}
                        <p className="text-gray-500 font-medium text-base">
                            Loved by 1000+ creators
                        </p>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default FeaturedHeader;