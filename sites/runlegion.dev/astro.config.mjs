import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://runlegion.dev',
  trailingSlash: 'always',

  integrations: [
    mdx(),
    sitemap({
      lastmod: new Date(),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
