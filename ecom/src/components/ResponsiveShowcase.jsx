import React from 'react';

const ResponsiveShowcase = () => {
  // Shared data for the "William Thompson" mock website
  const portfolioData = {
    image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=800", // Guy with guitar vibe
    name: "WILLIAM THOMPSON",
    bio: "Hi, I'm William Thompson, a professional photographer passionate about storytelling through the lens.",
    heading: "MY GOAL IS TO MAKE EACH SESSION A RELAXED AND CREATIVE EXPERIENCE THAT RESULTS IN STUNNING, MEANINGFUL IMAGES."
  };

  return (
    <div className="w-full bg-[#F5F5F7] px-6 py-20 font-sans">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ================= COLUMN 1: DESKTOP ================= */}
        <div className="flex flex-col gap-4 group cursor-pointer perspective-1000">

          {/* Preview Card */}
          <div className="w-full aspect-[4/3.5] bg-white rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-500 ease-out group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] group-hover:-translate-y-2 relative border border-gray-100/50">

            {/* Mock Website Container (Desktop Layout) */}
            <div className="w-full h-full flex flex-col">

              {/* Hero Section */}
              <div className="h-[55%] relative overflow-hidden">
                <img src={portfolioData.image} alt="Desktop View" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:bg-black/20"></div>

                {/* Desktop Typography Overlay */}
                <div className="absolute bottom-6 left-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2 w-1/2 drop-shadow-md">
                    {portfolioData.name}
                  </h2>
                </div>

                <div className="absolute bottom-6 right-6 text-white max-w-[200px] text-[10px] leading-tight text-right opacity-90">
                  {portfolioData.bio}
                  <div className="mt-2 text-[10px] font-bold underline decoration-1 underline-offset-2 hover:text-blue-200 transition-colors">CONTACT ME ↗</div>
                </div>
              </div>

              {/* Content Section */}
              <div className="h-[45%] bg-[#F0F0F0] p-6 flex gap-4">
                <div className="w-2/3">
                  <h3 className="text-xl font-black text-black uppercase leading-none tracking-tight">
                    {portfolioData.heading}
                  </h3>
                  <div className="mt-4 w-32 h-20 bg-gray-300 rounded overflow-hidden shadow-inner">
                    <img src="https://images.unsplash.com/photo-1554048612-387768052bf7?auto=format&fit=crop&q=80&w=300" className="w-full h-full object-cover grayscale opacity-80" alt="Work" />
                  </div>
                </div>
                <div className="w-1/3 text-[8px] text-gray-500 leading-relaxed">
                  <span className="text-[#0055FF] font-bold block mb-1">INTRO</span>
                  Photography has been my calling since I first picked up a camera. Based in Philadelphia, I specialize in capturing authentic moments.
                </div>
              </div>

            </div>
          </div>

          {/* Label Card */}
          <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm group-hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-[#0055FF] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v2h12v-2l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z" /></svg>
            </div>
            <span className="text-lg font-bold text-black">Desktop</span>
          </div>
        </div>


        {/* ================= COLUMN 2: TABLET ================= */}
        <div className="flex flex-col gap-4 group cursor-pointer">

          {/* Preview Card */}
          <div className="w-full aspect-[4/3.5] bg-white rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-500 ease-out group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] group-hover:-translate-y-2 relative border border-gray-100/50">

            {/* Mock Website Container (Tablet Layout) */}
            <div className="w-full h-full flex flex-col">

              {/* Hero Section */}
              <div className="h-[65%] relative overflow-hidden">
                <img src={portfolioData.image} alt="Tablet View" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/30"></div>

                {/* Tablet Typography: Centered & Stacked */}
                <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 pt-10 group-hover:pt-0 transition-all duration-500">
                  <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-4 drop-shadow-lg">
                    William<br />Thompson
                  </h2>
                  <p className="text-white text-xs max-w-[250px] font-medium opacity-0 group-hover:opacity-90 transition-opacity duration-300 mb-4 transform translate-y-4 group-hover:translate-y-0">
                    {portfolioData.bio}
                  </p>
                  <button className="border border-white text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-wide hover:bg-white hover:text-black transition-colors opacity-0 group-hover:opacity-100">
                    Contact Me ↗
                  </button>
                </div>
              </div>

              {/* Content Section */}
              <div className="h-[35%] bg-[#F0F0F0] p-6 overflow-hidden">
                <h3 className="text-lg font-black text-black uppercase leading-tight tracking-tight text-center">
                  {portfolioData.heading}
                </h3>
                {/* Cutoff text simulation */}
                <div className="mt-2 text-center text-xs text-gray-500 font-bold opacity-50">SCROLL FOR MORE</div>
              </div>
            </div>
          </div>

          {/* Label Card */}
          <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm group-hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-[#0055FF] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 0H6C4.34 0 3 1.34 3 3v18c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V3c0-1.66-1.34-3-3-3zm-6 22c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm7-6H5V4h14v12z" /></svg>
            </div>
            <span className="text-lg font-bold text-black">Tablet</span>
          </div>
        </div>


        {/* ================= COLUMN 3: MOBILE ================= */}
        <div className="flex flex-col gap-4 group cursor-pointer">

          {/* Preview Card */}
          <div className="w-full aspect-[4/3.5] bg-white rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-all duration-500 ease-out group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] group-hover:-translate-y-2 relative border border-gray-100/50">

            {/* Mock Website Container (Mobile Layout) */}
            <div className="w-full h-full flex flex-col">

              {/* Hero Section */}
              <div className="h-[75%] relative overflow-hidden">
                <img src={portfolioData.image} alt="Mobile View" className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40"></div>

                {/* Mobile Typography: Huge & Edgy */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h2 className="text-6xl font-black uppercase tracking-tighter leading-[0.85] mb-4 mix-blend-overlay opacity-90 transition-transform duration-500 group-hover:-translate-y-2">
                    Will<br />iam
                  </h2>
                  <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-4 absolute top-10 left-4 text-transparent stroke-white border-white transition-all duration-500 group-hover:left-6" style={{ WebkitTextStroke: "1px white" }}>
                    Thomp<br />son
                  </h2>

                  <p className="text-[10px] leading-tight opacity-80 mb-4 mt-20 group-hover:opacity-100 transition-opacity">
                    Hi, I'm William Thompson...
                  </p>
                </div>
              </div>

              {/* Content Section */}
              <div className="h-[25%] bg-[#1a1a1a] p-4 flex items-center justify-center">
                <p className="text-white/60 text-[10px] text-center uppercase tracking-widest group-hover:text-white transition-colors">
                  © 2024 Portfolio
                </p>
              </div>
            </div>
          </div>

          {/* Label Card */}
          <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm group-hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-[#0055FF] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" /></svg>
            </div>
            <span className="text-lg font-bold text-black">Mobile</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResponsiveShowcase;