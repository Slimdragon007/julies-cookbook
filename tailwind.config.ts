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
        cream: "#0a0a10",
        linen: "#1a1a22",
        warm: "#E3A64C",
        "warm-light": "#9999a3",
        "warm-dark": "#f2f2f5",
        border: "rgba(255,255,255,0.08)",
        gold: "#E3A64C",
        glass: "rgba(255,255,255,0.06)",
        "glass-border": "rgba(255,255,255,0.1)",
        "glass-input": "rgba(255,255,255,0.05)",
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["Lora", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
