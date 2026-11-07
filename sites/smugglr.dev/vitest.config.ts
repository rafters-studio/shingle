import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const at = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

// The tsconfig path aliases, so a unit test can import a component's behavior
// and classes the way the site does.
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/lib\//, replacement: at("./src/lib/") },
      { find: /^@\/components\//, replacement: at("./src/components/") },
      { find: /^@\//, replacement: at("./") },
    ],
  },
});
