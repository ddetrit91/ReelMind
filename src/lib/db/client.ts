import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

import * as schema from "./schema";

let client: Client | null = null;
let database: LibSQLDatabase<typeof schema> | null = null;

export function getDb(): LibSQLDatabase<typeof schema> {
  if (database) return database;

  const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (process.env.VERCEL === "1" && url.startsWith("file:")) {
    throw new Error(
      "On Vercel set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to your Turso database. file:local.db is for local dev only.",
    );
  }
  if (process.env.VERCEL === "1" && !authToken?.trim()) {
    throw new Error("On Vercel set TURSO_AUTH_TOKEN from Turso (turso db tokens create).");
  }

  client = createClient({
    url,
    authToken: authToken || undefined,
  });

  database = drizzle(client, { schema });
  return database;
}
