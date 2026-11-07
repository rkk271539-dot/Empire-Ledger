/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fintech: {
          dark: '#0B0E14',
          card: '#121721',
          cardBorder: '#1F2937',
          accent: '#3B82F6',
          gain: '#10B981',
          loss: '#EF4444',
          muted: '#6B7280',
          text: '#F3F4F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
