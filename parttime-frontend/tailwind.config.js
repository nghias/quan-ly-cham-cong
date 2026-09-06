/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sunday: {
          blue: '#0B1E3F',
          lightBlue: '#1D3557',
          yellow: '#FFD166',
        }
      }
    },
  },
  plugins: [],
}