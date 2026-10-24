// mock: replace with API when USE_MOCK_DATA=false
import { randomUUID } from "crypto";

import {
  CATEGORY_SEED,
  MAX_USER_CATEGORIES,
  USER_CATEGORY_SORT_BASE,
  colorFromSlug,
  isSystemCategorySlug,
  slugifyCategoryName,
} from "@/lib/categories";
import type { CategoryWithCount, ItemWithCategory } from "@/lib/data/items";
import type { IngestResult } from "@/lib/ingest/process-ingest";
import { parseSourceUrl } from "@/lib/links/parse-url";
import { MOCK_ITEMS } from "@/lib/mock/items";
import { demoThumbnailUrl } from "@/lib/thumbnails";

let memoryItems: ItemWithCategory[] = [...MOCK_ITEMS];
let memoryCategories: CategoryWithCount[] = CATEGORY_SEED.map((cat) => ({
  ...cat,
  itemCount: 0,
  color: cat.color,
  ownerUserId: null,
}));

function syncCounts(userId?: string): CategoryWithCount[] {
  return memoryCategories
    .filter((cat) => !cat.ownerUserId || (userId != null && cat.ownerUserId === userId))
    .map((cat) => ({
      ...cat,
      itemCount: memoryItems.filter((i) => i.categorySlug === cat.slug).length,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function mockGetCategories(userId?: string): CategoryWithCount[] {
  return syncCounts(userId);
}

export function mockGetCategoryBySlug(slug: string) {
  const cat = memoryCategories.find((c) => c.slug === slug);
  if (!cat) return null;
  return {
    id: cat.id,
    slug: cat.slug,
    name: cat.name,
    emoji: cat.emoji,
    sortOrder: cat.sortOrder,
    color: cat.color ?? null,
    ownerUserId: cat.ownerUserId ?? null,
  };
}

export function mockCreateCategory(input: {
  userId: string;
  name: string;
  emoji: string;
}): { ok: true; category: CategoryWithCount } | { ok: false; error: string } {
  const owned = memoryCategories.filter((c) => c.ownerUserId === input.userId);
  if (owned.length >= MAX_USER_CATEGORIES) {
    return {
      ok: false,
      error: `Можно создать не больше ${MAX_USER_CATEGORIES} своих категорий`,
    };
  }
  if (
    memoryCategories.some(
      (c) =>
        (!c.ownerUserId || c.ownerUserId === input.userId) &&
        c.name.toLowerCase() === input.name.toLowerCase(),
    )
  ) {
    return { ok: false, error: "Такая категория уже есть" };
  }

  let baseSlug = slugifyCategoryName(input.name);
  if (isSystemCategorySlug(baseSlug)) baseSlug = `my-${baseSlug}`;
  let slug = baseSlug;
  let n = 1;
  while (memoryCategories.some((c) => c.slug === slug)) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }

  const maxSort = owned.reduce(
    (max, c) => Math.max(max, c.sortOrder),
    USER_CATEGORY_SORT_BASE - 1,
  );
  const category: CategoryWithCount = {
    id: `cat-u-${randomUUID()}`,
    slug,
    name: input.name,
    emoji: input.emoji,
    sortOrder: Math.min(98, maxSort + 1),
    itemCount: 0,
    color: colorFromSlug(slug),
    ownerUserId: input.userId,
  };
  memoryCategories = [...memoryCategories, category];
  return { ok: true, category };
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
    memoryCategories.find((c) => c.slug === categorySlug) ??
    memoryCategories.find((c) => c.slug === "other")!;
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
  const cat = memoryCategories.find((c) => c.slug === categorySlug);
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
