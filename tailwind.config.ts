// tailwind.config.ts — drop-in replacement for julies-cookbook
// Hearth aesthetic: Magnolia warmth + Liquid Glass polish
// Generated 2026-04-30 from DESIGN LAW: julies-cookbook

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FAF8F4",
        linen: {
          DEFAULT: "#F0EAE0",
          dim: "#E6DFD2",
        },
        ink: {
          DEFAULT: "#2A2520",
          soft: "#5C5249",
          mute: "#8A7F73",
        },
        brown: {
          DEFAULT: "#8B7355",
          deep: "#6B5742",
          glass: "rgba(139, 115, 85, 0.12)",
        },
        leaf: "#7A8B5C",
        ember: "#C77D4A",
        rust: "#A04A3C",
        gold: "#C9A96E",
      },
      fontFamily: {
        // CSS variables come from next/font in src/app/layout.tsx. Georgia is
        // the FOIT/FOUT fallback during the Google Fonts load.
        display: ["var(--font-playfair)", "Georgia", "serif"],
        serif: ["var(--font-lora)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Display / H scales (line-height bundled)
        "display-mobile": [
          "36px",
          { lineHeight: "1.15", letterSpacing: "-0.01em" },
        ],
        display: ["48px", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        h1: ["28px", { lineHeight: "1.2", letterSpacing: "-0.005em" }],
        h2: ["22px", { lineHeight: "1.3" }],
        h3: ["18px", { lineHeight: "1.4" }],
        body: ["16px", { lineHeight: "1.6" }],
        caption: ["14px", { lineHeight: "1.5" }],
        "mono-stat": ["14px", { lineHeight: "1.4" }],
        "calc-input": ["28px", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "16px",
        lg: "24px",
        pill: "9999px",
      },
      boxShadow: {
        "lift-sm": "0 1px 2px rgba(42, 37, 32, 0.06)",
        lift: "0 4px 16px rgba(42, 37, 32, 0.08)",
        "lift-lg": "0 12px 32px rgba(42, 37, 32, 0.12)",
        glass:
          "0 8px 24px rgba(42, 37, 32, 0.06), inset 0 1px 0 rgba(255,255,255,0.4)",
      },
      backdropBlur: {
        glass: "20px",
      },
      backdropSaturate: {
        glass: "140%",
      },
      backgroundColor: {
        "glass-base": "rgba(250, 248, 244, 0.72)",
      },
      borderColor: {
        "glass-line": "rgba(139, 115, 85, 0.16)",
      },
      transitionTimingFunction: {
        hearth: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      keyframes: {
        "fab-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
        "macro-bounce": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.06)" },
        },
        "drift-up": {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "dot-pulse": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fab-pulse": "fab-pulse 1600ms ease-in-out 3500ms 2",
        "macro-bounce": "macro-bounce 180ms ease-out",
        "drift-up": "drift-up 600ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
        "dot-1": "dot-pulse 1800ms ease-in-out infinite 0ms",
        "dot-2": "dot-pulse 1800ms ease-in-out infinite 600ms",
        "dot-3": "dot-pulse 1800ms ease-in-out infinite 1200ms",
      },
    },
  },
  plugins: [],
};

export default config;
