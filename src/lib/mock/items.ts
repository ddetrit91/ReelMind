// mock: replace with GET /api/items
import { categoryMeta, DEMO_CATALOG } from "@/lib/demo/catalog";
import type { ItemWithCategory } from "@/lib/data/items";

export const MOCK_ITEMS: ItemWithCategory[] = DEMO_CATALOG.map((demo, index) => {
  const cat = categoryMeta(demo.categorySlug);
  const created = new Date(Date.now() - 3600000 * (DEMO_CATALOG.length - index)).toISOString();
  return {
    id: demo.key,
    sourceKind: demo.sourceKind,
    sourceUrl: demo.url,
    mediaKind: demo.mediaKind,
    contentType: demo.contentType,
    shareText: demo.shareText,
    caption: demo.caption,
    title: demo.title,
    thumbnailUrl: demo.thumbnailUrl,
    categoryId: cat.id,
    categorySlug: cat.slug,
    categoryName: cat.name,
    categoryEmoji: cat.emoji,
    aiTags: demo.tags,
    aiSummary: demo.summary,
    classificationConfidence: 0.9,
    status: "ready",
    errorMessage: null,
    createdAt: created,
    updatedAt: created,
  };
});
