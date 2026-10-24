import { Hono } from "hono";
import { z } from "zod";

import { createUserCategory } from "@/lib/data/categories";
import { deleteItem, getItemById, listCategoriesWithCounts, listItems, updateItemCategory } from "@/lib/data/items";
import { assertIngestAuthorized } from "@/lib/env";
import { processIngest } from "@/lib/ingest/process-ingest";
import { getCurrentUser } from "@/lib/auth/session";
import type { ApiEnv } from "@/server/hono/auth";
import { requireUserMw } from "@/server/hono/auth";
import { revalidateCatalog } from "@/server/hono/revalidate";

const catalog = new Hono<ApiEnv>();

/** One auth + parallel DB read for client catalog refresh. */
catalog.get("/catalog", requireUserMw, async (c) => {
  const user = c.get("user");
  const [categories, items] = await Promise.all([
    listCategoriesWithCounts(user.id),
    listItems(user.id),
  ]);
  return c.json({ categories, items }, 200, {
    "Cache-Control": "private, no-store",
  });
});

catalog.get("/categories", requireUserMw, async (c) => {
  const user = c.get("user");
  const categories = await listCategoriesWithCounts(user.id);
  return c.json({ categories });
});

const createCategorySchema = z.object({
  name: z.string().min(2).max(48),
  emoji: z.string().max(8).optional(),
});

catalog.post("/categories", requireUserMw, async (c) => {
  const user = c.get("user");
  let body: z.infer<typeof createCategorySchema>;
  try {
    body = createCategorySchema.parse(await c.req.json());
  } catch {
    return c.json({ error: "Укажите название категории" }, 400);
  }

  const result = await createUserCategory({
    userId: user.id,
    name: body.name,
    emoji: body.emoji,
  });
  if (!result.ok) {
    return c.json({ error: result.error }, 400);
  }

  revalidateCatalog();
  return c.json({ category: result.category }, 201);
});

catalog.get("/items", requireUserMw, async (c) => {
  const user = c.get("user");
  const category = c.req.query("category") || undefined;
  const q = c.req.query("q")?.trim() || undefined;
  const base = await listItems(user.id, category);
  if (!q) {
    return c.json({ items: base }, 200, {
      "Cache-Control": "private, no-store",
    });
  }
  const { searchItems } = await import("@/lib/search/item-search");
  const items = await searchItems(base, q);
  return c.json({ items }, 200, {
    "Cache-Control": "private, no-store",
  });
});

catalog.get("/items/:id", requireUserMw, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Not found" }, 404);
  const item = await getItemById(id, user.id);
  if (!item) return c.json({ error: "Not found" }, 404);
  return c.json({ item });
});

const patchSchema = z.object({
  categorySlug: z.string().min(1),
});

catalog.patch("/items/:id", requireUserMw, async (c) => {
  const user = c.get("user");
  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await c.req.json());
  } catch {
    return c.json({ error: "Invalid body" }, 400);
  }
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Not found" }, 404);
  const item = await updateItemCategory(id, body.categorySlug, user.id);
  if (!item) return c.json({ error: "Not found" }, 404);
  revalidateCatalog();
  return c.json({ item });
});

catalog.delete("/items/:id", requireUserMw, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Not found" }, 404);
  const deleted = await deleteItem(id, user.id);
  if (!deleted) return c.json({ error: "Not found" }, 404);
  revalidateCatalog();
  return c.json({ ok: true });
});

const ingestSchema = z.object({
  url: z.string().optional(),
  text: z.string().optional(),
  categorySlug: z.string().optional(),
});

catalog.post("/items/ingest", async (c) => {
  const user = await getCurrentUser();
  const secret = c.req.header("x-ingest-secret") ?? null;
  if (!user && !assertIngestAuthorized(secret)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (!user) {
    return c.json({ error: "Нужно войти в аккаунт" }, 401);
  }

  let body: z.infer<typeof ingestSchema>;
  try {
    body = ingestSchema.parse(await c.req.json());
  } catch {
    return c.json({ error: "Invalid body" }, 400);
  }

  const result = await processIngest({ ...body, userId: user.id });
  if (!result.ok) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({
    id: result.id,
    categorySlug: result.categorySlug,
    duplicate: result.duplicate ?? false,
  });
});

export { catalog };
