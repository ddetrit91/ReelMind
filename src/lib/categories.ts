import { coverFromSlugHash, matchCoverFromText } from "@/lib/cover-themes";

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

export const MAX_USER_CATEGORIES = 20;

/** User categories sit before system «Другое». */
export const USER_CATEGORY_SORT_BASE = 20;

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
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80",
  lifestyle:
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
  other:
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80",
};

const PALETTE = [
  "#1FA971",
  "#E85D2C",
  "#2B4DFF",
  "#6D4CFF",
  "#C3921A",
  "#0E8A96",
  "#B45309",
  "#DB2777",
  "#0891B2",
  "#7C3AED",
  "#059669",
  "#EA580C",
];

const TRANSLIT: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export function categoryColor(slug: string, storedColor?: string | null): string {
  if (storedColor) return storedColor;
  const seeded = CATEGORY_SEED.find((c) => c.slug === slug)?.color;
  if (seeded) return seeded;
  return colorFromSlug(slug);
}

export function colorFromSlug(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length] ?? "#6B7280";
}

/**
 * System categories → fixed Unsplash covers.
 * User categories → photo by name keywords; else stable unique cover from slug (not «Другое»).
 */
export function categoryCoverUrl(slug: string, name?: string): string {
  const system = CATEGORY_COVERS[slug];
  if (system) return system;

  const thematic = matchCoverFromText(name, slug.replace(/-/g, " "));
  if (thematic) return thematic.url;

  return coverFromSlugHash(slug);
}

export function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORY_SLUGS.includes(value as CategorySlug);
}

export function isSystemCategorySlug(slug: string): boolean {
  return isCategorySlug(slug);
}

/** Latin slug from Russian/English name for personal categories. */
export function slugifyCategoryName(name: string): string {
  const lower = name.trim().toLowerCase();
  let out = "";
  for (const ch of lower) {
    if (TRANSLIT[ch] !== undefined) {
      out += TRANSLIT[ch];
      continue;
    }
    if (/[a-z0-9]/.test(ch)) {
      out += ch;
      continue;
    }
    if (/\s|-|_/.test(ch)) {
      out += "-";
    }
  }
  out = out.replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!out) out = "category";
  if (out.length > 40) out = out.slice(0, 40).replace(/-$/, "");
  return out;
}

export const CATEGORY_EMOJI_CHOICES = [
  "📁",
  "🎯",
  "🎵",
  "🎬",
  "🏠",
  "🍳",
  "🎮",
  "✈️",
  "🐾",
  "🧠",
  "🛠️",
  "📸",
  "📰",
  "💡",
  "🌿",
  "🏀",
] as const;
