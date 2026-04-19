import React from 'react';
import testimonialService from '../services/testimonialService';

const TestimonialsGrid = () => {
  const [testimonials, setTestimonials] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const data = await testimonialService.getApproved();
        setTestimonials(data);
      } catch (error) {
        console.error("Failed to fetch testimonials:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-[#F5F5F7] px-6 py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return null; // Or show a default section
  }

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
                    src={item.user?.avatar || `https://ui-avatars.com/api/?name=${item.user?.name || 'User'}&background=random`}
                    alt={item.user?.name || 'User'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-black text-sm leading-tight">
                      {item.user?.name || 'Verified User'}
                    </span>
                    <span className="text-primary text-xs font-medium">
                      @{item.user?.email?.split('@')[0] || 'user'}
                    </span>
                  </div>
                </div>

                {/* Stars based on rating */}
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < item.rating ? 'text-primary' : 'text-gray-200'}`} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <p className="text-gray-800 text-[15px] leading-relaxed font-normal italic">
                "{item.content}"
              </p>
            </div>

            {/* Bottom Section: Date */}
            <div className="mt-8 pt-0 flex items-center gap-2 text-xs font-medium text-black">
              <span>Customer</span>
              <span className="text-gray-300 text-sm">//</span>
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
};

export default TestimonialsGrid;