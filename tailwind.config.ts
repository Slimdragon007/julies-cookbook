// tailwind.config.ts — drop-in replacement for julies-cookbook
// Paper Editorial aesthetic: warm paper background, terracotta accent,
// Instrument Serif italic for display, Inter for body, JetBrains Mono for numbers.
// Replaces the Hearth (Magnolia + Liquid Glass) token foundation as of 2026-05-20.

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Color values wrap CSS custom properties using channel-decomposed RGB
      // + Tailwind's <alpha-value> placeholder. This preserves slash-opacity
      // utilities (bg-paper/95, text-accent/30, border-rule/40) AND lets the
      // TweaksProvider override the variables via [data-palette="..."]
      // selectors (TASK-026) without changing visual output when no override
      // is active. Variables are defined in globals.css as space-separated
      // RGB channels (e.g. --paper: 242 239 232) so rgb(var(--paper) / 0.95)
      // resolves to a valid color at runtime.
      colors: {
        paper: "rgb(var(--paper) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        rule: "rgb(var(--rule) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
          mute: "rgb(var(--ink-mute) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          soft: "rgb(var(--accent-soft) / <alpha-value>)",
          ink: "rgb(var(--accent-ink) / <alpha-value>)",
          on: "rgb(var(--accent-on) / <alpha-value>)",
        },
      },
      fontFamily: {
        // CSS variables come from next/font in src/app/layout.tsx. The fallback
        // chain protects the FOIT/FOUT window during Google Fonts load.
        display: ["var(--font-instrument)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      fontSize: {
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
        "lift-sm": "0 1px 2px rgba(20, 19, 15, 0.05)",
        lift: "0 4px 16px rgba(20, 19, 15, 0.06)",
        "lift-lg": "0 12px 32px rgba(20, 19, 15, 0.10)",
        glass:
          "0 8px 24px rgba(20, 19, 15, 0.05), inset 0 1px 0 rgba(255,255,255,0.5)",
      },
      backdropBlur: {
        glass: "20px",
      },
      backdropSaturate: {
        glass: "140%",
      },
      backgroundColor: {
        "glass-base": "rgba(252, 251, 247, 0.72)",
      },
      borderColor: {
        "glass-line": "rgba(20, 19, 15, 0.08)",
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
