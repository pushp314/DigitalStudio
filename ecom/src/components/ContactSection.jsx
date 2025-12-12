import React from 'react';

const ContactSection = () => {
  return (
    <div className="w-full bg-[#F5F5F7] px-6 py-20 font-sans">

      {/* Main White Card Container */}
      <div className="max-w-[1400px] mx-auto bg-white rounded-[3rem] p-8 md:p-16 flex flex-col lg:flex-row gap-16 lg:gap-24 shadow-sm">

        {/* LEFT COLUMN: Contact Info */}
        <div className="w-full lg:w-1/2 flex flex-col gap-10">

          {/* Header Text */}
          <div>
            <h2 className="text-5xl md:text-7xl font-black text-black tracking-tight mb-6">
              Contact us
            </h2>
            <p className="text-gray-500 text-lg font-medium">
              Send us a message we love to hear from you
            </p>
          </div>

          {/* Contact Info Cards */}
          <div className="flex flex-col gap-4">

            {/* Email Card */}
            <div className="bg-[#F9FAFB] rounded-2xl p-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0055FF] flex items-center justify-center text-white shrink-0">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </div>
                <span className="font-bold text-black">Email</span>
              </div>
              <p className="text-gray-600 pl-9 font-medium">hello@flowgrid.com</p>
            </div>

            {/* Address Card */}
            <div className="bg-[#F9FAFB] rounded-2xl p-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0055FF] flex items-center justify-center text-white shrink-0">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <span className="font-bold text-black">Address</span>
              </div>
              <p className="text-gray-600 pl-9 font-medium">3891 Richardson, California</p>
            </div>

            {/* Phone Card */}
            <div className="bg-[#F9FAFB] rounded-2xl p-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0055FF] flex items-center justify-center text-white shrink-0">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                </div>
                <span className="font-bold text-black">Phone</span>
              </div>
              <p className="text-gray-600 pl-9 font-medium">(239) 555-0108</p>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Form Card */}
        <div className="w-full lg:w-1/2">
          <div className="border border-gray-100 rounded-[2.5rem] p-8 md:p-10 h-full flex flex-col justify-between">

            <h3 className="text-3xl md:text-4xl font-bold text-black tracking-tight mb-8">
              Fill out the form
            </h3>

            <form className="flex flex-col gap-6">

              {/* Full Name */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-900 font-medium">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-700 placeholder-gray-400"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-900 font-medium">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-700 placeholder-gray-400"
                />
              </div>

              {/* Company */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-900 font-medium">Company</label>
                <input
                  type="text"
                  placeholder="Company (optional)"
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-700 placeholder-gray-400"
                />
              </div>

              {/* Message */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-900 font-medium">Message</label>
                <textarea
                  placeholder="Type your message here..."
                  rows="4"
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-700 placeholder-gray-400 resize-none"
                ></textarea>
              </div>

              {/* Submit Button */}
              {/* Using a softer blue (#86A1FF) as seen in the screenshot */}
              <button
                type="button"
                className="mt-4 w-full bg-[#86A1FF] hover:bg-blue-500 text-white font-semibold text-lg py-4 rounded-full transition-colors duration-300"
              >
                Submit
              </button>

            </form>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ContactSection;