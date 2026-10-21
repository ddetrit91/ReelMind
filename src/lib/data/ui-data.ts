import {
  listCategoriesWithCounts as listCategoriesDb,
  listItems as listItemsDb,
  getItemById as getItemByIdDb,
} from "@/lib/data/items";
import { clearDemoItemsForUser } from "@/lib/demo/ensure-demo-items";
import { useMockData } from "@/lib/env";
import {
  mockGetCategories,
  mockGetItem,
  mockListItems,
} from "@/lib/mock/store";

const demosCleared = new Set<string>();

/**
 * Catalog data for home: one parallel round-trip (categories + items).
 * Seeded demos are removed once per user (not re-created on auth).
 */
export async function getCatalogForUi(
  userId: string,
  categorySlug?: string,
  query?: string,
) {
  if (!useMockData() && !demosCleared.has(userId)) {
    await clearDemoItemsForUser(userId);
    demosCleared.add(userId);
  }

  const [categories, items] = await Promise.all([
    useMockData() ? Promise.resolve(mockGetCategories()) : listCategoriesDb(userId),
    useMockData()
      ? Promise.resolve(mockListItems(categorySlug))
      : listItemsDb(userId, categorySlug),
  ]);

  if (!query?.trim()) {
    return { categories, items };
  }

  const { searchItems } = await import("@/lib/search/item-search");
  return { categories, items: await searchItems(items, query) };
}

export async function getCategoriesForUi(userId: string) {
  if (useMockData()) return mockGetCategories();
  return listCategoriesDb(userId);
}

export async function getItemsForUi(userId: string, categorySlug?: string, query?: string) {
  const base = useMockData()
    ? mockListItems(categorySlug)
    : await listItemsDb(userId, categorySlug);
  if (!query?.trim()) return base;
  const { searchItems } = await import("@/lib/search/item-search");
  return searchItems(base, query);
}

export async function getItemForUi(id: string, userId: string) {
  if (useMockData()) return mockGetItem(id);
  return getItemByIdDb(id, userId);
}
