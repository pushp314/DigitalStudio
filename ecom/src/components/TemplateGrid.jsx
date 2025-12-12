import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { templates as allTemplates } from '../data/templates';
import WishlistContext from '../context/WishlistContext';
import CartContext from '../context/CartContext';
import StarRating from './ui/StarRating';
import { useToast } from '../context/ToastContext';

const TemplateGrid = ({ items, limit }) => {
  let templates = items || allTemplates;
  const { addToWishlist, removeFromWishlist, isInWishlist } = useContext(WishlistContext);
  const { addToCart } = useContext(CartContext);
  const { success } = useToast();

  if (limit) {
    templates = templates.slice(0, limit);
  }

  const handleWishlistClick = (e, template) => {
    e.preventDefault();
    e.stopPropagation();
    const id = template._id || template.id;
    if (isInWishlist(id)) {
      removeFromWishlist(id);
      success('Removed from wishlist');
    } else {
      addToWishlist(template);
      success('Added to wishlist ❤️');
    }
  };

  const handleAddToCart = (e, template) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(template);
    success(`${template.title} added to cart!`);
  };

  // Tech stack icon mapping
  const getTechIcon = (tech) => {
    const iconMap = {
      'React': '⚛️',
      'Vue': '🟢',
      'Angular': '🔴',
      'Next.js': '▲',
      'Node.js': '🟢',
      'Express': '⚡',
      'MongoDB': '🍃',
      'PostgreSQL': '🐘',
      'TypeScript': '💙',
      'JavaScript': '💛',
      'Python': '🐍',
      'Tailwind': '🎨',
      'React Native': '📱',
      'Flutter': '🦋'
    };
    return iconMap[tech] || '🔧';
  };

  return (
    <div className="w-full bg-[#F5F5F7] px-6 pb-20 font-sans">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-12">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template) => (
            <Link to={`/templates/${template._id || template.id}`} key={template._id || template.id} className="group flex flex-col gap-4 cursor-pointer relative">

              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-200 relative shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                <img
                  src={template.image}
                  alt={template.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Status Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                  {template.isFree && (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      FREE
                    </span>
                  )}
                  {template.isBestseller && !template.isFree && (
                    <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      🏆 BESTSELLER
                    </span>
                  )}
                  {template.isNewProduct && !template.isBestseller && !template.isFree && (
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      ✨ NEW
                    </span>
                  )}
                  {template.isTrending && !template.isNewProduct && !template.isBestseller && !template.isFree && (
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      🔥 TRENDING
                    </span>
                  )}
                  {template.isFeatured && !template.isTrending && !template.isNewProduct && !template.isBestseller && !template.isFree && (
                    <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      ⭐ FEATURED
                    </span>
                  )}
                </div>

                {/* Wishlist Button */}
                <button
                  onClick={(e) => handleWishlistClick(e, template)}
                  className="absolute top-4 right-4 bg-white/80 hover:bg-white backdrop-blur-sm p-2 rounded-full shadow-sm z-10 transition-colors"
                >
                  <svg className={`w-5 h-5 ${isInWishlist(template._id || template.id) ? 'text-red-500 fill-current' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                  <div className="bg-white text-black px-6 py-3 rounded-full font-bold text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-lg">
                    View Details
                  </div>
                </div>
              </div>

              <div className="w-full bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4 transition-all duration-300 group-hover:shadow-md border border-gray-100">

                {/* Title & Price */}
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-black tracking-tight mb-1">
                      {template.title}
                    </h3>
                    {/* Star Rating */}
                    {template.rating > 0 && (
                      <StarRating rating={template.rating} numReviews={template.numReviews} size="sm" />
                    )}
                  </div>
                  <span className="text-2xl font-bold text-black ml-4">
                    {template.price}
                  </span>
                </div>

                {/* Tech Stack Badges */}
                {template.techStack && template.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {template.techStack.slice(0, 4).map((tech, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                        <span>{getTechIcon(tech)}</span>
                        {tech}
                      </span>
                    ))}
                    {template.techStack.length > 4 && (
                      <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-xs font-medium">
                        +{template.techStack.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Product Type & Actions */}
                <div className="flex justify-between items-center mt-auto pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleAddToCart(e, template)}
                      className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-full text-xs font-bold transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-gray-400 font-medium text-xs uppercase tracking-wide">
                      {template.category}
                    </span>
                    {template.numSales > 0 && (
                      <span className="text-gray-500 text-xs">
                        {template.numSales} sales
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </Link>
          ))}
        </div>

        {limit && (
          <div className="flex justify-center mt-4">
            <Link to="/templates" className="flex items-center gap-2 text-black font-bold text-lg hover:gap-3 transition-all">
              View all templates
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default TemplateGrid;