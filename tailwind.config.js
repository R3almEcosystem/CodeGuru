/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
  darkMode: 'class', // Enable dark mode via class
};
module.exports = {
  // ... your existing config
  plugins: [
    require('tailwind-scrollbar')({ nocompatible: true }),
  ],
}