/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // --- START OF THE CHANGE ---
      height: {
        'screen-dynamic': '100dvh',
      },
      // --- END OF THE CHANGE ---
      colors: {
        primary: {
          DEFAULT: '#4F46E5', // A modern indigo
          hover: '#4338CA',
        },
        secondary: '#F4F4F5', // A light gray for backgrounds
        danger: '#EF4444',
        success: '#22C55E',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { 
          '0%': { transform: 'translateY(30px)', opacity: 0 }, 
          '100%': { transform: 'translateY(0)', opacity: 1 } 
        },
      }
    },
  },
  plugins: [],
}