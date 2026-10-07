import { defineConfig } from 'vite';

/** Build-only render page (render/), driven by scripts/render-tips.ts. Never deployed. */
export default defineConfig({
  root: 'render',
  base: './',
  logLevel: 'warn',
  build: {
    outDir: '../.render-app',
    emptyOutDir: true,
    target: 'es2022',
  },
});
