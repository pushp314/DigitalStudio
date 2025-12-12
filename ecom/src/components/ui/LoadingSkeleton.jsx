import React from 'react';

const LoadingSkeleton = ({ count = 6, type = 'product' }) => {
    if (type === 'product') {
        return (
            <div className="w-full bg-[#F5F5F7] px-6 pb-20 font-sans">
                <div className="max-w-[1400px] mx-auto flex flex-col gap-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(count)].map((_, index) => (
                            <ProductCardSkeleton key={index} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

const ProductCardSkeleton = () => {
    return (
        <div className="flex flex-col gap-4 cursor-pointer relative animate-pulse">
            {/* Image Skeleton */}
            <div className="w-full aspect-[4/3] rounded-2xl bg-gray-200/80 relative shadow-sm overflow-hidden">
                <div className="absolute inset-0 shimmer" />
            </div>

            {/* Info Card Skeleton */}
            <div className="w-full bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                {/* Title & Price */}
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <div className="h-6 bg-gray-200 rounded w-2/3 shimmer" />
                    <div className="h-6 bg-gray-200 rounded w-16 shimmer" />
                </div>

                {/* Bottom Row */}
                <div className="flex justify-between items-center mt-auto">
                    <div className="h-8 bg-gray-200 rounded-full w-28 shimmer" />
                    <div className="h-4 bg-gray-200 rounded w-24 shimmer" />
                </div>
            </div>
        </div>
    );
};

export const DetailSkeleton = () => {
    return (
        <div className="w-full bg-[#F5F5F7] px-6 py-20 min-h-[50vh] animate-pulse">
            <div className="max-w-[1400px] mx-auto flex flex-col gap-10 pt-10">
                {/* Title */}
                <div className="h-24 bg-gray-200 rounded w-3/4 shimmer" />

                {/* Subtitle */}
                <div className="h-8 bg-gray-200 rounded w-1/2 shimmer" />

                {/* Buttons */}
                <div className="flex gap-4">
                    <div className="h-14 bg-gray-200 rounded-full w-40 shimmer" />
                    <div className="h-14 bg-gray-200 rounded-full w-40 shimmer" />
                    <div className="h-14 bg-gray-200 rounded-full w-32 shimmer" />
                </div>
            </div>
        </div>
    );
};

export default LoadingSkeleton;
