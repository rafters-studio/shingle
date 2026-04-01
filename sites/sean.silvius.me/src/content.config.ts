import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    tags: z.array(z.string()).optional().default([]),
    author: z.object({
      name: z.string(),
      picture: z.string().optional(),
    }),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    archived: z.boolean().default(false),
    // Keep slug in frontmatter for backwards compat, but Astro will use filename
    slug: z.string().optional(),
  }),
});

const nightShift = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/night-shift" }),
  schema: z
    .object({
      title: z.string(),
      agent: z.string(),
      date: z.coerce.date(),
      excerpt: z.string(),
      visibility: z.enum(["public", "team", "private"]).default("team"),
      featured_by: z.array(z.string()).default([]),
      awards: z
        .array(z.enum(["best-musing", "best-thread", "best-new-word", "best-one-liner"]))
        .default([]),
      tags: z.array(z.string()).default([]),
      contains_sensitive: z.boolean().default(false),
      responds_to: z.string().optional(),
      published: z.boolean().default(false),
    })
    .refine((data) => !(data.contains_sensitive && data.visibility === "public"), {
      message: "Sensitive musings cannot have public visibility",
      path: ["visibility"],
    }),
});

const stories = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/stories" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    campaign: z.string().optional(),
    session: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, nightShift, stories };
