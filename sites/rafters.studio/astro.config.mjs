import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://rafters.studio',
  trailingSlash: 'always',

  // Static content site: sessions are never used at runtime. Pin an in-memory
  // session driver so the Cloudflare adapter does not fall back to its default
  // KV-backed session store. That default injects a `SESSION` kv_namespaces
  // binding with no id into the generated wrangler config, which makes wrangler
  // try to auto-provision the namespace on every deploy and fail once it exists
  // (Cloudflare API error 10014, "a namespace with this title already exists").
  session: {
    driver: 'memory',
  },

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
