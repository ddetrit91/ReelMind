import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { after } from "next/server";

import { classifySavedItem, classifyWithKeywords } from "@/lib/ai/classify";
import { CATEGORY_SEED, isCategorySlug } from "@/lib/categories";
import { getDb } from "@/lib/db/client";
import { categories, items } from "@/lib/db/schema";
import { useMockData } from "@/lib/env";
import { quickDisplayTitle } from "@/lib/links/display-text";
import { fetchLinkMetadata } from "@/lib/links/metadata";
import {
  extractUrl,
  extractYoutubeVideoId,
  parseSourceUrl,
  youtubeThumbnailUrl,
} from "@/lib/links/parse-url";
import { sourceNeedsManualNote } from "@/lib/links/share-content";
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

function quickThumbnail(url: string, sourceKind: string): string | null {
  if (sourceKind !== "youtube") return null;
  const id = extractYoutubeVideoId(url);
  return id ? youtubeThumbnailUrl(id) : null;
}

function scheduleEnrich(task: () => Promise<void>) {
  try {
    after(() => {
      void task().catch((err) => console.error("[ingest enrich]", err));
    });
  } catch {
    void task().catch((err) => console.error("[ingest enrich]", err));
  }
}

async function enrichSavedItem(input: {
  id: string;
  userId: string;
  url: string;
  shareText?: string;
  sourceKind: Parameters<typeof fetchLinkMetadata>[1];
  mediaKind: string;
  contentType: string;
  manualSlug?: string;
}) {
  const db = getDb();
  const metadata = await fetchLinkMetadata(input.url, input.sourceKind, input.shareText);

  let classification;
  if (input.manualSlug && isCategorySlug(input.manualSlug)) {
    const name = CATEGORY_SEED.find((c) => c.slug === input.manualSlug)?.name ?? "Другое";
    classification = {
      categorySlug: input.manualSlug,
      tags: [name.toLowerCase()],
      summary: metadata.caption ?? metadata.title ?? `Сохранённая ссылка (${name}).`,
      confidence: 1,
    };
  } else {
    try {
      classification = await classifySavedItem({
        url: input.url,
        shareText: input.shareText,
        caption: metadata.caption,
        title: metadata.title,
        sourceKind: input.sourceKind,
        mediaKind: input.mediaKind as never,
        contentType: input.contentType as never,
      });
    } catch (err) {
      const fallback = classifyWithKeywords(
        [input.url, metadata.title, metadata.caption, input.shareText].filter(Boolean).join("\n"),
      );
      classification = fallback;
      console.error("[ingest enrich] classify failed", err);
    }
  }

  const category = CATEGORY_SEED.find((c) => c.slug === classification.categorySlug);
  const categoryId = category?.id ?? "cat-other";
  const now = new Date().toISOString();

  // Prefer user/share note for title when present — Instagram often returns empty/junk OG.
  const titleFromNote = input.shareText?.trim()
    ? quickDisplayTitle(input.url, input.shareText, input.sourceKind)
    : null;
  const nextTitle = titleFromNote || metadata.title;
  const nextCaption = input.shareText?.trim() || metadata.caption || nextTitle;

  await db
    .update(items)
    .set({
      ...(nextTitle ? { title: nextTitle } : {}),
      ...(nextCaption ? { caption: nextCaption } : {}),
      ...(metadata.thumbnailUrl ? { thumbnailUrl: metadata.thumbnailUrl } : {}),
      categoryId,
      aiTags: classification.tags,
      aiSummary: classification.summary,
      classificationConfidence: classification.confidence,
      status: "ready",
      errorMessage: null,
      updatedAt: now,
    })
    .where(and(eq(items.id, input.id), eq(items.userId, input.userId)));

  revalidateCatalog();
}

/**
 * Fast ingest: duplicate check + insert in one round-trip, return immediately.
 * Metadata + AI classification run in the background via `after()`.
 */
export async function processIngest(input: IngestInput): Promise<IngestResult> {
  const rawUrl =
    (input.url && extractUrl(input.url)) || extractUrl(input.text ?? "") || null;

  if (!rawUrl) {
    return { ok: false, error: "Не найдена ссылка. Вставьте полный URL, начиная с https://" };
  }

  if (sourceNeedsManualNote(rawUrl) && !input.text?.trim()) {
    return {
      ok: false,
      error: "Напишите заметку — без описания эту ссылку сохранить нельзя.",
    };
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

  const manualSlug =
    input.categorySlug && isCategorySlug(input.categorySlug) ? input.categorySlug : undefined;

  const hintText = [parsed.normalizedUrl, input.text].filter(Boolean).join("\n");
  const classification = manualSlug
    ? {
        categorySlug: manualSlug,
        tags: [
          (CATEGORY_SEED.find((c) => c.slug === manualSlug)?.name ?? "Другое").toLowerCase(),
        ],
        summary: input.text?.trim() || `Сохранённая ссылка.`,
        confidence: 1,
      }
    : classifyWithKeywords(hintText);

  const category = CATEGORY_SEED.find((c) => c.slug === classification.categorySlug);
  const categoryId = category?.id ?? "cat-other";
  const id = randomUUID();
  const now = new Date().toISOString();
  const title = quickDisplayTitle(parsed.normalizedUrl, input.text, parsed.sourceKind);
  const thumbnailUrl = quickThumbnail(parsed.normalizedUrl, parsed.sourceKind);

  await db.insert(items).values({
    id,
    userId: input.userId,
    instagramUrl: parsed.normalizedUrl,
    sourceKind: parsed.sourceKind,
    mediaKind: parsed.mediaKind,
    contentType: parsed.contentType,
    shareText: input.text ?? null,
    caption: input.text?.trim() || title,
    title,
    thumbnailUrl,
    categoryId,
    aiTags: classification.tags,
    aiSummary: classification.summary,
    classificationConfidence: classification.confidence,
    status: "processing",
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
  });

  scheduleEnrich(() =>
    enrichSavedItem({
      id,
      userId: input.userId,
      url: parsed.normalizedUrl,
      shareText: input.text,
      sourceKind: parsed.sourceKind,
      mediaKind: parsed.mediaKind,
      contentType: parsed.contentType,
      manualSlug,
    }),
  );

  return {
    ok: true,
    id,
    categorySlug: classification.categorySlug,
  };
}
