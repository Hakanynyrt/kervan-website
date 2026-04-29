import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    // Multi-Page App: ana sayfa + katalog ayrı bundle'lar.
    // Vite her HTML için kendi React tree'si, kendi chunk'ı oluşturur.
    rollupOptions: {
      input: {
        main:    path.resolve(__dirname, 'index.html'),
        catalog: path.resolve(__dirname, 'catalog.html'),
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
