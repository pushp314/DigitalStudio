import React, { useRef } from 'react';

const TemplateCarousel = () => {
  const scrollContainerRef = useRef(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -600, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 600, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-[#F5F5F7] py-20 font-sans border-b border-gray-200/50 overflow-hidden">

      {/* Header / Controls */}
      <div className="max-w-[1400px] mx-auto px-6 mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-black tracking-tight mb-2">
            Preview Layouts
          </h2>
          <p className="text-gray-500 font-medium">Explore the versatile pages included</p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            onClick={scrollLeft}
            className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={scrollRight}
            className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* CAROUSEL TRACK */}
      {/* snap-x mandatory: Enforces smooth snapping to each card */}
      <div
        ref={scrollContainerRef}
        className="flex gap-8 overflow-x-auto px-6 pb-12 snap-x snap-mandatory hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >

        {/* ================= CARD 1: HERO LAYOUT ================= */}
        <div className="min-w-[85vw] md:min-w-[900px] h-[550px] bg-gradient-to-b from-[#E0E7FF] to-[#F3F4F6] rounded-[2.5rem] p-6 md:p-10 flex gap-6 shadow-xl snap-center shrink-0">

          {/* Desktop Preview */}
          <div className="flex-1 bg-[#050505] rounded-3xl overflow-hidden relative shadow-2xl flex flex-col">
            {/* Nav Bar */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                <span className="text-white font-bold text-sm">Chatbot</span>
              </div>
              <div className="flex gap-4 text-xs text-gray-400">
                <span>Products</span><span>Pages</span><span>Contact</span>
              </div>
              <div className="w-20 h-6 bg-blue-600 rounded-full"></div>
            </div>
            {/* Hero Content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/30 blur-[80px] rounded-full"></div>

              <div className="relative z-10">
                <h3 className="text-white text-4xl md:text-5xl font-bold tracking-tight mb-4">
                  Ready to transform your <br /> engagement?
                </h3>
                <p className="text-gray-400 max-w-md mx-auto mb-8 text-sm">
                  Start your journey with a chatbot that adapts to your needs and delights your customers.
                </p>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                  Get Started →
                </button>
              </div>

              {/* 3D Shapes Simulation */}
              <div className="mt-10 flex gap-4 opacity-80">
                <div className="w-16 h-16 rounded-full border-4 border-blue-500/50"></div>
                <div className="w-16 h-16 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600"></div>
              </div>
            </div>
          </div>

          {/* Mobile Preview */}
          <div className="w-[200px] md:w-[240px] bg-[#050505] rounded-[2rem] overflow-hidden relative shadow-2xl hidden sm:flex flex-col border-[6px] border-[#1A1A1A]">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#1A1A1A] rounded-b-xl z-20"></div>

            {/* Mobile Content */}
            <div className="pt-10 px-4 flex flex-col items-center text-center h-full">
              <div className="w-8 h-8 rounded-full bg-blue-600 mb-6"></div>
              <h3 className="text-white text-xl font-bold leading-tight mb-4">
                Ready to transform?
              </h3>
              <div className="w-full h-24 bg-gradient-to-b from-blue-900/20 to-transparent rounded-xl mb-4 border border-white/5"></div>
              <button className="w-full bg-blue-600 text-white py-2 rounded-full text-xs font-bold mt-auto mb-8">
                Get Started
              </button>
            </div>
          </div>
        </div>


        {/* ================= CARD 2: FEATURES LAYOUT ================= */}
        <div className="min-w-[85vw] md:min-w-[900px] h-[550px] bg-gradient-to-b from-[#E0E7FF] to-[#F3F4F6] rounded-[2.5rem] p-6 md:p-10 flex gap-6 shadow-xl snap-center shrink-0">

          {/* Desktop Preview */}
          <div className="flex-1 bg-[#050505] rounded-3xl overflow-hidden relative shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-8 pb-0 text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full mb-4">
                <div className="w-4 h-4 rounded-full bg-orange-400"></div>
                <span className="text-white text-[10px]">Trusted by 1k+</span>
              </div>
              <h3 className="text-white text-4xl font-bold tracking-tight mb-4">
                Transform customer <br /> engagement
              </h3>
            </div>

            {/* Feature Grid UI */}
            <div className="flex-1 p-6 grid grid-cols-3 gap-3 mt-4">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20"></div>
                <div className="h-2 w-16 bg-white/20 rounded"></div>
              </div>
              <div className="col-span-2 bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl border border-white/10 p-4 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-blue-200 text-xs font-mono">AI Analysis Active...</span>
                </div>
              </div>
              <div className="col-span-3 h-20 bg-white/5 rounded-xl border border-white/5 flex items-center justify-around px-8 opacity-50">
                {/* Logos */}
                <div className="w-16 h-3 bg-white/30 rounded"></div>
                <div className="w-16 h-3 bg-white/30 rounded"></div>
                <div className="w-16 h-3 bg-white/30 rounded"></div>
                <div className="w-16 h-3 bg-white/30 rounded"></div>
              </div>
            </div>
          </div>

          {/* Mobile Preview */}
          <div className="w-[200px] md:w-[240px] bg-[#050505] rounded-[2rem] overflow-hidden relative shadow-2xl hidden sm:flex flex-col border-[6px] border-[#1A1A1A]">
            <div className="pt-10 px-4 flex flex-col h-full overflow-hidden">
              <div className="text-white text-lg font-bold mb-4 text-center">Features</div>
              <div className="flex-1 flex flex-col gap-3">
                <div className="h-24 bg-white/5 rounded-xl border border-white/5 p-3">
                  <div className="w-6 h-6 rounded bg-blue-500 mb-2"></div>
                  <div className="h-2 w-12 bg-white/20 rounded"></div>
                </div>
                <div className="h-24 bg-white/5 rounded-xl border border-white/5 p-3">
                  <div className="w-6 h-6 rounded bg-purple-500 mb-2"></div>
                  <div className="h-2 w-12 bg-white/20 rounded"></div>
                </div>
                <div className="h-24 bg-white/5 rounded-xl border border-white/5 p-3">
                  <div className="w-6 h-6 rounded bg-green-500 mb-2"></div>
                  <div className="h-2 w-12 bg-white/20 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* ================= CARD 3: PRICING LAYOUT ================= */}
        <div className="min-w-[85vw] md:min-w-[900px] h-[550px] bg-gradient-to-b from-[#E0E7FF] to-[#F3F4F6] rounded-[2.5rem] p-6 md:p-10 flex gap-6 shadow-xl snap-center shrink-0">

          {/* Desktop Preview */}
          <div className="flex-1 bg-[#050505] rounded-3xl overflow-hidden relative shadow-2xl flex flex-col">
            <div className="p-8 pb-4 text-center">
              <h3 className="text-white text-3xl font-bold mb-2">Choose your plan</h3>
              <p className="text-gray-400 text-xs">Simple pricing for everyone</p>
            </div>

            {/* Pricing Cards */}
            <div className="flex-1 flex items-center justify-center gap-4 px-6 pb-6">
              {/* Basic */}
              <div className="w-1/3 h-64 border border-white/10 rounded-xl p-4 flex flex-col">
                <span className="text-gray-400 text-xs mb-2">Basic</span>
                <span className="text-white text-2xl font-bold mb-4">$15</span>
                <div className="space-y-2 mb-auto">
                  <div className="h-1.5 w-full bg-white/10 rounded"></div>
                  <div className="h-1.5 w-2/3 bg-white/10 rounded"></div>
                </div>
                <div className="h-8 bg-white/10 rounded-lg"></div>
              </div>
              {/* Pro (Highlighted) */}
              <div className="w-1/3 h-72 bg-white/10 border border-blue-500 rounded-xl p-4 flex flex-col relative -top-2">
                <span className="text-blue-400 text-xs font-bold mb-2">Most Popular</span>
                <span className="text-white text-3xl font-bold mb-4">$85</span>
                <div className="space-y-2 mb-auto">
                  <div className="h-1.5 w-full bg-white/20 rounded"></div>
                  <div className="h-1.5 w-full bg-white/20 rounded"></div>
                  <div className="h-1.5 w-3/4 bg-white/20 rounded"></div>
                </div>
                <div className="h-10 bg-blue-600 rounded-lg"></div>
              </div>
              {/* Enterprise */}
              <div className="w-1/3 h-64 border border-white/10 rounded-xl p-4 flex flex-col">
                <span className="text-gray-400 text-xs mb-2">Enterprise</span>
                <span className="text-white text-2xl font-bold mb-4">$125</span>
                <div className="space-y-2 mb-auto">
                  <div className="h-1.5 w-full bg-white/10 rounded"></div>
                  <div className="h-1.5 w-2/3 bg-white/10 rounded"></div>
                </div>
                <div className="h-8 bg-white/10 rounded-lg"></div>
              </div>
            </div>
          </div>

          {/* Mobile Preview */}
          <div className="w-[200px] md:w-[240px] bg-[#050505] rounded-[2rem] overflow-hidden relative shadow-2xl hidden sm:flex flex-col border-[6px] border-[#1A1A1A]">
            <div className="pt-8 px-4 flex flex-col h-full overflow-hidden">
              <div className="text-center mb-4">
                <div className="text-white font-bold text-lg">Plans</div>
              </div>
              {/* Mobile Pricing Stack */}
              <div className="flex flex-col gap-3">
                <div className="bg-white/10 border border-blue-500 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-bold">$85</span>
                    <span className="text-[10px] text-blue-300 bg-blue-900/30 px-1 rounded">PRO</span>
                  </div>
                  <div className="h-1 w-full bg-white/20 rounded mb-1"></div>
                  <div className="h-1 w-2/3 bg-white/20 rounded"></div>
                </div>
                <div className="border border-white/10 rounded-lg p-3">
                  <span className="text-white font-bold block mb-2">$15</span>
                  <div className="h-1 w-full bg-white/10 rounded"></div>
                </div>
                <div className="border border-white/10 rounded-lg p-3">
                  <span className="text-white font-bold block mb-2">$125</span>
                  <div className="h-1 w-full bg-white/10 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default TemplateCarousel;