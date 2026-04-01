import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import rehypePrettyCode from 'rehype-pretty-code';

const prettyCodeOptions = {
  theme: 'github-light',
  keepBackground: true,
};

// https://astro.build/config
export default defineConfig({
  site: 'https://sean.silvius.me',
  trailingSlash: 'always',

  integrations: [
    react(),
    mdx({
      rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
    }),
    sitemap(),
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
