import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import type { ApiEnv } from "@/server/hono/auth";
import { admin } from "@/server/hono/routes/admin";
import { catalog } from "@/server/hono/routes/catalog";

/**
 * Fast API layer via Hono (mounted at /api/*).
 * Lightweight router + shared handlers; domain logic stays in src/lib.
 */
const app = new Hono<ApiEnv>().basePath("/api");

app.get("/health", (c) =>
  c.json({ ok: true, service: "reelmind", runtime: "hono" }, 200, {
    "Cache-Control": "no-store",
  }),
);

app.route("/", catalog);
app.route("/admin", admin);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error("[hono]", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

export { app };
export type AppType = typeof app;
