import React, { useContext } from 'react';
import ConfigContext from '../context/ConfigContext';

const FeaturedHeader = () => {
    const { config } = useContext(ConfigContext);
    const socialProof = config?.socialProof ?? {};
    const avatars = socialProof.avatarImages ?? [];

    return (
        <div className="w-full bg-[#F5F5F7] px-6 py-12 md:py-20 pl-6 font-sans">
            <div className="max-w-[1400px] mx-auto flex flex-col items-start gap-6">
                <h2 className="text-5xl md:text-6xl lg:text-[4.5rem] font-black text-black tracking-tight leading-[1.1]">
                    Featured marketplace products
                </h2>

                {(avatars.length > 0 || socialProof.rating || socialProof.creatorsLabel) && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-2">
                        {avatars.length > 0 && (
                            <div className="flex items-center pl-3">
                                {avatars.map((src, index) => (
                                    <div
                                        key={index}
                                        className="relative w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-[#F5F5F7] -ml-3 overflow-hidden shrink-0 first:ml-0 z-0 hover:z-10 hover:scale-110 transition-transform duration-200"
                                    >
                                        <img
                                            src={src}
                                            alt={`Customer ${index + 1}`}
                                            className="w-full h-full object-cover grayscale"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                                {socialProof.rating && <span className="text-lg font-bold text-gray-700">{socialProof.rating}</span>}
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <svg
                                            key={i}
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            className="w-5 h-5 text-primary"
                                        >
                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                        </svg>
                                    ))}
                                </div>
                            </div>

                            <p className="text-gray-500 font-medium text-base">
                                {socialProof.creatorsLabel || socialProof.summary}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeaturedHeader;
