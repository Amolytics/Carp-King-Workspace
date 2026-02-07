import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:4001',
      '/socket.io': {
        target: 'http://localhost:4001',
        ws: true,
      },
    },
    hmr: {
      overlay: false,
    },
  },
});
