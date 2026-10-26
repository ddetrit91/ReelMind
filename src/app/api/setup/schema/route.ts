import { NextResponse } from "next/server";

import { ensureCategorySchema } from "@/lib/db/ensure-category-schema";
import { createClient } from "@libsql/client";

/** Idempotent schema fix for prod Turso (categories.color / owner_user_id). */
export async function POST() {
  try {
    await ensureCategorySchema();
    const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
    const client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    });
    const info = await client.execute("PRAGMA table_info(categories)");
    client.close();
    const columns = info.rows.map((row) => String(row.name));
    return NextResponse.json({ ok: true, columns });
  } catch (err) {
    const message = err instanceof Error ? err.message : "schema ensure failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
