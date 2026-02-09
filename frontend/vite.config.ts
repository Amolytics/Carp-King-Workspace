import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:4000",
      // Proxy socket.io websocket upgrades to the backend during local development
      "/socket.io": {
        target: "http://localhost:4000",
        ws: true,
      },
    },
    hmr: {
      overlay: false,
    },
  },
});
