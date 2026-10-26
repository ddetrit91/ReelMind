import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@libsql/client";

// Prefer already-injected env (e.g. `vercel env run -e production`).
// Local files only fill gaps — do not override real Turso URL with file:local.db.
if (!process.env.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL.startsWith("file:")) {
  config({ path: resolve(process.cwd(), ".env.vercel.production"), override: false });
}
config({ path: resolve(process.cwd(), ".env.local"), override: false });
config({ path: resolve(process.cwd(), ".env"), override: false });

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
if (url.startsWith("file:")) {
  console.warn(
    "WARNING: using file DB. For prod Turso set TURSO_DATABASE_URL/TURSO_AUTH_TOKEN or run via vercel env with decrypted secrets.",
  );
}
console.log("migrating:", url.startsWith("libsql:") ? "libsql (cloud)" : url);
const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

async function ensureColumn(name, sql) {
  const info = await client.execute("PRAGMA table_info(categories)");
  const has = info.rows.some((row) => row.name === name);
  if (has) {
    console.log(`column ${name}: already exists`);
    return;
  }
  await client.execute(sql);
  console.log(`column ${name}: added`);
}

await ensureColumn(
  "owner_user_id",
  "ALTER TABLE categories ADD COLUMN owner_user_id TEXT REFERENCES users(id)",
);
await ensureColumn("color", "ALTER TABLE categories ADD COLUMN color TEXT");

try {
  await client.execute(
    "CREATE INDEX IF NOT EXISTS categories_owner_idx ON categories(owner_user_id)",
  );
  console.log("index categories_owner_idx: ok");
} catch (err) {
  console.log("index", err);
}

const info = await client.execute("PRAGMA table_info(categories)");
console.log(
  "columns:",
  info.rows.map((r) => r.name).join(", "),
);
