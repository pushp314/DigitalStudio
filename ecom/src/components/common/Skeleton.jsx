import React from 'react';

const Skeleton = ({ className = '', variant = 'rect' }) => {
    const baseClass = "animate-pulse bg-slate-200/60";
    
    const variants = {
        rect: "rounded-lg",
        circle: "rounded-full",
        text: "rounded h-4 w-full",
        pill: "rounded-full h-6 w-20"
    };

    return (
        <div className={`${baseClass} ${variants[variant] || variants.rect} ${className}`} />
    );
};

export const TemplateSkeleton = () => (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full">
        <Skeleton className="aspect-video w-full" />
        <div className="p-6 space-y-4 flex-1">
            <div className="flex justify-between items-start">
                <Skeleton variant="text" className="w-2/3 h-5" />
                <Skeleton variant="pill" className="w-12" />
            </div>
            <Skeleton variant="text" className="w-full" />
            <Skeleton variant="text" className="w-4/5" />
            
            <div className="pt-4 flex items-center justify-between">
                <Skeleton variant="text" className="w-16 h-6" />
                <Skeleton variant="circle" className="w-10 h-10" />
            </div>
        </div>
    </div>
);

export const ProductDetailSkeleton = () => (
    <div className="space-y-12 animate-pulse">
        {/* Hero Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-3xl" />
            <div className="space-y-6">
                <Skeleton variant="pill" />
                <Skeleton variant="text" className="h-10 w-3/4" />
                <Skeleton variant="text" className="h-4 w-full" />
                <Skeleton variant="text" className="h-4 w-full" />
                <Skeleton variant="text" className="h-4 w-2/3" />
                
                <div className="pt-8 flex gap-4">
                    <Skeleton className="h-14 flex-1 rounded-2xl" />
                    <Skeleton className="h-14 w-14 rounded-2xl" />
                </div>
            </div>
        </div>
        
        {/* Content Tabs Skeleton */}
        <div className="space-y-8">
            <div className="flex gap-4 border-b border-slate-100 pb-4">
                <Skeleton variant="pill" className="w-24" />
                <Skeleton variant="pill" className="w-24" />
                <Skeleton variant="pill" className="w-24" />
            </div>
            <div className="space-y-4">
                <Skeleton variant="text" className="h-4 w-full" />
                <Skeleton variant="text" className="h-4 w-full" />
                <Skeleton variant="text" className="h-4 w-3/4" />
            </div>
        </div>
    </div>
);

export default Skeleton;
