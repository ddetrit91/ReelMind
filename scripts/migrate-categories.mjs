import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@libsql/client";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
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
