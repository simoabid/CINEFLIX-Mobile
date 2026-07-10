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
          black: '#0A0A1F',
          red: '#E50914',
          dark: '#12122A',
          darker: '#07071A',
          light: '#564D4D',
          gray: '#808080',
          lightgray: '#B3B3B3',
          'dark-purple': '#0f0e14',
          'purple-blue': '#181524',
          'deep-blue': '#0d1117',
          'glass': 'rgba(255,255,255,0.06)',
          'glass-border': 'rgba(255,255,255,0.1)',
        },
        // Mirrors web `tailwind.config.js` brand/glass/surface scales so ported
        // components keep design parity with cineflix-app.
        brand: {
          red: '#E50914',
          'red-hover': '#C7000C',
          'red-light': '#ff1a1a',
          'red-glow': 'rgba(229, 9, 20, 0.4)',
        },
        glass: {
          background: 'rgba(19, 19, 43, 0.7)',
          'background-dark': 'rgba(10, 10, 31, 0.85)',
          border: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.12)',
        },
        surface: {
          background: '#0A0A1F',
          card: '#13132B',
          accent: '#1F1F35',
          elevated: '#252540',
        },
      },
      fontFamily: {
        'netflix': ['Netflix Sans', 'Helvetica Neue', 'Arial', 'sans-serif']
      }
    },
  },
  plugins: [],
}
