import React from 'react';

const TestimonialsGrid = () => {
  const testimonials = [
    {
      id: 1,
      name: "Jake Thompson",
      handle: "@jakethompsonux",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
      text: "Framerstore made launching my first Framer template effortless! The layout is sleek, the CMS is intuitive, and I had my store up in minutes. Highly recommend!",
      template: "Haven Estate",
      date: "Feb 16, 2025"
    },
    {
      id: 2,
      name: "Emily Carter",
      handle: "@emilycdesigns",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
      text: "I've used several Framer templates before, but this one is a game-changer. Everything is optimized for selling templates effortlessly!",
      template: "Educore",
      date: "Feb 16, 2025"
    },
    {
      id: 3,
      name: "Ryan Mitchell",
      handle: "@ryanmitchellux",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=200",
      text: "Framerstore is hands down the best way to launch a Framer template store. The UI is clean, and the CMS is perfectly structured. 10/10!",
      template: "Bento Portfolio",
      date: "Feb 16, 2025"
    },
    {
      id: 4,
      name: "Sophia Williams",
      handle: "@sophiawdesigns",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200",
      text: "The perfect balance of aesthetics and functionality! I had my store live in under an hour, and it looks stunning!",
      template: "Designo",
      date: "Feb 16, 2025"
    },
    {
      id: 5,
      name: "Brandon Scott",
      handle: "@brandonscottui",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
      text: "As a designer, I appreciate how polished and flexible Framerstore is. It's exactly what I needed to start selling templates professionally!",
      template: "Vellox",
      date: "Feb 16, 2025"
    },
    {
      id: 6,
      name: "Olivia Reed",
      handle: "@oliviareedux",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
      text: "Framerstore turned what used to be a complicated process into something super easy. It's fast, responsive, and built for success!",
      template: "AI Chatbot",
      date: "Feb 16, 2025"
    }
  ];

  return (
    <div className="w-full bg-[#F5F5F7] px-6 py-20 font-sans">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {testimonials.map((item) => (
          <div key={item.id} className="bg-white rounded-[2rem] p-8 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-shadow duration-300">

            {/* Top Section: User Info & Content */}
            <div>
              {/* Header: Avatar, Name, Stars */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-black text-sm leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[#0055FF] text-xs font-medium">
                      {item.handle}
                    </span>
                  </div>
                </div>

                {/* 5 Blue Stars */}
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-[#0055FF]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <p className="text-gray-800 text-[15px] leading-relaxed font-normal">
                "{item.text}"
              </p>
            </div>

            {/* Bottom Section: Template & Date */}
            <div className="mt-8 pt-0 flex items-center gap-2 text-xs font-medium text-black">
              <span>{item.template}</span>
              <span className="text-gray-300 text-sm">//</span>
              <span>{item.date}</span>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
};

export default TestimonialsGrid;