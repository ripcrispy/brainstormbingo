/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './js/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        magic: ['"Yusei Magic"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
