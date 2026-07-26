/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': {
          '50': '#f0fdf4',
          '100': '#dcfce7',
          '200': '#bbf7d0',
          '300': '#86efac',
          '400': '#4ade80',
          '500': '#22c55e',
          '600': '#16a34a',
          '700': '#15803d',
          '800': '#166534',
          '900': '#14532d',
          '950': '#052e16',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'fluid-xs': ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.25' }],
        'fluid-sm': ['clamp(0.8rem, 0.75rem + 0.25vw, 0.9rem)', { lineHeight: '1.4' }],
        'fluid-base': ['clamp(0.9rem, 0.85rem + 0.3vw, 1rem)', { lineHeight: '1.5' }],
        'fluid-lg': ['clamp(1rem, 0.9rem + 0.5vw, 1.125rem)', { lineHeight: '1.5' }],
        'fluid-xl': ['clamp(1.125rem, 1rem + 0.625vw, 1.375rem)', { lineHeight: '1.4' }],
        'fluid-2xl': ['clamp(1.25rem, 1.1rem + 0.75vw, 1.75rem)', { lineHeight: '1.3' }],
        'fluid-3xl': ['clamp(1.5rem, 1.25rem + 1.25vw, 2rem)', { lineHeight: '1.2' }],
        'fluid-4xl': ['clamp(1.75rem, 1.5rem + 1.75vw, 2.5rem)', { lineHeight: '1.1' }],
      },
    },
  },
  plugins: [],
}
