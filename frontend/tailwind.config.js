module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0faf68",
          light: "#1fc37a",
          dark: "#0b8b54",
        },
        surface: "#ffffff",
        subtle: "#f0fdf4",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.08),0 2px 6px rgba(0,0,0,0.04)",
      },
      borderRadius: {
        xl: "1rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
