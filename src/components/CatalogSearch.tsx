import Link from "next/link";

import { SearchIcon } from "@/components/icons";

type Props = {
  query?: string;
  category?: string;
};

export function CatalogSearch({ query, category }: Props) {
  const hasQuery = Boolean(query?.trim());

  return (
    <form
      action="/"
      method="get"
      className="relative"
      role="search"
      aria-label="Поиск сохранений"
    >
      {category ? <input type="hidden" name="category" value={category} /> : null}
      <label htmlFor="catalog-search" className="sr-only">
        Поиск по словам и смыслу
      </label>
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
      <input
        id="catalog-search"
        name="q"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        defaultValue={query ?? ""}
        placeholder="Слово или смысл: сон, энергия, нейросеть…"
        className="focus-ring min-h-11 w-full rounded-[var(--radius-md)] border border-line bg-surface py-2.5 pl-11 pr-11 text-base text-ink placeholder:text-ink-faint"
      />
      {hasQuery ? (
        <Link
          href={category ? `/?category=${encodeURIComponent(category)}` : "/"}
          className="focus-ring absolute right-2 top-1/2 flex min-h-9 min-w-9 -translate-y-1/2 items-center justify-center rounded-full text-xs font-medium text-ink-muted hover:bg-paper-deep hover:text-ink"
          aria-label="Очистить поиск"
        >
          ✕
        </Link>
      ) : null}
    </form>
  );
}
