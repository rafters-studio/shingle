import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import { astroMeta, defineSharedMeta, defineSite } from '@shingle/shared/meta';

export default defineConfig({
  site: 'https://gitpress.app',
  trailingSlash: 'always',

  integrations: [
    react(),
    // Dogfood @rafters/astro-meta for the build-time artifacts (sitemap.xml
    // replacing @astrojs/sitemap, robots.txt, llms.txt, _headers, GEO audit),
    // wired once through @shingle/shared.
    astroMeta(
      defineSharedMeta({
        site: defineSite({
          url: 'https://gitpress.app',
          name: 'Gitpress',
          description: 'Edit your markdown website without learning Git.',
          locale: 'en-US',
        }),
      }),
    ),
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
