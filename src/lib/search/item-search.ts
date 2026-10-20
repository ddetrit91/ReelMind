import { embed, embedMany, generateObject } from "ai";
import { z } from "zod";

import { getChatModel, getEmbeddingModel } from "@/lib/ai/client";
import type { ItemWithCategory } from "@/lib/data/items";

const SEMANTIC_MAX_ITEMS = 120;
const SEMANTIC_MIN_SCORE = 0.32;
const KEYWORD_MIN_SCORE = 0.12;
const COMBINED_MIN_SCORE = 0.2;

/** Поля, по которым ищем: ключевые слова, описание, теги, категория. */
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

/** Оценка совпадения по словам и фразе (0–1). */
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

function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i += 1) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function expandQueryTerms(query: string): Promise<string[]> {
  const model = getChatModel();
  if (!model) return [];

  try {
    const { object } = await generateObject({
      model,
      schema: z.object({
        terms: z.array(z.string()).max(12),
      }),
      system:
        "Ты помощник поиска по личным закладкам. Верни короткие синонимы и близкие понятия на русском и английском. Без предложений.",
      prompt: `Запрос: ${query}`,
    });
    return object.terms.map((term) => term.trim()).filter((term) => term.length >= 2);
  } catch {
    return [];
  }
}

async function semanticScores(
  query: string,
  items: ItemWithCategory[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (items.length === 0) return map;

  const slice = items.slice(0, SEMANTIC_MAX_ITEMS);
  const embeddingModel = getEmbeddingModel();

  if (embeddingModel) {
    try {
      const [{ embedding: queryVector }, { embeddings }] = await Promise.all([
        embed({ model: embeddingModel, value: query }),
        embedMany({
          model: embeddingModel,
          values: slice.map((item) => itemSearchDocument(item) || item.title || item.id),
        }),
      ]);

      slice.forEach((item, index) => {
        const vector = embeddings[index];
        if (!vector) return;
        map.set(item.id, cosineSimilarity(queryVector, vector));
      });
      if (map.size > 0) return map;
    } catch (err) {
      console.error("Embedding search failed, trying Gemini ranking", err);
    }
  }

  const chat = getChatModel();
  if (!chat) return map;

  try {
    const catalog = slice
      .map(
        (item) =>
          `${item.id} | ${item.categoryName} | ${item.title ?? ""} | ${item.aiSummary ?? ""} | ${(item.aiTags ?? []).join(", ")}`,
      )
      .join("\n");

    const { object } = await generateObject({
      model: chat,
      schema: z.object({
        matches: z.array(
          z.object({
            id: z.string(),
            score: z.number().min(0).max(1),
          }),
        ),
      }),
      system:
        "Ты семантический поиск по каталогу закладок. Оцени смысл запроса, не только точные слова. Верни id релевантных записей и score 0–1. Пропускай явно посторонние.",
      prompt: `Запрос: ${query}\n\nКаталог:\n${catalog}`,
    });

    for (const match of object.matches) {
      if (slice.some((item) => item.id === match.id)) {
        map.set(match.id, match.score);
      }
    }
  } catch (err) {
    console.error("Gemini ranking search failed", err);
  }

  return map;
}

export type SearchRankedItem = {
  item: ItemWithCategory;
  keywordScore: number;
  semanticScore: number;
  score: number;
};

export async function rankItemsForSearch(
  items: ItemWithCategory[],
  query: string,
): Promise<SearchRankedItem[]> {
  const q = query.trim();
  if (!q) {
    return items.map((item) => ({
      item,
      keywordScore: 0,
      semanticScore: 0,
      score: 0,
    }));
  }

  const [semantic, extraTerms] = await Promise.all([semanticScores(q, items), expandQueryTerms(q)]);
  const hasSemantic = semantic.size > 0;
  const expandedQuery = [q, ...extraTerms].join(" ");

  const ranked = items.map((item) => {
    const keywordScore = Math.max(
      keywordSearchScore(q, item),
      extraTerms.length > 0 ? keywordSearchScore(expandedQuery, item) * 0.85 : 0,
    );
    const semanticScore = semantic.get(item.id) ?? 0;
    const score = hasSemantic
      ? Math.max(keywordScore, semanticScore * 0.85 + keywordScore * 0.35)
      : keywordScore;

    return { item, keywordScore, semanticScore, score };
  });

  return ranked
    .filter(({ keywordScore, semanticScore, score }) => {
      if (score >= COMBINED_MIN_SCORE) return true;
      if (keywordScore >= KEYWORD_MIN_SCORE) return true;
      if (hasSemantic && semanticScore >= SEMANTIC_MIN_SCORE) return true;
      return false;
    })
    .sort((a, b) => b.score - a.score);
}

export async function searchItems(
  items: ItemWithCategory[],
  query?: string,
): Promise<ItemWithCategory[]> {
  const q = query?.trim();
  if (!q) return items;
  const ranked = await rankItemsForSearch(items, q);
  return ranked.map((r) => r.item);
}
