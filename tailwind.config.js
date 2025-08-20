/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'lol-gold': '#C89B3C',
        'lol-blue': '#0F2027',
        'lol-dark': '#010A13',
        'lol-light': '#F0E6D2',
      },
      fontFamily: {
        'lol': ['Cinzel', 'serif'],
      },
    },
  },
  plugins: [],
}
