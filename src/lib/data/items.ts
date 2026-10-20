import { and, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { categories, items } from "@/lib/db/schema";
import { useMockData } from "@/lib/env";
import type { SourceKind } from "@/lib/links/parse-url";
import { mockGetCategories, mockGetItem, mockListItems } from "@/lib/mock/store";

export type ItemWithCategory = {
  id: string;
  sourceUrl: string;
  sourceKind: SourceKind;
  mediaKind: string;
  contentType: string;
  shareText: string | null;
  caption: string | null;
  title: string | null;
  thumbnailUrl: string | null;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  categoryEmoji: string;
  aiTags: string[];
  aiSummary: string | null;
  classificationConfidence: number | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CategoryWithCount = {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  sortOrder: number;
  itemCount: number;
};

function mapItem(row: {
  item: typeof items.$inferSelect;
  category: typeof categories.$inferSelect;
}): ItemWithCategory {
  return {
    id: row.item.id,
    sourceUrl: row.item.instagramUrl,
    sourceKind: (row.item.sourceKind as SourceKind) || "other",
    mediaKind: row.item.mediaKind,
    contentType: row.item.contentType,
    shareText: row.item.shareText,
    caption: row.item.caption,
    title: row.item.title,
    thumbnailUrl: row.item.thumbnailUrl,
    categoryId: row.item.categoryId,
    categorySlug: row.category.slug,
    categoryName: row.category.name,
    categoryEmoji: row.category.emoji,
    aiTags: row.item.aiTags ?? [],
    aiSummary: row.item.aiSummary,
    classificationConfidence: row.item.classificationConfidence,
    status: row.item.status,
    errorMessage: row.item.errorMessage,
    createdAt: row.item.createdAt,
    updatedAt: row.item.updatedAt,
  };
}

export async function listCategoriesWithCounts(userId: string): Promise<CategoryWithCount[]> {
  if (useMockData()) return mockGetCategories();

  const db = getDb();
  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      emoji: categories.emoji,
      sortOrder: categories.sortOrder,
      itemCount: sql<number>`count(${items.id})`.mapWith(Number),
    })
    .from(categories)
    .leftJoin(items, and(eq(items.categoryId, categories.id), eq(items.userId, userId)))
    .groupBy(categories.id)
    .orderBy(categories.sortOrder);

  return rows;
}

export async function listItems(
  userId: string,
  categorySlug?: string,
): Promise<ItemWithCategory[]> {
  if (useMockData()) return mockListItems(categorySlug);

  const db = getDb();
  const conditions = [eq(items.userId, userId)];
  if (categorySlug) conditions.push(eq(categories.slug, categorySlug));

  const rows = await db
    .select({ item: items, category: categories })
    .from(items)
    .innerJoin(categories, eq(items.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(items.createdAt));

  return rows.map(mapItem);
}

export async function getItemById(
  id: string,
  userId: string,
): Promise<ItemWithCategory | null> {
  if (useMockData()) return mockGetItem(id);

  const db = getDb();
  const rows = await db
    .select({ item: items, category: categories })
    .from(items)
    .innerJoin(categories, eq(items.categoryId, categories.id))
    .where(and(eq(items.id, id), eq(items.userId, userId)))
    .limit(1);

  if (!rows[0]) return null;
  return mapItem(rows[0]);
}

export async function updateItemCategory(
  id: string,
  categorySlug: string,
  userId: string,
): Promise<ItemWithCategory | null> {
  if (useMockData()) {
    const { mockUpdateCategory } = await import("@/lib/mock/store");
    return mockUpdateCategory(id, categorySlug);
  }

  const db = getDb();
  const cat = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1);

  if (!cat[0]) return null;

  const owned = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.id, id), eq(items.userId, userId)))
    .limit(1);

  if (!owned[0]) return null;

  await db
    .update(items)
    .set({
      categoryId: cat[0].id,
      updatedAt: new Date().toISOString(),
      status: "ready",
    })
    .where(and(eq(items.id, id), eq(items.userId, userId)));

  return getItemById(id, userId);
}

export async function deleteItem(id: string, userId: string): Promise<boolean> {
  if (useMockData()) {
    const { mockDeleteItem } = await import("@/lib/mock/store");
    return mockDeleteItem(id);
  }

  const db = getDb();
  const owned = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.id, id), eq(items.userId, userId)))
    .limit(1);

  if (!owned[0]) return false;

  await db.delete(items).where(and(eq(items.id, id), eq(items.userId, userId)));
  return true;
}
