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
        primary: {
          50: '#f5f7ff',
          100: '#ebedff',
          200: '#dce0ff',
          300: '#c2c8ff',
          400: '#9fa6ff',
          500: '#757cff',
          600: '#5356ff',
          700: '#4343eb',
          800: '#3838c2',
          900: '#31319c',
          950: '#1d1d5b',
        },
      },
    },
  },
  plugins: [],
}
