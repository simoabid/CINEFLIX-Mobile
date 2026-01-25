/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Configure this to wherever your key files are
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        netflix: {
          black: '#141414',
          red: '#E50914',
          dark: '#221F1F',
          darker: '#111',
          light: '#564D4D',
          gray: '#808080',
          lightgray: '#B3B3B3',
          'dark-purple': '#0f0e14',
          'purple-blue': '#181524',
          'deep-blue': '#0d1117',
        }
      },
      fontFamily: {
        'netflix': ['Netflix Sans', 'Helvetica Neue', 'Arial', 'sans-serif']
      }
    },
  },
  plugins: [],
}
