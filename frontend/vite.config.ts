import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// API key is NEVER sent to the browser.
// All /api calls are proxied to the Python FastAPI server.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
