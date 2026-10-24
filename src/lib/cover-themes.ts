const crop = "auto=format&fit=crop&w=1200&q=80";

/** Stable Unsplash photos. Longest keyword hit wins. */
export const COVER_THEMES: { words: string[]; image: string }[] = [
  {
    words: ["бегот", "пробеж", "марафон", "jogging", "runner"],
    image: `https://images.unsplash.com/photo-1552674605-db6ffd4facb5?${crop}`,
  },
  {
    words: ["бег", "спорт", "тренир", "зал", "fitness", "workout", "баскет", "футбол"],
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
    words: ["сон", "устал", "sleep", "здоров", "wellness", "йог", "медитац"],
    image: `https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?${crop}`,
  },
  {
    words: ["еда", "рецепт", "готов", "кухн", "кулинар", "food", "cook"],
    image: `https://images.unsplash.com/photo-1504674900247-0877df9cc836?${crop}`,
  },
  {
    words: ["путешеств", "travel", "отпуск", "туризм", "поездк"],
    image: `https://images.unsplash.com/photo-1488646953014-85cb44e25828?${crop}`,
  },
  {
    words: ["море", "океан", "пляж", "ocean"],
    image: `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?${crop}`,
  },
  {
    words: ["лес", "природ", "гор", "forest", "сад", "растен", "цвет"],
    image: `https://images.unsplash.com/photo-1441974231531-c6227db76b6e?${crop}`,
  },
  {
    words: ["деньг", "финанс", "инвест", "бюджет", "крипто"],
    image: `https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?${crop}`,
  },
  {
    words: ["бизнес", "продаж", "стартап", "клиент", "маркет"],
    image: `https://images.unsplash.com/photo-1521737711867-e3b97375f902?${crop}`,
  },
  {
    words: ["нейросет", "chatgpt", "ии", "ai", "искусственн", "gemini", "llm"],
    image: `https://images.unsplash.com/photo-1677442136019-21780ecad995?${crop}`,
  },
  {
    words: ["обуч", "урок", "книг", "курс", "study", "education", "учеб"],
    image: `https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?${crop}`,
  },
  {
    words: ["музык", "песн", "music", "концерт"],
    image: `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?${crop}`,
  },
  {
    words: ["кофе", "coffee", "чай"],
    image: `https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?${crop}`,
  },
  {
    words: ["машин", "авто", "car"],
    image: `https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?${crop}`,
  },
  {
    words: ["дизайн", "интерьер", "декор"],
    image: `https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?${crop}`,
  },
  {
    words: ["кино", "фильм", "сериал", "reel", "video", "видео", "монтаж"],
    image: `https://images.unsplash.com/photo-1485846234645-a62644f84728?${crop}`,
  },
  {
    words: ["игр", "game", "гейм", "playstation", "xbox"],
    image: `https://images.unsplash.com/photo-1511512578047-dfb367046420?${crop}`,
  },
  {
    words: ["дом", "home", "уют", "квартир"],
    image: `https://images.unsplash.com/photo-1484154218962-a197022b5858?${crop}`,
  },
  {
    words: ["питом", "кошк", "собак", "звер", "pet", "animal"],
    image: `https://images.unsplash.com/photo-1450778869180-41d0601e046e?${crop}`,
  },
  {
    words: ["фото", "photo", "камер", "съём", "съем"],
    image: `https://images.unsplash.com/photo-1516035069371-29a1b244cc32?${crop}`,
  },
  {
    words: ["новост", "news", "стать", "блог", "media"],
    image: `https://images.unsplash.com/photo-1504711434869-e1ff668e4870?${crop}`,
  },
  {
    words: ["иде", "креатив", "вдохнов", "мотив"],
    image: `https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?${crop}`,
  },
  {
    words: ["инструмент", "tool", "гаджет", "tech", "техник"],
    image: `https://images.unsplash.com/photo-1518770660439-4636190af475?${crop}`,
  },
  {
    words: ["самолет", "авиа", "flight", "airport"],
    image: `https://images.unsplash.com/photo-1436491865332-7a61a109cc05?${crop}`,
  },
];

/** Diverse covers when название не попало в темы — разные slug → разные фото. */
export const COVER_FALLBACK_POOL = [
  `https://images.unsplash.com/photo-1557683316-973673baf926?${crop}`,
  `https://images.unsplash.com/photo-1579546929518-9e396f3cc809?${crop}`,
  `https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?${crop}`,
  `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?${crop}`,
  `https://images.unsplash.com/photo-1557682250-33bd8f75f54a?${crop}`,
  `https://images.unsplash.com/photo-1614850523459-c2f4ebd455ac?${crop}`,
  `https://images.unsplash.com/photo-1550684848-fac1c5b4e853?${crop}`,
  `https://images.unsplash.com/photo-1557672172-298e090bd0f1?${crop}`,
] as const;

export function matchCoverFromText(
  ...parts: (string | null | undefined)[]
): { url: string; specific: boolean } | null {
  const hay = parts
    .filter(Boolean)
    .join("\n")
    .toLowerCase()
    .replace(/ё/g, "е");
  if (!hay.trim()) return null;

  let best: { score: number; url: string } | null = null;
  for (const theme of COVER_THEMES) {
    let score = 0;
    for (const word of theme.words) {
      if (hay.includes(word)) score += word.length;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { score, url: theme.image };
    }
  }
  if (!best) return null;
  return { url: best.url, specific: true };
}

export function coverFromSlugHash(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return COVER_FALLBACK_POOL[hash % COVER_FALLBACK_POOL.length] ?? COVER_FALLBACK_POOL[0];
}
