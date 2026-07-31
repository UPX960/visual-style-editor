import type { Config } from "tailwindcss";

export default {
  content: [
    "./popup.html",
    "./options.html",
    "./src/popup/**/*.{ts,tsx}",
    "./src/options/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        accent: "#6d5dfc"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(15, 23, 42, 0.18)"
      }
    }
  },
  plugins: []
} satisfies Config;
