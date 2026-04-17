// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { EnumChangefreq } from 'sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://kervanheat.com',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  build: {
    format: 'directory',
    assets: '_assets',
    inlineStylesheets: 'auto',
  },
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'tr',
        locales: { tr: 'tr-TR', en: 'en-US' },
      },
      filter: (page) => !page.includes('/404') && !page.includes('/_'),
      serialize(item) {
        if (
          item.url.includes('/breaker-parts/') ||
          item.url.includes('/kirici-parcalari/')
        ) {
          item.changefreq = EnumChangefreq.WEEKLY;
          item.priority = 0.8;
        } else if (item.url.match(/\/(tr|en)\/?$/)) {
          item.changefreq = EnumChangefreq.WEEKLY;
          item.priority = 1.0;
        } else {
          item.changefreq = EnumChangefreq.MONTHLY;
          item.priority = 0.6;
        }
        return item;
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
  prefetch: { defaultStrategy: 'hover' },
});
