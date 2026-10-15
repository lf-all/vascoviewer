import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { paper: "#fafaf8", ink: "#1c1c1a", mute: "#8a8a85", line: "#e8e8e3" },
      fontFamily: { sans: ["var(--font-jost)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};

export default config;
