/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // ✅ Correct glob pattern for all relevant files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
