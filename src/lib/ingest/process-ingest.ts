import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

import { classifySavedItem, classifyWithKeywords } from "@/lib/ai/classify";
import { listCategoriesForUser, getCategoryBySlugForUser } from "@/lib/data/categories";
import { getDb } from "@/lib/db/client";
import { categories, items } from "@/lib/db/schema";
import { useMockData } from "@/lib/env";
import { isJunkTitle, quickDisplayTitle } from "@/lib/links/display-text";
import {
  fetchLinkMetadata,
  sourcePrefersNoteTitle,
} from "@/lib/links/metadata";
import {
  extractUrl,
  extractYoutubeVideoId,
  parseSourceUrl,
  youtubeThumbnailUrl,
} from "@/lib/links/parse-url";
import { mockIngestItem } from "@/lib/mock/store";
import { revalidateCatalog } from "@/server/hono/revalidate";

export type IngestInput = {
  url?: string;
  text?: string;
  userId: string;
  categorySlug?: string;
};

export type IngestResult =
  | { ok: true; id: string; categorySlug: string; duplicate?: boolean }
  | { ok: false; error: string };

const AI_CLASSIFY_TIMEOUT_MS = 9000;

function quickThumbnail(url: string, sourceKind: string): string | null {
  if (sourceKind !== "youtube") return null;
  const id = extractYoutubeVideoId(url);
  return id ? youtubeThumbnailUrl(id) : null;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Full ingest: metadata (title / description / thumb) + AI category before respond.
 * Matches the reliable behaviour users expect from Add / Share.
 */
export async function processIngest(input: IngestInput): Promise<IngestResult> {
  const rawUrl =
    (input.url && extractUrl(input.url)) || extractUrl(input.text ?? "") || null;

  if (!rawUrl) {
    return { ok: false, error: "Не найдена ссылка. Вставьте полный URL, начиная с https://" };
  }

  if (useMockData()) {
    return mockIngestItem(rawUrl, input.text, input.categorySlug);
  }

  let parsed;
  try {
    parsed = parseSourceUrl(rawUrl);
  } catch {
    return { ok: false, error: "Некорректная ссылка" };
  }

  const db = getDb();
  const rawNote = input.text?.trim() || undefined;
  // Drop platform garbage that landed in the note field ("kdfgkldjf44dfg dfsg").
  const note = rawNote && !isJunkTitle(rawNote) ? rawNote : undefined;

  const existing = await db
    .select({
      id: items.id,
      slug: categories.slug,
    })
    .from(items)
    .innerJoin(categories, eq(items.categoryId, categories.id))
    .where(and(eq(items.userId, input.userId), eq(items.instagramUrl, parsed.normalizedUrl)))
    .limit(1);

  if (existing[0]) {
    return {
      ok: true,
      id: existing[0].id,
      categorySlug: existing[0].slug,
      duplicate: true,
    };
  }

  const userCategories = await listCategoriesForUser(input.userId);
  const classifyCategories = userCategories.map((c) => ({ slug: c.slug, name: c.name }));
  const other =
    userCategories.find((c) => c.slug === "other") ?? userCategories[userCategories.length - 1];

  let manualCategory =
    input.categorySlug?.trim()
      ? await getCategoryBySlugForUser(input.userId, input.categorySlug.trim())
      : null;

  let metadata: Awaited<ReturnType<typeof fetchLinkMetadata>> = {};
  try {
    metadata = await fetchLinkMetadata(parsed.normalizedUrl, parsed.sourceKind, note);
  } catch (err) {
    console.error("[ingest] metadata failed", err);
  }

  const fallbackTitle = quickDisplayTitle(parsed.normalizedUrl, note, parsed.sourceKind);
  const title =
    (sourcePrefersNoteTitle(parsed.sourceKind) && note
      ? quickDisplayTitle(parsed.normalizedUrl, note, parsed.sourceKind)
      : metadata.title) ||
    metadata.title ||
    fallbackTitle;
  const caption = metadata.caption || note || title;
  const thumbnailUrl =
    metadata.thumbnailUrl || quickThumbnail(parsed.normalizedUrl, parsed.sourceKind);

  let classification;
  if (manualCategory) {
    classification = {
      categorySlug: manualCategory.slug,
      tags: [manualCategory.name.toLowerCase()],
      summary: caption || note || `Сохранённая ссылка (${manualCategory.name}).`,
      confidence: 1,
    };
  } else {
    const hintText = [parsed.normalizedUrl, title, caption, note].filter(Boolean).join("\n");
    const keywordFallback = classifyWithKeywords(hintText, classifyCategories);
    try {
      classification = await withTimeout(
        classifySavedItem({
          url: parsed.normalizedUrl,
          shareText: note,
          caption,
          title,
          sourceKind: parsed.sourceKind,
          mediaKind: parsed.mediaKind,
          contentType: parsed.contentType,
          categories: classifyCategories,
        }),
        AI_CLASSIFY_TIMEOUT_MS,
      );
    } catch (err) {
      console.error("[ingest] classify timeout/fail, keywords", err);
      classification = keywordFallback;
    }
  }

  const category =
    userCategories.find((c) => c.slug === classification.categorySlug) ?? other;
  if (!category) {
    return { ok: false, error: "Категории не настроены. Выполните db:seed." };
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  await db.insert(items).values({
    id,
    userId: input.userId,
    instagramUrl: parsed.normalizedUrl,
    sourceKind: parsed.sourceKind,
    mediaKind: parsed.mediaKind,
    contentType: parsed.contentType,
    shareText: note ?? null,
    caption,
    title,
    thumbnailUrl,
    categoryId: category.id,
    aiTags: classification.tags,
    aiSummary: classification.summary,
    classificationConfidence: classification.confidence,
    status: "ready",
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  });

  revalidateCatalog();

  return {
    ok: true,
    id,
    categorySlug: category.slug,
  };
}
