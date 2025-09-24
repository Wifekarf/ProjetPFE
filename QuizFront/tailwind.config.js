const plugin = require('tailwindcss/plugin');

module.exports = {
  darkMode:'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {},
  },
  plugins: [ ],
}; 