/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: NativeWind v4 requires this preset
  presets: [require("nativewind/preset")],
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        klowk: {
          white: "#ffffff",
          black: "#121212",
          orange: "#FBBF24",
          yellow: "#FFC800",
          gray: "#F5F5F7",
          teal: "#0D9488",
        },
      },
    },
  },
  plugins: [],
};
