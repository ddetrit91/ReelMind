// mock: replace with API when USE_MOCK_DATA=false
import { randomUUID } from "crypto";

import { CATEGORY_SEED } from "@/lib/categories";
import type { CategoryWithCount, ItemWithCategory } from "@/lib/data/items";
import type { IngestResult } from "@/lib/ingest/process-ingest";
import { parseSourceUrl } from "@/lib/links/parse-url";
import { MOCK_ITEMS } from "@/lib/mock/items";
import { demoThumbnailUrl } from "@/lib/thumbnails";

let memoryItems: ItemWithCategory[] = [...MOCK_ITEMS];

export function mockGetCategories(): CategoryWithCount[] {
  return CATEGORY_SEED.map((cat) => ({
    ...cat,
    itemCount: memoryItems.filter((i) => i.categorySlug === cat.slug).length,
  }));
}

export function mockListItems(categorySlug?: string): ItemWithCategory[] {
  const sorted = [...memoryItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  if (!categorySlug) return sorted;
  return sorted.filter((i) => i.categorySlug === categorySlug);
}

export function mockGetItem(id: string): ItemWithCategory | null {
  return memoryItems.find((i) => i.id === id) ?? null;
}

export function mockIngestItem(url: string, text?: string, categorySlug?: string): IngestResult {
  const parsed = parseSourceUrl(url);
  const existing = memoryItems.find((i) => i.sourceUrl === parsed.normalizedUrl);
  if (existing) {
    return {
      ok: true,
      id: existing.id,
      categorySlug: existing.categorySlug,
      duplicate: true,
    };
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  const cat =
    CATEGORY_SEED.find((c) => c.slug === categorySlug) ??
    CATEGORY_SEED.find((c) => c.slug === "other")!;
  const item: ItemWithCategory = {
    id,
    sourceUrl: parsed.normalizedUrl,
    sourceKind: parsed.sourceKind,
    mediaKind: parsed.mediaKind,
    contentType: parsed.contentType,
    shareText: text ?? null,
    caption: text ?? null,
    title: parsed.host,
    thumbnailUrl: demoThumbnailUrl(id),
    categoryId: cat.id,
    categorySlug: cat.slug,
    categoryName: cat.name,
    categoryEmoji: cat.emoji,
    aiTags: ["mock"],
    aiSummary: text?.slice(0, 120) ?? "Mock-сохранение без LLM.",
    classificationConfidence: 0.5,
    status: "ready",
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  };

  memoryItems = [item, ...memoryItems];
  return { ok: true, id, categorySlug: item.categorySlug };
}

export function mockUpdateCategory(
  id: string,
  categorySlug: string,
): ItemWithCategory | null {
  const cat = CATEGORY_SEED.find((c) => c.slug === categorySlug);
  if (!cat) return null;

  memoryItems = memoryItems.map((item) =>
    item.id === id
      ? {
          ...item,
          categoryId: cat.id,
          categorySlug: cat.slug,
          categoryName: cat.name,
          categoryEmoji: cat.emoji,
          updatedAt: new Date().toISOString(),
        }
      : item,
  );

  return mockGetItem(id);
}

export function mockDeleteItem(id: string): boolean {
  const existed = memoryItems.some((item) => item.id === id);
  memoryItems = memoryItems.filter((item) => item.id !== id);
  return existed;
}
