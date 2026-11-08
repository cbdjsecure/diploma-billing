/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4f0',
          100: '#fbe6dd',
          200: '#f7c9b7',
          300: '#f2a68c',
          400: '#eb7d5c',
          500: '#e55a33',
          600: '#d44422',
          700: '#b0351b',
          800: '#8d2e1c',
          900: '#732a1c',
        },
      },
    },
  },
  plugins: [],
};

