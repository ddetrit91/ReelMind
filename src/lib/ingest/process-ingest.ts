import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

import { classifySavedItem } from "@/lib/ai/classify";
import { CATEGORY_SEED, isCategorySlug } from "@/lib/categories";
import { getDb } from "@/lib/db/client";
import { categories, items } from "@/lib/db/schema";
import { fetchLinkMetadata } from "@/lib/links/metadata";
import { extractUrl, parseSourceUrl } from "@/lib/links/parse-url";
import { useMockData } from "@/lib/env";
import { mockIngestItem } from "@/lib/mock/store";

export type IngestInput = {
  url?: string;
  text?: string;
  userId: string;
  categorySlug?: string;
};

export type IngestResult =
  | { ok: true; id: string; categorySlug: string; duplicate?: boolean }
  | { ok: false; error: string };

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

  const metadata = await fetchLinkMetadata(
    parsed.normalizedUrl,
    parsed.sourceKind,
    input.text,
  );

  let classification;
  let status: "ready" | "failed" = "ready";
  let errorMessage: string | undefined;
  const manualSlug =
    input.categorySlug && isCategorySlug(input.categorySlug) ? input.categorySlug : undefined;

  if (manualSlug) {
    const name = CATEGORY_SEED.find((c) => c.slug === manualSlug)?.name ?? "Другое";
    classification = {
      categorySlug: manualSlug,
      tags: [name.toLowerCase()],
      summary: metadata.caption ?? metadata.title ?? `Сохранённая ссылка (${name}).`,
      confidence: 1,
    };
  } else {
    try {
      classification = await classifySavedItem({
        url: parsed.normalizedUrl,
        shareText: input.text,
        caption: metadata.caption,
        title: metadata.title,
        sourceKind: parsed.sourceKind,
        mediaKind: parsed.mediaKind,
        contentType: parsed.contentType,
      });
    } catch (err) {
      status = "failed";
      errorMessage = err instanceof Error ? err.message : "Classification failed";
      classification = {
        categorySlug: "other" as const,
        tags: ["другое"],
        summary: metadata.caption ?? metadata.title ?? "Сохранённая ссылка.",
        confidence: 0.2,
      };
    }
  }

  const category = CATEGORY_SEED.find((c) => c.slug === classification.categorySlug);
  const categoryId = category?.id ?? "cat-other";

  const id = randomUUID();
  const now = new Date().toISOString();

  await db.insert(items).values({
    id,
    userId: input.userId,
    instagramUrl: parsed.normalizedUrl,
    sourceKind: parsed.sourceKind,
    mediaKind: parsed.mediaKind,
    contentType: parsed.contentType,
    shareText: input.text ?? null,
    caption: metadata.caption ?? null,
    title: metadata.title ?? null,
    thumbnailUrl: metadata.thumbnailUrl ?? null,
    categoryId,
    aiTags: classification.tags,
    aiSummary: classification.summary,
    classificationConfidence: classification.confidence,
    status,
    errorMessage: errorMessage ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return {
    ok: true,
    id,
    categorySlug: classification.categorySlug,
  };
}
