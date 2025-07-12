/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "vibrant-purple": "#6B46C1",
        "vibrant-pink": "#ED64A6",
        "vibrant-orange": "#F6AD55",
        "soft-gray": "#F7FAFC",
      },
      fontFamily: {
        vibrant: ['"Poppins"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
