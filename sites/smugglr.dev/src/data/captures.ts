// Captured blocks from smugglr's docs/examples, verbatim. Each constant is a
// fenced block of the named example README on the main branch; the site
// copies, it never types. They live here rather than inline in the .astro
// template because a summary line that begins with "---" is read by the
// linter as a frontmatter fence.

// docs/examples/cli-sqlite-to-sqlite/README.md, block 1
export const SQLITE_CONFIG = "local_db = \"./local.db\"\n\n[target]\ntype = \"sqlite\"\ndatabase = \"./backup.db\"\n\n[sync]\ntables = []\ntimestamp_column = \"updated_at\"\nconflict_resolution = \"local_wins\"";

// docs/examples/cli-sqlite-to-sqlite/README.md, block 2
export const SQLITE_DRY_RUN = "$ smugglr push --dry-run\n--- Push Summary ---\n  order_details: 788 rows\n  suppliers: 8 rows\n  employees: 9 rows\n  shippers: 3 rows\n  categories: 8 rows\n  products: 20 rows\n  customers: 40 rows\n  orders: 320 rows\n\n  (dry run - no actual changes made)";

// docs/examples/cli-sqlite-to-sqlite/README.md, block 3
export const SQLITE_PUSH = "$ smugglr push\n--- Push Summary ---\n  suppliers: 8 rows\n  products: 20 rows\n  employees: 9 rows\n  customers: 40 rows\n  order_details: 788 rows\n  categories: 8 rows\n  orders: 320 rows\n  shippers: 3 rows";

// docs/examples/cli-http-sql-turso/README.md, block 1
export const TURSO_CONFIG = "local_db = \"./local.db\"\n\n[target]\ntype = \"plugin\"\nname = \"http-sql\"\n\n[target.config]\nprofile = \"turso\"\nurl = \"https://my-db.turso.io\"\nauth_token = \"${TURSO_TOKEN}\"";
