import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="w-full bg-[#1A1A1A] text-white px-6 py-20 font-sans">
            <div className="max-w-[1400px] mx-auto flex flex-col gap-16">

                {/* 1. TOP CTA SECTION */}
                <div className="flex flex-col gap-8">
                    <h2 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight leading-[0.95]">
                        Customize and build a <br className="hidden lg:block" />
                        stunning website today.
                    </h2>

                    {/* Features List */}
                    <div className="flex flex-wrap gap-6 md:gap-8">
                        {['Instant access', 'Responsive design', 'No coding required'].map((item) => (
                            <div key={item} className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-[#0055FF] flex items-center justify-center shrink-0">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-lg font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Separator Line */}
                <div className="w-full h-px border-t border-dashed border-white/20" />

                {/* 2. MIDDLE SECTION: Contact & Newsletter */}
                <div className="flex flex-col lg:flex-row justify-between gap-16 lg:gap-0">

                    {/* Left: Logo & Email */}
                    <div className="flex flex-col gap-10 lg:w-1/3">

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#0055FF] flex items-center justify-center">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" fill="none" />
                                    <rect x="2" y="11" width="20" height="2" fill="white" />
                                    <path d="M12 12V22" stroke="white" strokeWidth="2" />
                                </svg>
                            </div>
                            <span className="text-white font-bold text-xl tracking-tight">
                                FlowGrid
                            </span>
                        </Link>

                        {/* Email Contact */}
                        <div>
                            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-2">DROP US A LINE</p>
                            <a href="mailto:hello@flowgrid.com" className="text-2xl md:text-3xl font-medium hover:text-[#0055FF] transition-colors">
                                hello@flowgrid.com
                            </a>
                        </div>
                    </div>

                    {/* Right: Newsletter Form */}
                    <div className="flex flex-col gap-6 lg:w-1/2">
                        <h3 className="text-3xl font-bold tracking-tight">
                            Sign up for our newsletter:
                        </h3>

                        {/* Benefits */}
                        <ul className="flex flex-col gap-2">
                            <li className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#0055FF]"></div>
                                <span className="text-gray-300 font-medium">Be the first to access new template releases</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#0055FF]"></div>
                                <span className="text-gray-300 font-medium">Unlock special discounts</span>
                            </li>
                        </ul>

                        {/* Input Field */}
                        <form className="flex flex-col sm:flex-row gap-4 mt-2">
                            <input
                                type="email"
                                placeholder="Type your email"
                                className="w-full bg-white/10 border border-transparent rounded-full px-6 py-4 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#0055FF] transition-all"
                            />
                            <button className="bg-[#1C4ED8] hover:bg-[#0055FF] text-white font-semibold px-8 py-4 rounded-full transition-colors whitespace-nowrap">
                                Submit
                            </button>
                        </form>
                    </div>

                </div>

                {/* Separator Line */}
                <div className="w-full h-px border-t border-dashed border-white/20" />

                {/* 3. BOTTOM SECTION: Socials & Links */}
                <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-8">

                    {/* Social Icons */}
                    <div className="flex gap-4">
                        {/* Twitter/X Icon */}
                        <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#0055FF] transition-colors">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        </a>
                        {/* Dribbble/Other Icon */}
                        <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#0055FF] transition-colors">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                        </a>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm font-medium text-white/90">
                        {['Changelog', '404', 'LinkedIn', 'Instagram', 'Twitter X', 'Dribbble'].map((link) => (
                            <a key={link} href="#" className="hover:text-[#0055FF] transition-colors">
                                {link}
                            </a>
                        ))}
                    </nav>

                </div>

            </div>
        </footer>
    );
};

export default Footer;