/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: NativeWind v4 requires this preset
  presets: [require("nativewind/preset")],
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        klowk: {
          white: '#ffffff',
          black: '#121212',
          orange: '#FF5A00',
          yellow: '#FFC800',
          gray: '#F5F5F7'
        }
      }
    },
  },
  plugins: [],
}

