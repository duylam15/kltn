/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        slight: ['Slight', 'sans-serif'],
        fahkwang: ['Fahkwang', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
