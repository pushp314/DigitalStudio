import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const CarouselStack = ({ items = [] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const navigate = useNavigate();

    // Auto-rotation logic
    useEffect(() => {
        if (items.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [items.length]);

    if (!items || items.length === 0) return null;

    const handleNext = () => setCurrentIndex((prev) => (prev + 1) % items.length);
    const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

    return (
        <div className="relative w-full max-w-[1400px] mx-auto px-6 py-12 md:py-20 group">
            <style>
                {`
                .carousel-stack-container {
                    perspective: 2000px;
                }
                .carousel-item-stack {
                    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                    transform-style: preserve-3d;
                }
                `}
            </style>

            <div className="carousel-stack-container relative h-[400px] md:h-[500px] w-full">
                {items.map((item, idx) => {
                    // Logic for stack positioning
                    const diff = (idx - currentIndex + items.length) % items.length;
                    const isActive = diff === 0;
                    const isNext = diff === 1;
                    const isPrev = diff === items.length - 1;
                    
                    // Determine visibility and transform
                    let opacity = 0;
                    let zIndex = 0;
                    let transform = 'translateX(100%) scale(0.8) rotateY(-30deg)';

                    if (isActive) {
                        opacity = 1;
                        zIndex = 30;
                        transform = 'translateX(0) scale(1) rotateY(0deg)';
                    } else if (isNext) {
                        opacity = 0.4;
                        zIndex = 20;
                        transform = 'translateX(15%) scale(0.9) translateZ(-100px) rotateY(-10deg)';
                    } else if (isPrev) {
                        opacity = 0.2;
                        zIndex = 10;
                        transform = 'translateX(-10%) scale(0.85) translateZ(-200px) rotateY(5deg)';
                    } else if (diff === 2 && items.length > 3) {
                        opacity = 0.1;
                        zIndex = 5;
                        transform = 'translateX(25%) scale(0.8) translateZ(-300px) rotateY(-15deg)';
                    }

                    return (
                        <div
                            key={idx}
                            className={`carousel-item-stack absolute inset-0 flex items-center justify-center pointer-events-none`}
                            style={{
                                opacity,
                                zIndex,
                                transform,
                            }}
                        >
                            <div className="relative w-full h-full max-w-[1000px] bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/10 border border-slate-100 flex flex-col md:flex-row pointer-events-auto group/item">
                                {/* Visual Section */}
                                <div className="w-full md:w-3/5 h-1/2 md:h-full bg-slate-50 relative overflow-hidden">
                                     <img 
                                        src={item.image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000'} 
                                        alt={item.title} 
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover/item:scale-110" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>

                                {/* Content Section */}
                                <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col justify-center gap-6 bg-white">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.3em]">Featured Document</p>
                                        <h3 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight tracking-tight">
                                            {item.title || 'Untitled Knowledge Asset'}
                                        </h3>
                                    </div>
                                    
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                        Explore our technical guides, integration best practices, and production-ready implementation manuals.
                                    </p>

                                    <div className="pt-4">
                                        <button 
                                            onClick={() => {
                                                if (item.link) {
                                                    if (item.link.startsWith('http')) {
                                                        window.open(item.link, '_blank');
                                                    } else {
                                                        navigate(item.link);
                                                    }
                                                }
                                            }}
                                            className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95"
                                        >
                                            View Documentation
                                            <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Navigation Controls */}
            <div className="absolute bottom-4 right-10 flex gap-4 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <button 
                    onClick={handlePrev} 
                    className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm"
                >
                    <ChevronLeft size={20} />
                </button>
                <button 
                    onClick={handleNext} 
                    className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 mt-10">
                {items.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-8 bg-slate-900' : 'w-2 bg-slate-200'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default CarouselStack;
