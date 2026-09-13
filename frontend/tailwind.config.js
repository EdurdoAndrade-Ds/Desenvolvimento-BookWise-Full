/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef5ff',
          100: '#d9e8ff',
          500: '#2f6fed',
          600: '#1f5bd4',
          700: '#1a4bb0',
        },
        cream: {
          50: '#fbf9f5',
          100: '#f6f1e8',
          200: '#ece4d6',
          300: '#ded2be',
        },
      },
    },
  },
  plugins: [],
};
