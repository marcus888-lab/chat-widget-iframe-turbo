import type { Config } from "tailwindcss";
import sharedConfig from "@repo/ui/tailwind.config";

const config: Config = {
  // Extend the shared config
  presets: [sharedConfig],

  // Content paths specific to chat-widget
  content: ["./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        secondary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        // Message colors
        "message-user": "var(--primary-600, #0284c7)",
        "message-user-text": "var(--primary-50, #f0f9ff)",
        "message-assistant": "var(--secondary-100, #f1f5f9)",
        "message-assistant-text": "var(--secondary-900, #0f172a)",
        "message-system": "var(--secondary-50, #f8fafc)",
        "message-system-text": "var(--secondary-600, #475569)",
        // Tool message colors
        "tool-bg": "var(--secondary-50, #f8fafc)",
        "tool-border": "var(--secondary-200, #e2e8f0)",
        "tool-text": "var(--secondary-900, #0f172a)",
        // Code block colors
        "code-bg": "var(--secondary-900, #0f172a)",
        "code-text": "var(--secondary-50, #f8fafc)",
      },
    },
  },

  // Enable dark mode
  darkMode: "class",

  // Plugin configurations
  plugins: [],
};

export default config;
