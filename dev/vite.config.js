import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./"  is the key line.
// It makes asset URLs RELATIVE rather than absolute (/assets/...).
// This single setting makes the built site work in three places:
//   1) Locally when you double-click index.html
//   2) On GitHub Pages at https://<you>.github.io/SafePoint/
//   3) On any other static host
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
