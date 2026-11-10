import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { astryxPrune } from '../../packages/ui/vite-astryx-prune.mjs';

export default defineConfig({
  plugins: [react(), tailwindcss(), astryxPrune()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
  },
  server: {
    port: 5174,
    host: true,
  },
});
