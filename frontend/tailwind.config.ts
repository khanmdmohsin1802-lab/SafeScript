import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0F14",
        foreground: "#111827",
        surface: "#1F2937",
        primary: {
          DEFAULT: "#6366F1",
          foreground: "#ffffff",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        muted: {
          DEFAULT: "#9CA3AF",
          foreground: "#E5E7EB",
        },
      },
    },
  },
  plugins: [],
};
export default config;
