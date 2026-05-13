/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#231a16",
        cocoa: "#4b342d",
        cream: "#fff8ef",
        saffron: "#f5b84b",
        coral: "#f46f5d",
        mint: "#45b990",
        ocean: "#3c7bdc",
        berry: "#a95fd6",
      },
      boxShadow: {
        dial: "0 26px 70px rgba(96, 55, 31, 0.25), inset 0 1px 0 rgba(255,255,255,0.42)",
        sheet: "0 -24px 70px rgba(44, 28, 20, 0.22)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
