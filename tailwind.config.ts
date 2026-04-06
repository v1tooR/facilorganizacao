import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["DM Sans", "sans-serif"],
      },
      colors: {
        background: {
          DEFAULT: "#F8FAFC",
          secondary: "#EEF2F7",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          secondary: "#F3F4F6",
        },
        border: {
          DEFAULT: "#E5E7EB",
          light: "#F3F4F6",
        },
        text: {
          primary: "#111827",
          secondary: "#4B5563",
          muted: "#6B7280",
        },
        brand: {
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          accent: "#EA580C",
        },
        status: {
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
        },
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #FBBF24 0%, #F59E0B 45%, #EA580C 100%)",
        "brand-gradient-soft":
          "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #FED7AA 100%)",
        "hero-grid":
          "radial-gradient(circle at 1px 1px, #E5E7EB 1px, transparent 0)",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px 0 rgba(0,0,0,0.04)",
        "card-md":
          "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)",
        "card-lg":
          "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04)",
        brand: "0 4px 14px 0 rgba(245, 158, 11, 0.3)",
        "brand-lg": "0 8px 24px 0 rgba(245, 158, 11, 0.35)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-in": "slideIn 0.4s ease forwards",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
