import React from 'react';

const BuildSitesHeader = ({
  title = "Easily build sites with our",
  highlight = "templates",
  description = "No more website woes—just powerful solutions at your fingertips"
}) => {
  return (
    <div className="w-full bg-[#F5F5F7] px-6 py-20 font-sans">
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-10">

        {/* Left: Heading */}
        <h2 className="max-w-4xl text-5xl md:text-6xl lg:text-[4.5rem] font-black text-black tracking-tight leading-[0.95]">
          {title} <br className="hidden md:block" />
          <span className="text-[#0055FF]">{highlight}</span>
        </h2>

        {/* Right: Description */}
        <p className="max-w-xs text-gray-500 text-lg md:text-l font-medium leading-relaxed pb-2">
          {description}
        </p>

      </div>
    </div>
  );
};

export default BuildSitesHeader;