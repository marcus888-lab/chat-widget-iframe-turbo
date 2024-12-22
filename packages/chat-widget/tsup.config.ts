import { defineConfig } from "tsup";

export default defineConfig([
  // Library build
  {
    entry: ["src/index.tsx"],
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ["react"],
    injectStyle: true,
  },
  // Iframe build
  {
    entry: ["src/iframe.tsx"],
    format: ["iife"],
    globalName: "ChatWidgetBundle",
    sourcemap: true,
    clean: false,
    minify: true,
    injectStyle: true,
    platform: "browser",
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    external: ["react", "react-dom"],
    noExternal: [/^(?!react|react-dom).+/],
    // Map external dependencies to global variables
    banner: {
      js: `
        if (!window.React) {
          throw new Error('React is required but not loaded. Make sure to include React before this script.');
        }
        if (!window.ReactDOM) {
          throw new Error('ReactDOM is required but not loaded. Make sure to include ReactDOM before this script.');
        }
      `,
    },
  },
]);
