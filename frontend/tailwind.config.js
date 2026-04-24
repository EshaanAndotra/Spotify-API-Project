/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Single accent color for the whole app, per project rules.
        spotify: "#1DB954",
        // Neutral palette tuned for the dark base so we don't reach for gray-400/500/600 ad hoc.
        surface: {
          DEFAULT: "#0d0d0f",
          raised: "#17171a",
          border: "#26262b",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
