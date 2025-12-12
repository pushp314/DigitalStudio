import React from 'react';
import { Link } from 'react-router-dom';

const BrowseTemplatesCTA = () => {
  return (
    <div className="w-full bg-[#F5F5F7] px-6 py-20 font-sans">

      {/* Main White Card Container */}
      <div className="max-w-[1400px] mx-auto bg-white rounded-[3rem] p-8 md:p-12 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 relative overflow-hidden shadow-sm">

        {/* 1. LEFT SIDE: Image Collage */}
        <div className="w-full lg:w-1/2 h-[500px] grid grid-cols-2 gap-4 z-10">

          {/* Column 1 (Stacked Images) */}
          <div className="flex flex-col gap-4 h-full">

            {/* Top Image: Portfolio/Music */}
            <div className="h-1/2 w-full rounded-2xl overflow-hidden relative group">
              <img
                src="https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=800"
                alt="Portfolio Template"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute top-4 left-4 text-white font-bold tracking-widest uppercase text-sm drop-shadow-md">William</div>
            </div>

            {/* Bottom Image: Purple UI Card */}
            <div className="h-1/2 w-full bg-[#5D5FEF] rounded-2xl overflow-hidden relative flex items-center justify-center group p-4">
              {/* Abstract UI Elements representing the image content */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#5D5FEF] to-[#8688FF]"></div>
              <div className="relative z-10 grid grid-cols-2 gap-2 w-full max-w-[150px]">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg h-16 w-full"></div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg h-16 w-full"></div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg h-16 w-full"></div>
                <div className="col-span-1 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-white/50 flex items-center justify-center text-white text-xs">+3</div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 text-white font-bold text-xl">Pro</div>
            </div>

          </div>

          {/* Column 2 (Tall Image: SaaS/Dark Mode) */}
          <div className="h-full w-full rounded-2xl overflow-hidden relative group">
            <img
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800"
              alt="SaaS Template"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Overlay to simulate the dark UI look in screenshot */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>

            {/* Mock Text Content Overlay */}
            <div className="absolute top-10 left-6 right-6 text-white">
              <div className="w-8 h-8 rounded-full bg-blue-500 mb-4"></div>
              <h3 className="text-xl font-bold leading-tight mb-2">Transform custom engagement</h3>
              <p className="text-xs text-gray-300">Seamlessly integrate advanced chatbot technology.</p>
            </div>
          </div>

        </div>


        {/* 2. RIGHT SIDE: Content */}
        <div className="w-full lg:w-1/2 flex flex-col items-start gap-8 relative z-10">

          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-[#0055FF] flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>

          {/* Text Content */}
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-black tracking-tight leading-[1.1] mb-4">
              Browse from our quality templates
            </h2>
            <p className="text-gray-500 text-lg md:text-xl font-medium">
              Unlock brilliance—build your website the smart way.
            </p>
          </div>

          {/* CTA Button */}
          <Link to="/templates" className="flex items-center gap-2 bg-[#0055FF] hover:bg-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-xl shadow-blue-500/20">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Browse Templates
          </Link>
        </div>


        {/* 3. DECORATION (Bottom Right Background Shapes) */}
        <div className="absolute -bottom-10 -right-10 z-0">
          {/* Outer lighter shape */}
          <div className="w-80 h-80 bg-gray-50 rounded-[3rem] transform rotate-3"></div>
          {/* Inner darker shape */}
          <div className="absolute top-10 left-10 w-64 h-64 bg-[#EBEBEB] rounded-[2.5rem] transform -rotate-6 opacity-50"></div>
        </div>

      </div>
    </div>
  );
};

export default BrowseTemplatesCTA;