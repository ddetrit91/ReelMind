import { and, eq } from "drizzle-orm";

import { categoryMeta, demoItemId, DEMO_CATALOG } from "@/lib/demo/catalog";
import { getDb } from "@/lib/db/client";
import { items } from "@/lib/db/schema";
import { fetchLinkMetadata } from "@/lib/links/metadata";

export async function ensureDemoItemsForUser(userId: string) {
  const db = getDb();
  const existingCount = await db
    .select({ id: items.id })
    .from(items)
    .where(eq(items.userId, userId))
    .limit(1);
  if (existingCount[0]) return;

  for (const demo of DEMO_CATALOG) {
    const already = await db
      .select({ id: items.id })
      .from(items)
      .where(and(eq(items.userId, userId), eq(items.instagramUrl, demo.url)))
      .limit(1);
    if (already[0]) continue;

    let thumbnailUrl = demo.thumbnailUrl;
    let title = demo.title;
    let caption = demo.caption;
    try {
      const meta = await fetchLinkMetadata(demo.url, demo.sourceKind, demo.shareText);
      thumbnailUrl = meta.thumbnailUrl || thumbnailUrl;
      title = meta.title || title;
      caption = meta.caption || caption;
    } catch {
      // keep fallbacks
    }

    const cat = categoryMeta(demo.categorySlug);
    const now = new Date().toISOString();
    await db.insert(items).values({
      id: demoItemId(userId, demo.key),
      userId,
      instagramUrl: demo.url,
      sourceKind: demo.sourceKind,
      mediaKind: demo.mediaKind,
      contentType: demo.contentType,
      shareText: demo.shareText,
      caption,
      title,
      thumbnailUrl,
      categoryId: cat.id,
      aiTags: demo.tags,
      aiSummary: demo.summary,
      classificationConfidence: 0.9,
      status: "ready",
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    });
  }
}
