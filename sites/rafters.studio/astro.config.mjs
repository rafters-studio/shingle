import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://rafters.studio',
  trailingSlash: 'always',

  // Fully prerendered content site: no SSR routes, endpoints, or runtime
  // bindings. Built as static output and served by Cloudflare as static assets
  // (see wrangler.jsonc), matching runlegion.dev and smugglr.dev. The Cloudflare
  // adapter was removed because its only role here was build-time image handling
  // and it forced a KV-backed session store that broke deploys.
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
