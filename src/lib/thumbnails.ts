/**
 * Превью карточек — только на уровне сохранения (item), не категории.
 *
 * Production: thumbnailUrl из oEmbed/Open Graph при сохранении ссылки.
 * Если превью нет — UI показывает fallback по цвету/emoji категории.
 * Новая категория не требует отдельного «фото категории» — только emoji + color в CATEGORY_SEED.
 */

/** mock/seed: стабильное демо-превью по id записи (не привязано к slug категории). */
export function demoThumbnailUrl(itemId: string): string {
  const seed = encodeURIComponent(itemId.replace(/[^a-zA-Z0-9-]/g, "-"));
  return `https://picsum.photos/seed/${seed}/480/640`;
}

export type ItemThumbnailFields = {
  thumbnailUrl?: string | null;
  categorySlug: string;
  categoryEmoji: string;
  categoryName: string;
  title?: string | null;
  sourceKind?: string;
  mediaKind?: string;
  contentType?: string;
};

export function itemThumbnailAlt(item: ItemThumbnailFields): string {
  return item.title?.trim() || item.categoryName || "Сохранённая ссылка";
}
