import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { astroMeta, defineSharedMeta, defineSite } from '@shingle/shared/meta';

export default defineConfig({
  site: 'https://smugglr.dev',
  output: 'static',
  trailingSlash: 'always',

  markdown: {
    smartypants: false,
  },

  integrations: [
    mdx(),
    // Dogfood @rafters/astro-meta for the build-time artifacts (sitemap.xml
    // replacing @astrojs/sitemap, robots.txt, llms.txt + llms-full.txt
    // replacing the hand-rolled public files, _headers, GEO audit), wired once
    // through @shingle/shared.
    astroMeta(
      defineSharedMeta({
        site: defineSite({
          url: 'https://smugglr.dev',
          name: 'smugglr',
          description:
            'smugglr is a universal SQLite sync engine. Fast, stateless, encrypted. LAN broadcast, S3 relay, and agent-friendly JSON output.',
          locale: 'en-US',
        }),
      }),
    ),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
