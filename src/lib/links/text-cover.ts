import { categoryCoverUrl } from "@/lib/categories";

const crop = "auto=format&fit=crop&w=1200&q=80";

/** Stable photos. First matching theme wins by the longest keyword hit. */
const THEMES: { words: string[]; image: string }[] = [
  {
    words: ["бегот", "пробеж", "марафон", "jogging", "runner"],
    image: `https://images.unsplash.com/photo-1552674605-db6ffd4facb5?${crop}`,
  },
  {
    words: ["бег", "спорт", "тренир", "зал", "fitness", "workout"],
    image: `https://images.unsplash.com/photo-1517836357463-d25dfeac3438?${crop}`,
  },
  {
    words: ["смысл", "философ", "размышл", "мудр"],
    image: `https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?${crop}`,
  },
  {
    words: ["счаст", "радост", "улыб", "happiness"],
    image: `https://images.unsplash.com/photo-1469474968028-56623f02e42e?${crop}`,
  },
  {
    words: ["сон", "устал", "sleep"],
    image: `https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?${crop}`,
  },
  {
    words: ["еда", "рецепт", "готов", "кухн", "food"],
    image: `https://images.unsplash.com/photo-1504674900247-0877df9cc836?${crop}`,
  },
  {
    words: ["путешеств", "travel", "отпуск", "город"],
    image: `https://images.unsplash.com/photo-1488646953014-85cb44e25828?${crop}`,
  },
  {
    words: ["море", "океан", "пляж", "ocean"],
    image: `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?${crop}`,
  },
  {
    words: ["лес", "природ", "гор", "forest"],
    image: `https://images.unsplash.com/photo-1441974231531-c6227db76b6e?${crop}`,
  },
  {
    words: ["деньг", "финанс", "инвест", "бюджет"],
    image: `https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?${crop}`,
  },
  {
    words: ["бизнес", "продаж", "стартап", "клиент"],
    image: `https://images.unsplash.com/photo-1521737711867-e3b97375f902?${crop}`,
  },
  {
    words: ["нейросет", "chatgpt", "ии ", " ai", "искусственн"],
    image: `https://images.unsplash.com/photo-1677442136019-21780ecad995?${crop}`,
  },
  {
    words: ["обуч", "урок", "книг", "курс", "study"],
    image: `https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?${crop}`,
  },
  {
    words: ["музык", "песн", "music"],
    image: `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?${crop}`,
  },
  {
    words: ["кофе", "coffee"],
    image: `https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?${crop}`,
  },
  {
    words: ["машин", "авто", "car"],
    image: `https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?${crop}`,
  },
  {
    words: ["дизайн", "интерьер"],
    image: `https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?${crop}`,
  },
];

export function coverFromText(
  title?: string | null,
  hint?: string | null,
  categorySlug?: string,
): { url: string; specific: boolean } {
  const hay = `${title ?? ""}\n${hint ?? ""}`.toLowerCase().replace(/ё/g, "е");
  let best: { score: number; url: string } | null = null;

  for (const theme of THEMES) {
    let score = 0;
    for (const word of theme.words) {
      if (hay.includes(word)) score += word.length;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { score, url: theme.image };
    }
  }

  if (best) return { url: best.url, specific: true };
  return { url: categoryCoverUrl(categorySlug ?? "other"), specific: false };
}
