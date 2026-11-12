/// <reference types="astro/client" />

// tsc alone does not resolve .astro imports from .ts files; astro-check does.
declare module "*.astro" {
  const component: (props: Record<string, unknown>) => unknown;
  export default component;
}
