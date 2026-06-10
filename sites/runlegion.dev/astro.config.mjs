import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { astroMeta, defineSharedMeta, defineSite } from "@shingle/shared/meta";

// https://astro.build/config
export default defineConfig({
  site: "https://runlegion.dev",
  output: "static",

  integrations: [
    mdx(),
    // Dogfood @rafters/astro-meta for the build-time artifacts: sitemap.xml
    // (replacing @astrojs/sitemap), llms.txt + llms-full.txt (replacing the
    // hand-rolled public files), robots.txt, the Cloudflare _headers
    // Content-Signals policy, and a non-blocking GEO audit. Wired once through
    // @shingle/shared so every site shares one configuration.
    astroMeta(
      defineSharedMeta({
        site: defineSite({
          url: "https://runlegion.dev",
          name: "Legion",
          description:
            "Self-hosted orchestrator for AI coding agents. Memory, coordination, autonomy.",
          locale: "en-US",
        }),
      }),
    ),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
