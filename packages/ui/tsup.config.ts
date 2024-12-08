import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.tsx"],
  format: ["cjs", "esm"],
  dts: true,
  external: ["react"],
  sourcemap: true,
  clean: true,
  // Handle JSX
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
  // Ensure we handle CSS files
  loader: {
    ".css": "css",
  },
  // Needed for proper JSX/TSX handling in .d.ts files
  tsconfig: "tsconfig.json",
});
