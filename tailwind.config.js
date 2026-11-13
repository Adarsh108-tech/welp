/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        offwhite: {
          50: "#ffffff",
          100: "#fdfbf7",
          200: "#f7f2ea",
          300: "#eee6d8",
          400: "#ded2c0",
        },
        wine: {
          50: "#fdf2f4",
          100: "#fbe6ea",
          200: "#f6cfd6",
          300: "#eeaab7",
          400: "#e0788d",
          500: "#cc4e69",
          600: "#af334e",
          700: "#8e223a",
          800: "#721b2e",
          900: "#58111a",
          950: "#38080f",
        },
        burgundy: {
          50: "#fbf3f5",
          100: "#f7e5e9",
          200: "#efccd4",
          300: "#e3a7b5",
          400: "#d1778c",
          500: "#ba4d67",
          600: "#9d344d",
          700: "#7f253a",
          800: "#691f30",
          900: "#501422",
          950: "#2c0911",
        },
        peach: {
          50: "#fff9f6",
          100: "#fff0e8",
          200: "#fedfcf",
          300: "#fcc4a7",
          400: "#fa9d74",
          500: "#f57542",
          600: "#e65624",
          700: "#be3f15",
          800: "#993516",
          900: "#7c2f16",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
