import React from 'react';

const TemplateDetails = ({
  description = "A premium template designed for excellence.",
  pages = [],
  features = [],
  techStack = [],
  productType = 'template',
  documentation = {},
  liveDemo = '',
  githubRepo = '',
  rating = 0,
  numReviews = 0
}) => {
  return (
    <div className="w-full bg-[#F5F5F7] px-6 py-20 font-sans border-b border-gray-200/50">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

        {/* ================= COLUMN 1: DESCRIPTION & LINKS (Wider) ================= */}
        <div className="lg:col-span-6 flex flex-col gap-10">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-black tracking-tight mb-8">
              Template description
            </h2>

            <div className="text-gray-500 text-lg leading-relaxed flex flex-col gap-6">
              <p>{description}</p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mt-4">
                {liveDemo && (
                  <a href={liveDemo} target="_blank" rel="noopener noreferrer" className="bg-[#0055FF] text-white px-8 py-3 rounded-full font-bold hover:bg-blue-600 transition-colors">
                    Live Preview
                  </a>
                )}
                {githubRepo && (
                  <a href={githubRepo} target="_blank" rel="noopener noreferrer" className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Technical Specs */}
          {techStack && techStack.length > 0 && (
            <div>
              <h3 className="text-2xl font-bold text-black mb-6">Tech Stack</h3>
              <div className="flex flex-wrap gap-3">
                {techStack.map((tech) => (
                  <span key={tech} className="bg-white px-4 py-2 rounded-xl text-sm font-bold border border-gray-100 shadow-sm text-gray-700">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>


        {/* ================= COLUMN 2: FEATURES & PAGES ================= */}
        <div className="lg:col-span-3 flex flex-col gap-10">
          {/* Features */}
          <div>
            <h2 className="text-2xl font-bold text-black mb-6">Features</h2>
            <ul className="flex flex-col gap-4 text-gray-500 font-medium">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 mt-1 flex items-center justify-center text-black shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Documentation Availability */}
          {(documentation?.setup || documentation?.deployment) && (
            <div>
              <h2 className="text-2xl font-bold text-black mb-6">Documentation</h2>
              <div className="flex flex-col gap-3">
                {documentation.setup && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Setup Guide Included
                  </div>
                )}
                {documentation.deployment && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Deployment Guide Included
                  </div>
                )}
              </div>
            </div>
          )}
        </div>


        {/* ================= COLUMN 3: PAGES & INFO ================= */}
        <div className="lg:col-span-3 flex flex-col gap-10">
          <div>
            <h2 className="text-2xl font-bold text-black mb-6">Pages ({pages.length})</h2>
            <ul className="flex flex-col gap-3 text-gray-500 font-medium">
              {pages.map((page) => (
                <li key={page} className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0"></span>
                  <span className="text-sm">{page}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Info */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-black mb-4">Product Info</h3>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium capitalize">{productType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rating</span>
                <span className="font-medium flex items-center gap-1">
                  ⭐ {rating} <span className="text-gray-400">({numReviews})</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">License</span>
                <span className="font-medium">Standard</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TemplateDetails;