import { defineConfig } from "vite";
import { resolve } from "node:path";

// Multi-page static site: index.html (matrix) + agent.html (detail).
export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        agent: resolve(__dirname, "agent.html"),
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
