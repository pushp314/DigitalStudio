import React from 'react';

const FeaturesGrid = () => {
  return (
    <div className="w-full bg-[#F5F5F7] px-6 py-20 font-sans">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-16">

        {/* 1. HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">

          {/* Left: Huge Title */}
          <h2 className="max-w-4xl text-5xl md:text-7xl font-black text-black tracking-tight leading-[0.95]">
            Fully <span className="text-[#0055FF]">responsive</span> and customizable
          </h2>

          {/* Right: Description Text */}
          <p className="max-w-xs text-gray-500 text-lg font-medium leading-relaxed pb-2">
            No more website woes—just powerful solutions at your fingertips
          </p>
        </div>

        {/* 2. CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* CARD 1: White Card (Bottom-Right Decoration) */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden h-[500px] group hover:shadow-xl transition-all duration-300">

            {/* Content */}
            <div className="relative z-10 flex flex-col items-start gap-6">
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-[#0055FF] flex items-center justify-center text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              </div>

              {/* Text */}
              <div>
                <h3 className="text-4xl font-bold text-black tracking-tight leading-tight mb-4">
                  Built with global standards
                </h3>
                <p className="text-gray-500 text-lg font-medium">
                  Unlock brilliance—build your website the smart way.
                </p>
              </div>

              {/* Button */}
              <button className="mt-4 flex items-center gap-2 bg-[#0055FF] hover:bg-blue-600 text-white px-6 py-3 rounded-full font-semibold transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                Browse Templates
              </button>
            </div>

            {/* Decoration Shape (Bottom Right) */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-gray-100 rounded-[3rem] transform rotate-12 opacity-80 z-0 group-hover:scale-105 transition-transform duration-500" />
          </div>


          {/* CARD 2: White Card (Top-Right Decoration) */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 flex flex-col relative overflow-hidden h-[500px] group hover:shadow-xl transition-all duration-300">

            {/* Decoration Shape (Top Right) */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-gray-100 rounded-[3rem] transform -rotate-12 opacity-80 z-0 group-hover:scale-105 transition-transform duration-500" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-start gap-6 mt-4">
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-[#0055FF] flex items-center justify-center text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              </div>

              {/* Text */}
              <div className="mt-10">
                <h3 className="text-4xl font-bold text-black tracking-tight leading-tight mb-4">
                  Scale up 2x faster
                </h3>
                <p className="text-gray-500 text-lg font-medium">
                  Unlock brilliance—build your website the smart way.
                </p>
              </div>
            </div>
          </div>


          {/* CARD 3: Blue Card (Checklist) */}
          <div className="bg-[#0055FF] rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden h-[500px] group hover:shadow-xl transition-all duration-300 shadow-lg shadow-blue-500/20">

            {/* Subtle Gradient Overlay */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            {/* Top Section */}
            <div className="relative z-10 flex flex-col items-start gap-6">
              {/* Icon (White) */}
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-[#0055FF]">
                {/* Framer 'F' Logo */}
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
                  <path d="M4 0h16v8h-8zM4 8h8l8 8h-16zM4 16h8v8z" />
                </svg>
              </div>

              {/* Text */}
              <div className="mt-4">
                <h3 className="text-4xl font-bold text-white tracking-tight leading-tight mb-4">
                  Never leave Framer
                </h3>
                <p className="text-blue-100 text-lg font-medium">
                  Unlock brilliance — build
                </p>
              </div>
            </div>

            {/* Bottom Section: Checklist */}
            <div className="relative z-10 flex flex-col gap-4 mt-8">

              {/* Item 1: Checked */}
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#0055FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white font-medium text-lg">Pick a template</span>
              </div>

              {/* Item 2: Empty */}
              <div className="flex items-center gap-3 opacity-60">
                <div className="w-6 h-6 rounded-full border-2 border-white/50"></div>
                <span className="text-white font-medium text-lg">Customize it</span>
              </div>

              {/* Item 3: Empty */}
              <div className="flex items-center gap-3 opacity-60">
                <div className="w-6 h-6 rounded-full border-2 border-white/50"></div>
                <span className="text-white font-medium text-lg">Launch</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FeaturesGrid;