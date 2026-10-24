import { generateObject } from "ai";
import { z } from "zod";

import { getChatModel } from "@/lib/ai/client";
import type { SourceKind, MediaKind, ContentType } from "@/lib/links/parse-url";

export type ClassifyCategory = {
  slug: string;
  name: string;
};

export type ClassificationResult = {
  categorySlug: string;
  tags: string[];
  summary: string;
  confidence: number;
};

const SYSTEM_KEYWORD_RULES: { slug: string; words: string[] }[] = [
  { slug: "health", words: ["здоров", "сон", "спорт", "питан", "fitness", "wellness"] },
  { slug: "motivation", words: ["мотив", "не сдавай", "mindset", "дисциплин", "успех"] },
  { slug: "business", words: ["бизнес", "продаж", "маркет", "стартап", "оффер", "клиент"] },
  { slug: "ai-tools", words: ["ai", "chatgpt", "gpt", "нейрос", "midjourney", "claude", "ии", "gemini"] },
  { slug: "finance", words: ["финанс", "инвест", "деньг", "бюджет", "накоп", "крипто"] },
  { slug: "education", words: ["обуч", "курс", "урок", "study", "english", "навык"] },
  {
    slug: "lifestyle",
    words: ["лайф", "рецепт", "путешеств", "стиль", "еда", "travel", "recipe", "interior", "дизайн"],
  },
];

function fallbackOther(categories: ClassifyCategory[]): string {
  return categories.find((c) => c.slug === "other")?.slug ?? categories[0]?.slug ?? "other";
}

/** Sync keyword classify — system rules + name match for personal categories. */
export function classifyWithKeywords(
  text: string,
  categories: ClassifyCategory[],
): ClassificationResult {
  const lower = text.toLowerCase();
  const allowed = new Set(categories.map((c) => c.slug));
  let bestSlug = fallbackOther(categories);
  let bestScore = 0;

  for (const rule of SYSTEM_KEYWORD_RULES) {
    if (!allowed.has(rule.slug)) continue;
    const score = rule.words.reduce((acc, w) => (lower.includes(w) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      bestScore = score;
      bestSlug = rule.slug;
    }
  }

  for (const cat of categories) {
    if (cat.slug === "other" || SYSTEM_KEYWORD_RULES.some((r) => r.slug === cat.slug)) continue;
    const name = cat.name.toLowerCase();
    const tokens = name.split(/[\s,/|-]+/).filter((t) => t.length >= 3);
    let score = 0;
    if (name.length >= 3 && lower.includes(name)) score += 2;
    for (const token of tokens) {
      if (lower.includes(token)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestSlug = cat.slug;
    }
  }

  const name = categories.find((c) => c.slug === bestSlug)?.name ?? "Другое";
  return {
    categorySlug: bestSlug,
    tags: [name.toLowerCase()],
    summary: text.slice(0, 180) || `Сохранённая ссылка (${name}).`,
    confidence: bestScore > 0 ? 0.55 : 0.35,
  };
}

export async function classifySavedItem(input: {
  url: string;
  shareText?: string;
  caption?: string;
  title?: string;
  sourceKind: SourceKind;
  mediaKind: MediaKind;
  contentType: ContentType;
  categories: ClassifyCategory[];
}): Promise<ClassificationResult> {
  const categories = input.categories.length
    ? input.categories
    : [{ slug: "other", name: "Другое" }];
  const slugs = categories.map((c) => c.slug);

  const context = [
    `URL: ${input.url}`,
    `Источник: ${input.sourceKind}`,
    `Тип: ${input.mediaKind}, контент: ${input.contentType}`,
    input.title ? `Заголовок: ${input.title}` : "",
    input.caption ? `Подпись: ${input.caption}` : "",
    input.shareText ? `Текст пользователя: ${input.shareText}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const model = getChatModel();
  if (!model) {
    return classifyWithKeywords(context, categories);
  }

  const categoryList = categories.map((c) => `${c.slug} — ${c.name}`).join(", ");
  const schema = z.object({
    categorySlug: z.string().refine((value) => slugs.includes(value), {
      message: "Unknown category",
    }),
    tags: z.array(z.string()).min(1).max(5),
    summary: z.string().min(10).max(400),
    confidence: z.number().min(0).max(1),
  });

  try {
    const { object } = await generateObject({
      model,
      schema,
      system: `Ты классификатор сохранённых ссылок для личной базы знаний. Источники: Instagram, YouTube, статьи и любые URL. Выбери одну primary-категорию строго из списка (slug): ${categoryList}. Учитывай пользовательские категории так же, как системные. Ответ на русском в summary. Если не уверен — other.`,
      prompt: context,
    });

    if (!slugs.includes(object.categorySlug)) {
      return classifyWithKeywords(context, categories);
    }
    return object;
  } catch (err) {
    console.error("AI classification failed, using keywords", err);
    return classifyWithKeywords(context, categories);
  }
}

/** @deprecated use classifySavedItem */
export const classifyInstagramItem = classifySavedItem;
