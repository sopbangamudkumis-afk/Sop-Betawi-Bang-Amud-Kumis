/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff8f0',
          100: '#ffeed9',
          200: '#fed7aa',
          300: '#fdb974',
          400: '#fb923c',
          500: '#f97316', // Vibrant warm orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        betawi: {
          red: '#c0262d',      // Merah khas nota & gerobak betawi
          gold: '#eab308',     // Kuning kunyit / gurih
          dark: '#1c1917',     // Stone dark
          card: '#292524',
          surface: '#1e1b18',
          accent: '#10b981',   // Emerald green segar (daun bawang / sambal)
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(249, 115, 22, 0.3)',
        'glow-lg': '0 0 35px -5px rgba(249, 115, 22, 0.4)',
        'card': '0 10px 30px -10px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}
