/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'IBM Plex Mono'", "monospace"],
        sans: ["'Outfit'", "system-ui", "sans-serif"],
      },
      colors: {
        accent: "#d48c00",
        solar: {
          bg: "#f5f6f8",
          card: "#ffffff",
          card2: "#eef1f5",
          border: "#d0d5dd",
          text: "#1a1a2e",
          dim: "#5c6370",
          green: "#059669",
          red: "#dc2626",
          blue: "#2563eb",
        },
      },
    },
  },
  plugins: [],
};
