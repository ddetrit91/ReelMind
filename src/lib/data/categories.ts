import { and, eq, isNull, or, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

import {
  CATEGORY_EMOJI_CHOICES,
  MAX_USER_CATEGORIES,
  USER_CATEGORY_SORT_BASE,
  colorFromSlug,
  isSystemCategorySlug,
  slugifyCategoryName,
} from "@/lib/categories";
import type { CategoryWithCount } from "@/lib/data/items";
import { getDb } from "@/lib/db/client";
import { ensureCategorySchema } from "@/lib/db/ensure-category-schema";
import { categories } from "@/lib/db/schema";
import { useMockData } from "@/lib/env";
import {
  mockCreateCategory,
  mockGetCategories,
  mockGetCategoryBySlug,
} from "@/lib/mock/store";

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  sortOrder: number;
  color: string | null;
  ownerUserId: string | null;
};

export type CreateCategoryInput = {
  userId: string;
  name: string;
  emoji?: string;
};

export type CreateCategoryResult =
  | { ok: true; category: CategoryWithCount }
  | { ok: false; error: string };

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, 48);
}

function normalizeEmoji(emoji: string | undefined): string {
  const value = (emoji ?? "📁").trim().slice(0, 8);
  if (!value) return "📁";
  if ((CATEGORY_EMOJI_CHOICES as readonly string[]).includes(value)) return value;
  // Allow a single custom emoji / short symbol
  if ([...value].length <= 2) return value;
  return "📁";
}

export async function listCategoriesForUser(userId: string): Promise<CategoryRow[]> {
  if (useMockData()) {
    return mockGetCategories().map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      emoji: cat.emoji,
      sortOrder: cat.sortOrder,
      color: cat.color ?? null,
      ownerUserId: cat.ownerUserId ?? null,
    }));
  }

  await ensureCategorySchema();
  const db = getDb();
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      emoji: categories.emoji,
      sortOrder: categories.sortOrder,
      color: categories.color,
      ownerUserId: categories.ownerUserId,
    })
    .from(categories)
    .where(or(isNull(categories.ownerUserId), eq(categories.ownerUserId, userId)))
    .orderBy(categories.sortOrder);
}

export async function getCategoryBySlugForUser(
  userId: string,
  slug: string,
): Promise<CategoryRow | null> {
  if (useMockData()) {
    return mockGetCategoryBySlug(slug);
  }

  await ensureCategorySchema();
  const db = getDb();
  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      emoji: categories.emoji,
      sortOrder: categories.sortOrder,
      color: categories.color,
      ownerUserId: categories.ownerUserId,
    })
    .from(categories)
    .where(
      and(
        eq(categories.slug, slug),
        or(isNull(categories.ownerUserId), eq(categories.ownerUserId, userId)),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function createUserCategory(
  input: CreateCategoryInput,
): Promise<CreateCategoryResult> {
  const name = normalizeName(input.name);
  if (name.length < 2) {
    return { ok: false, error: "Введите название категории (минимум 2 символа)" };
  }

  const emoji = normalizeEmoji(input.emoji);

  if (useMockData()) {
    return mockCreateCategory({ userId: input.userId, name, emoji });
  }

  await ensureCategorySchema();
  const db = getDb();
  const existing = await listCategoriesForUser(input.userId);
  const userOwned = existing.filter((c) => c.ownerUserId === input.userId);
  if (userOwned.length >= MAX_USER_CATEGORIES) {
    return {
      ok: false,
      error: `Можно создать не больше ${MAX_USER_CATEGORIES} своих категорий`,
    };
  }

  const nameTaken = existing.some(
    (c) => c.name.toLowerCase() === name.toLowerCase(),
  );
  if (nameTaken) {
    return { ok: false, error: "Такая категория уже есть" };
  }

  let baseSlug = slugifyCategoryName(name);
  if (isSystemCategorySlug(baseSlug)) {
    baseSlug = `my-${baseSlug}`;
  }

  let slug = baseSlug;
  let attempt = 0;
  while (await slugTakenGlobally(slug)) {
    attempt += 1;
    slug = `${baseSlug}-${attempt + 1}`;
    if (attempt > 30) {
      slug = `${baseSlug}-${randomUUID().slice(0, 6)}`;
      break;
    }
  }

  const color = colorFromSlug(slug);
  const maxUserSort = userOwned.reduce(
    (max, c) => Math.max(max, c.sortOrder),
    USER_CATEGORY_SORT_BASE - 1,
  );
  const sortOrder = Math.min(98, Math.max(USER_CATEGORY_SORT_BASE, maxUserSort + 1));
  const id = `cat-u-${randomUUID()}`;

  await db.insert(categories).values({
    id,
    slug,
    name,
    emoji,
    sortOrder,
    ownerUserId: input.userId,
    color,
  });

  return {
    ok: true,
    category: {
      id,
      slug,
      name,
      emoji,
      sortOrder,
      itemCount: 0,
      color,
      ownerUserId: input.userId,
    },
  };
}

async function slugTakenGlobally(slug: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return Boolean(rows[0]);
}

/** Count helper used by listCategoriesWithCounts filter path. */
export function categoryVisibilitySql(userId: string) {
  return or(isNull(categories.ownerUserId), eq(categories.ownerUserId, userId));
}

export async function countUserOwnedCategories(userId: string): Promise<number> {
  if (useMockData()) {
    return mockGetCategories().filter((c) => c.ownerUserId === userId).length;
  }
  const db = getDb();
  const rows = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(categories)
    .where(eq(categories.ownerUserId, userId));
  return rows[0]?.n ?? 0;
}
