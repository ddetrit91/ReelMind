import Link from "next/link";

type Props = {
  query: string;
  category?: string;
};

export function SearchEmptyState({ query, category }: Props) {
  const resetHref = category ? `/?category=${encodeURIComponent(category)}` : "/";

  return (
    <div className="card-surface rounded-[var(--radius-lg)] px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold text-ink">Ничего не найдено</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
        По запросу «{query}» нет совпадений. Поиск смотрит слова, теги, описание и смысл через
        Gemini. Попробуйте другое слово или синоним.
      </p>
      <Link
        href={resetHref}
        className="focus-ring mt-6 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-line bg-surface px-5 text-sm font-medium text-ink hover:bg-paper-deep"
      >
        Сбросить поиск
      </Link>
    </div>
  );
}
