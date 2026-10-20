import { generateObject } from "ai";
import { z } from "zod";

import { getChatModel } from "@/lib/ai/client";
import { CATEGORY_SEED, CATEGORY_SLUGS } from "@/lib/categories";
import type { ContentType, MediaKind, SourceKind } from "@/lib/links/parse-url";

const slugTuple = CATEGORY_SLUGS as [string, ...string[]];

const classificationSchema = z.object({
  categorySlug: z.enum(slugTuple),
  tags: z.array(z.string()).min(1).max(5),
  summary: z.string().min(10).max(400),
  confidence: z.number().min(0).max(1),
});

export type ClassificationResult = z.infer<typeof classificationSchema>;

function getModel() {
  return getChatModel();
}

const KEYWORD_RULES: { slug: (typeof CATEGORY_SLUGS)[number]; words: string[] }[] = [
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

function classifyWithKeywords(text: string): ClassificationResult {
  const lower = text.toLowerCase();
  let bestSlug: (typeof CATEGORY_SLUGS)[number] = "other";
  let bestScore = 0;

  for (const rule of KEYWORD_RULES) {
    const score = rule.words.reduce((acc, w) => (lower.includes(w) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      bestScore = score;
      bestSlug = rule.slug;
    }
  }

  const name = CATEGORY_SEED.find((c) => c.slug === bestSlug)?.name ?? "Другое";
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
}): Promise<ClassificationResult> {
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

  const model = getModel();
  if (!model) {
    return classifyWithKeywords(context);
  }

  const categoryList = CATEGORY_SEED.map((c) => `${c.slug} — ${c.name}`).join(", ");

  try {
    const { object } = await generateObject({
      model,
      schema: classificationSchema,
      system: `Ты классификатор сохранённых ссылок для личной базы знаний. Источники: Instagram, YouTube, статьи и любые URL. Выбери одну primary-категорию из списка: ${categoryList}. Ответ на русском в summary. Если не уверен — other.`,
      prompt: context,
    });
    return object;
  } catch (err) {
    console.error("AI classification failed, using keywords", err);
    return classifyWithKeywords(context);
  }
}

/** @deprecated use classifySavedItem */
export const classifyInstagramItem = classifySavedItem;
