import type { ItemWithCategory } from "@/lib/data/items";
import {
  filterItemsByKeyword,
  itemSearchDocument,
  keywordSearchScore,
} from "@/lib/search/keyword-search";

export { itemSearchDocument, keywordSearchScore, filterItemsByKeyword };

/**
 * Catalog search hot path: keyword-only (milliseconds).
 * Semantic/AI ranking is intentionally off the default path — it added multi-second latency.
 */
export async function searchItems(
  items: ItemWithCategory[],
  query?: string,
): Promise<ItemWithCategory[]> {
  return filterItemsByKeyword(items, query);
}
