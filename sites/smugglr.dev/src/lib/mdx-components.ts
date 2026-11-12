import WrapPre from "@/components/wrap-pre.astro";

/**
 * Element-to-component map for MDX pages: a markdown code fence renders as
 * WrapPre, so it wraps instead of scrolling. A page opts in with
 * `export const components = mdxComponents;`.
 */
export const mdxComponents = { pre: WrapPre };
