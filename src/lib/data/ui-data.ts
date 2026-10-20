import {
  listCategoriesWithCounts as listCategoriesDb,
  listItems as listItemsDb,
  getItemById as getItemByIdDb,
} from "@/lib/data/items";
import { useMockData } from "@/lib/env";
import {
  mockGetCategories,
  mockGetItem,
  mockListItems,
} from "@/lib/mock/store";

export async function getCategoriesForUi(userId: string) {
  if (useMockData()) return mockGetCategories();
  const { ensureDemoItemsForUser } = await import("@/lib/demo/ensure-demo-items");
  await ensureDemoItemsForUser(userId);
  return listCategoriesDb(userId);
}

export async function getItemsForUi(userId: string, categorySlug?: string, query?: string) {
  const { searchItems } = await import("@/lib/search/item-search");
  if (!useMockData()) {
    const { ensureDemoItemsForUser } = await import("@/lib/demo/ensure-demo-items");
    await ensureDemoItemsForUser(userId);
  }
  const base = useMockData()
    ? mockListItems(categorySlug)
    : await listItemsDb(userId, categorySlug);
  return searchItems(base, query);
}

export async function getItemForUi(id: string, userId: string) {
  if (useMockData()) return mockGetItem(id);
  return getItemByIdDb(id, userId);
}
