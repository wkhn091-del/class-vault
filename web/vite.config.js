import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Dev: browser hits same origin so Render CORS (Vercel-only) does not block localhost.
    proxy: {
      '/api': {
        target: 'https://class-vault.onrender.com',
        changeOrigin: true,
      },
      '/health': {
        target: 'https://class-vault.onrender.com',
        changeOrigin: true,
      },
    },
  },
});
