/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        carbon: '#000000',
        'paper-white': '#ffffff',
        'sky-wash': '#dceeff',
        'concrete-gray': '#cccccc',
        'soft-mist': '#e9e9e9',
        'electric-blue': '#4da2ff',
        'mint-pop': '#55db9c',
        lavender: '#e9ccff',
        ember: '#fb4903',
        sunburst: '#ffd731',
        'voltage-violet': '#5c4ade',
      },
      fontFamily: {
        display: ['Antonio', 'Impact', 'Lateral', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'Aeonik Pro', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier', 'monospace'],
      },
      borderRadius: {
        pill: '1600px',
        card: '24px',
        'card-lg': '36px',
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [],
}
