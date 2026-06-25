import { defineConfig } from "vite";
import { resolve } from "node:path";

const root = import.meta.dirname;

// Multi-page static site: index.html (matrix) + agent.html (detail).
export default defineConfig({
  root: ".",
  // Relative base so the built site works under a GitHub Pages project subpath
  // (https://<user>.github.io/<repo>/) as well as at a domain root.
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(root, "index.html"),
        agent: resolve(root, "agent.html"),
      },
    },
  },
  preview: {
    host: true,
    // allow any host so a public cloudflared tunnel can reach the preview server
    allowedHosts: true,
    port: 4173,
  },
});
