import { CATEGORY_SEED, categoryCoverUrl, type CategorySlug } from "@/lib/categories";
import { youtubeThumbnailUrl } from "@/lib/links/parse-url";

export type DemoCatalogItem = {
  key: string;
  url: string;
  title: string;
  caption: string;
  shareText: string;
  categorySlug: CategorySlug;
  thumbnailUrl: string;
  sourceKind: "youtube" | "article";
  mediaKind: "video" | "article";
  contentType: "video" | "article";
  tags: string[];
  summary: string;
};

export const DEMO_CATALOG: DemoCatalogItem[] = [
  {
    key: "demo-health-1",
    url: "https://www.youtube.com/watch?v=inpok4MKVLM",
    title: "5-Minute Meditation You Can Do Anywhere",
    caption: "Короткая медитация для восстановления.",
    shareText: "Медитация и дыхание для сна и восстановления #здоровье",
    categorySlug: "health",
    thumbnailUrl: youtubeThumbnailUrl("inpok4MKVLM"),
    sourceKind: "youtube",
    mediaKind: "video",
    contentType: "video",
    tags: ["здоровье", "медитация", "сон"],
    summary: "Пятиминутная практика дыхания и внимания — про восстановление, а не про спортзал.",
  },
  {
    key: "demo-health-2",
    url: "https://www.who.int/news-room/fact-sheets/detail/physical-activity",
    title: "Physical activity",
    caption: "Рекомендации ВОЗ по физической активности.",
    shareText: "Нормы движения и здоровье сердца",
    categorySlug: "health",
    thumbnailUrl: categoryCoverUrl("health"),
    sourceKind: "article",
    mediaKind: "article",
    contentType: "article",
    tags: ["здоровье", "движение"],
    summary: "Справка ВОЗ: сколько двигаться в неделю и зачем это сердцу и сну.",
  },
  {
    key: "demo-motivation-1",
    url: "https://www.ted.com/talks/tim_urban_inside_the_mind_of_a_master_procrastinator",
    title: "Inside the mind of a master procrastinator",
    caption: "TED про прокрастинацию и дисциплину.",
    shareText: "Дисциплина вместо скачков мотивации",
    categorySlug: "motivation",
    thumbnailUrl: categoryCoverUrl("motivation"),
    sourceKind: "article",
    mediaKind: "article",
    contentType: "article",
    tags: ["мотивация", "дисциплина"],
    summary: "Почему настроение врёт и как система маленьких шагов бьёт вспышки вдохновения.",
  },
  {
    key: "demo-business-1",
    url: "https://www.ycombinator.com/library/4D-yc-s-essential-startup-advice",
    title: "YC’s essential startup advice",
    caption: "Базовые советы Y Combinator основателям.",
    shareText: "Как упаковать оффер и говорить с клиентами",
    categorySlug: "business",
    thumbnailUrl: categoryCoverUrl("business"),
    sourceKind: "article",
    mediaKind: "article",
    contentType: "article",
    tags: ["бизнес", "стартап", "оффер"],
    summary: "Короткий разбор: клиент, боль, доказательство и понятный следующий шаг.",
  },
  {
    key: "demo-ai-1",
    url: "https://openai.com/index/chatgpt/",
    title: "ChatGPT",
    caption: "Страница ChatGPT — ИИ-сервис для черновиков и исследования.",
    shareText: "ChatGPT workflow для контента",
    categorySlug: "ai-tools",
    thumbnailUrl: categoryCoverUrl("ai-tools"),
    sourceKind: "article",
    mediaKind: "article",
    contentType: "article",
    tags: ["ai", "chatgpt"],
    summary: "ИИ-сервис: идея → черновик → правка. Класть сюда, а не в «обучение».",
  },
  {
    key: "demo-finance-1",
    url: "https://www.investopedia.com/terms/c/compoundinterest.asp",
    title: "Compound Interest",
    caption: "Что такое сложный процент и зачем он накоплениям.",
    shareText: "Подушка и сложный процент #финансы",
    categorySlug: "finance",
    thumbnailUrl: categoryCoverUrl("finance"),
    sourceKind: "article",
    mediaKind: "article",
    contentType: "article",
    tags: ["финансы", "накопления"],
    summary: "Как растут деньги во времени и почему резерв не смешивают с инвестициями.",
  },
  {
    key: "demo-education-1",
    url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    title: "Me at the zoo",
    caption: "Первое видео на YouTube — про учёбу и историю платформы.",
    shareText: "Урок про историю видео и объяснение простыми словами",
    categorySlug: "education",
    thumbnailUrl: youtubeThumbnailUrl("jNQXAC9IVRw"),
    sourceKind: "youtube",
    mediaKind: "video",
    contentType: "video",
    tags: ["обучение", "youtube"],
    summary: "Короткое видео как материал для объяснения: что произошло и зачем это помнить.",
  },
  {
    key: "demo-lifestyle-1",
    url: "https://www.bonappetit.com/recipe/ba-s-best-chocolate-chip-cookies",
    title: "BA's Best Chocolate Chip Cookies",
    caption: "Рецепт печенья — еда и быт, не здоровье.",
    shareText: "Рецепт на выходные #лайфстайл",
    categorySlug: "lifestyle",
    thumbnailUrl: categoryCoverUrl("lifestyle"),
    sourceKind: "article",
    mediaKind: "article",
    contentType: "article",
    tags: ["рецепт", "еда"],
    summary: "Домашний рецепт и ритуал выходного дня — лайфстайл, не спорт и не учёба.",
  },
  {
    key: "demo-other-1",
    url: "https://en.wikipedia.org/wiki/Personal_knowledge_management",
    title: "Personal knowledge management",
    caption: "Обзор систем личных заметок и закладок.",
    shareText: "Про закладки и архив без узкой темы",
    categorySlug: "other",
    thumbnailUrl: categoryCoverUrl("other"),
    sourceKind: "article",
    mediaKind: "article",
    contentType: "article",
    tags: ["закладки", "архив"],
    summary: "Смешанная тема про личный архив — когда нет одной явной категории.",
  },
];

export function demoItemId(userId: string, key: string) {
  return `${key}:${userId.slice(0, 8)}`;
}

export function categoryMeta(slug: CategorySlug) {
  return CATEGORY_SEED.find((c) => c.slug === slug)!;
}
