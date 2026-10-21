import type { ItemWithCategory } from "@/lib/data/items";

const KEYWORD_MIN_SCORE = 0.12;

/** Fields used for keyword matching (safe for client + server). */
export function itemSearchDocument(item: ItemWithCategory): string {
  return [
    item.title,
    item.aiSummary,
    item.shareText,
    item.caption,
    item.categoryName,
    item.categorySlug,
    item.sourceKind,
    item.sourceUrl,
    ...(item.aiTags ?? []),
  ]
    .filter(Boolean)
    .join("\n");
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ")
    .trim();
}

function queryTokens(query: string): string[] {
  return normalize(query)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 2);
}

/** Score match by words/phrase (0–1). */
export function keywordSearchScore(query: string, item: ItemWithCategory): number {
  const q = normalize(query);
  if (!q) return 0;

  const haystack = normalize(itemSearchDocument(item));
  if (!haystack) return 0;

  let score = 0;

  if (haystack.includes(q)) {
    score += 0.55;
  }

  const tokens = queryTokens(q);
  if (tokens.length === 0) return score;

  let matched = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) matched += 1;
  }
  score += (matched / tokens.length) * 0.45;

  const titleHay = normalize(item.title ?? "");
  const summaryHay = normalize(item.aiSummary ?? "");
  for (const token of tokens) {
    if (titleHay.includes(token)) score += 0.08;
    if (summaryHay.includes(token)) score += 0.05;
  }

  return Math.min(1, score);
}

/** Instant keyword filter — no network / AI. */
export function filterItemsByKeyword(
  items: ItemWithCategory[],
  query?: string,
): ItemWithCategory[] {
  const q = query?.trim();
  if (!q) return items;

  return items
    .map((item) => ({ item, score: keywordSearchScore(q, item) }))
    .filter(({ score }) => score >= KEYWORD_MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}
