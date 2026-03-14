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
        linen: "#F0EAE0",
        warm: "#8B7355",
        "warm-light": "#A89279",
        "warm-dark": "#6B5740",
        border: "#E5DDD3",
        gold: "#C4952E",
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
