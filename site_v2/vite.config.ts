import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    // Multi-Page App: ana sayfa + katalog ayrı bundle'lar.
    // Vite relative path'leri proje root'una göre çözer — node:path /
    // __dirname'e gerek yok (CI'da @types/node yüklü değil).
    rollupOptions: {
      input: {
        main:    'index.html',
        catalog: 'catalog.html',
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
