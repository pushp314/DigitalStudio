/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: { 
      colors: {
        primary: '#2563eb'
      },
      backgroundImage: {
        'radial-gradient': 'radial-gradient(circle at center, rgba(255, 120, 0, 0.4) 0%, rgba(255, 120, 0, 0) 70%)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
};


