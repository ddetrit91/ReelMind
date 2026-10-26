import { createClient } from "@libsql/client";

let ensurePromise: Promise<void> | null = null;

/**
 * Prod Turso may lag behind schema.ts after deploy.
 * Missing categories.color / owner_user_id caused RSC #441 on catalog.
 * Idempotent ALTER — safe on every cold start.
 */
export function ensureCategorySchema(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = runEnsure().catch((err) => {
      ensurePromise = null;
      throw err;
    });
  }
  return ensurePromise;
}

async function runEnsure(): Promise<void> {
  const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (process.env.VERCEL === "1" && (url.startsWith("file:") || !authToken?.trim())) {
    return;
  }

  const client = createClient({
    url,
    authToken: authToken || undefined,
  });

  try {
    const info = await client.execute("PRAGMA table_info(categories)");
    const names = new Set(info.rows.map((row) => String(row.name)));

    if (!names.has("owner_user_id")) {
      await client.execute(
        "ALTER TABLE categories ADD COLUMN owner_user_id TEXT REFERENCES users(id)",
      );
    }
    if (!names.has("color")) {
      await client.execute("ALTER TABLE categories ADD COLUMN color TEXT");
    }

    try {
      await client.execute(
        "CREATE INDEX IF NOT EXISTS categories_owner_idx ON categories(owner_user_id)",
      );
    } catch {
      // index may already exist under another name
    }
  } finally {
    client.close();
  }
}
