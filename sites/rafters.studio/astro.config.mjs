import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { astroMeta, defineSharedMeta, defineSite } from '@shingle/shared/meta';

export default defineConfig({
  site: 'https://rafters.studio',
  trailingSlash: 'always',

  // Fully prerendered content site: no SSR routes, endpoints, or runtime
  // bindings. Built as static output and served by Cloudflare as static assets
  // (see wrangler.jsonc), matching runlegion.dev and smugglr.dev.
  integrations: [
    mdx(),
    // Dogfood @rafters/astro-meta for the build-time artifacts (sitemap.xml
    // replacing @astrojs/sitemap, robots.txt, llms.txt, _headers, GEO audit),
    // wired once through @shingle/shared.
    astroMeta(
      defineSharedMeta({
        site: defineSite({
          url: 'https://rafters.studio',
          name: 'Rafters',
          description:
            'Rafters is the Design Intelligence Protocol. Designers encode judgment; AI reads decisions.',
          locale: 'en-US',
        }),
      }),
    ),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
