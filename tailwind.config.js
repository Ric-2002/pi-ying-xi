/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        serif: ["Noto Serif SC", "Songti SC", "STSong", "serif"],
      },
    },
  },
  plugins: [],
};
