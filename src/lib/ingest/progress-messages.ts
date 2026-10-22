/** URLs where metadata / oEmbed often takes several seconds. */
export function isHeavyIngestUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|instagram\.com|tiktok\.com|vk\.com\/video|dzen\.ru/i.test(
    url,
  );
}

const HEAVY_STAGES: { afterMs: number; message: string; detail?: string }[] = [
  {
    afterMs: 0,
    message: "Обрабатываем ссылку…",
    detail: "Сохраняем в ваш каталог",
  },
  {
    afterMs: 1500,
    message: "Получаем описание и обложку…",
    detail: "YouTube и Instagram иногда отвечают несколько секунд",
  },
  {
    afterMs: 4500,
    message: "Подбираем категорию…",
    detail: "ИИ смотрит ссылку и вашу заметку",
  },
  {
    afterMs: 9000,
    message: "Ещё немного…",
    detail: "Видео может обрабатываться до полминуты — не закрывайте страницу",
  },
];

const LIGHT_STAGES: { afterMs: number; message: string; detail?: string }[] = [
  { afterMs: 0, message: "Сохраняем…", detail: "Проверяем ссылку и заметку" },
  { afterMs: 2000, message: "Подбираем категорию…", detail: "Обычно это занимает несколько секунд" },
  {
    afterMs: 7000,
    message: "Ещё обрабатываем…",
    detail: "Можно подождать — запрос уже отправлен",
  },
];

export function ingestProgressForElapsed(
  url: string,
  elapsedMs: number,
): { message: string; detail?: string } {
  const stages = isHeavyIngestUrl(url) ? HEAVY_STAGES : LIGHT_STAGES;
  let current = stages[0]!;
  for (const stage of stages) {
    if (elapsedMs >= stage.afterMs) current = stage;
  }
  return { message: current.message, detail: current.detail };
}
