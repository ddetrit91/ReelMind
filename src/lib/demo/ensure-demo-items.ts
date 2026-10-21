import { and, eq, like } from "drizzle-orm";

import { categoryMeta, demoItemId, DEMO_CATALOG } from "@/lib/demo/catalog";
import { getDb } from "@/lib/db/client";
import { items } from "@/lib/db/schema";

/** In-process guard for optional seeding (db:seed only). */
const seededUsers = new Set<string>();

/**
 * Optional demo fill for empty catalogs (used by `npm run db:seed` only).
 * Not called on login/register anymore.
 */
export async function ensureDemoItemsForUser(userId: string) {
  if (seededUsers.has(userId)) return;

  const db = getDb();
  const existing = await db
    .select({ id: items.id })
    .from(items)
    .where(eq(items.userId, userId))
    .limit(1);

  if (existing[0]) {
    seededUsers.add(userId);
    return;
  }

  const now = new Date().toISOString();
  await db.insert(items).values(
    DEMO_CATALOG.map((demo) => {
      const cat = categoryMeta(demo.categorySlug);
      return {
        id: demoItemId(userId, demo.key),
        userId,
        instagramUrl: demo.url,
        sourceKind: demo.sourceKind,
        mediaKind: demo.mediaKind,
        contentType: demo.contentType,
        shareText: demo.shareText,
        caption: demo.caption,
        title: demo.title,
        thumbnailUrl: demo.thumbnailUrl,
        categoryId: cat.id,
        aiTags: demo.tags,
        aiSummary: demo.summary,
        classificationConfidence: 0.9,
        status: "ready" as const,
        errorMessage: null,
        createdAt: now,
        updatedAt: now,
      };
    }),
  );

  seededUsers.add(userId);
}

/** Removes seeded demo rows (`demo-*:…`) for this user. Real saves are kept. */
export async function clearDemoItemsForUser(userId: string) {
  const db = getDb();
  await db
    .delete(items)
    .where(and(eq(items.userId, userId), like(items.id, "demo-%")));
  seededUsers.delete(userId);
}
