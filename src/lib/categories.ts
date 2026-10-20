export const CATEGORY_SEED = [
  { id: "cat-health", slug: "health", name: "Здоровье", emoji: "💚", sortOrder: 1, color: "#1FA971" },
  { id: "cat-motivation", slug: "motivation", name: "Мотивация", emoji: "🔥", sortOrder: 2, color: "#E85D2C" },
  { id: "cat-business", slug: "business", name: "Бизнес", emoji: "💼", sortOrder: 3, color: "#2B4DFF" },
  { id: "cat-ai-tools", slug: "ai-tools", name: "ИИ-сервисы", emoji: "🤖", sortOrder: 4, color: "#6D4CFF" },
  { id: "cat-finance", slug: "finance", name: "Финансы", emoji: "💰", sortOrder: 5, color: "#C3921A" },
  { id: "cat-education", slug: "education", name: "Обучение", emoji: "📚", sortOrder: 6, color: "#0E8A96" },
  { id: "cat-lifestyle", slug: "lifestyle", name: "Лайфстайл", emoji: "✨", sortOrder: 7, color: "#B45309" },
  { id: "cat-other", slug: "other", name: "Другое", emoji: "📁", sortOrder: 99, color: "#6B7280" },
] as const;

export const CATEGORY_SLUGS = CATEGORY_SEED.map((c) => c.slug);

export type CategorySlug = (typeof CATEGORY_SEED)[number]["slug"];

const CATEGORY_COVERS: Record<string, string> = {
  health:
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80",
  motivation:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  business:
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
  "ai-tools":
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
  finance:
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1200&q=80",
  education:
    "https://images.unsplash.com/photo-1456513080800-7d93d0e0470d?auto=format&fit=crop&w=1200&q=80",
  lifestyle:
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
  other:
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80",
};

export function categoryColor(slug: string): string {
  return CATEGORY_SEED.find((c) => c.slug === slug)?.color ?? "#6B7280";
}

export function categoryCoverUrl(slug: string): string {
  return CATEGORY_COVERS[slug] ?? CATEGORY_COVERS.other;
}

export function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORY_SLUGS.includes(value as CategorySlug);
}
