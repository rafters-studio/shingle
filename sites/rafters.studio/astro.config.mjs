import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://rafters.studio',
  trailingSlash: 'always',

  integrations: [
    mdx(),
    sitemap({
      lastmod: new Date(),
    }),
  ],

  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    imageService: 'cloudflare',
  }),

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: [
        'stream',
        'util',
        'node:fs/promises',
        'node:path',
        'node:url',
        'node:crypto',
      ],
    },
  },
});
