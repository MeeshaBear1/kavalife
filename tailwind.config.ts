import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FBF8F2",
        sand: "#F3ECE0",
        ink: "#15271E",
        // Primary tropical emerald
        kava: {
          50: "#ecfdf3",
          100: "#d2f9e0",
          200: "#a6f0c6",
          300: "#6fe3a5",
          400: "#37cd81",
          500: "#1fa85c",
          600: "#168a4b",
          700: "#136e3e",
          800: "#135734",
          900: "#0f3d2b",
          950: "#072a1d",
        },
        // Forest (dark sections)
        forest: {
          DEFAULT: "#0f3d2b",
          deep: "#0a2c1f",
        },
        sunset: {
          400: "#fbbf6b",
          500: "#f97316",
          600: "#e9650f",
        },
        lagoon: {
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
        },
        coral: "#f2615c",
        grape: "#7c5cff",
        skyblue: "#3aa0ff",
        sunny: "#ffcd4d",
        berry: "#e3548b",
      },
      fontFamily: {
        display: ["var(--font-poppins)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 10px 30px -12px rgba(15, 61, 43, 0.18)",
        soft: "0 4px 20px -8px rgba(15, 61, 43, 0.15)",
        lift: "0 20px 45px -18px rgba(15, 61, 43, 0.28)",
      },
      backgroundImage: {
        "hero-tropic":
          "linear-gradient(120deg, #14b8a6 0%, #1fa85c 38%, #fbbf6b 78%, #f97316 100%)",
        "sunset-band":
          "linear-gradient(120deg, #14b8a6 0%, #1fa85c 45%, #f97316 100%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "fade-up": "fade-up 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
