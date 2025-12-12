/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: { backgroundImage: {
        'radial-gradient': 'radial-gradient(circle at center, rgba(255, 120, 0, 0.4) 0%, rgba(255, 120, 0, 0) 70%)',
      }},
  },
  plugins: [],
};


