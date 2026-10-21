"use client";

import { useEffect, useState, type FormEvent } from "react";

import { SearchIcon } from "@/components/icons";

type Props = {
  query?: string;
  category?: string;
  /** Soft client search — skips full page reload when provided. */
  onSearch?: (query: string) => void;
  pending?: boolean;
};

export function CatalogSearch({ query, category, onSearch, pending }: Props) {
  const [value, setValue] = useState(query ?? "");
  const hasQuery = Boolean(value.trim());

  useEffect(() => {
    setValue(query ?? "");
  }, [query]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (!onSearch) return;
    event.preventDefault();
    onSearch(value.trim());
  }

  function clear() {
    setValue("");
    if (onSearch) {
      onSearch("");
      return;
    }
  }

  return (
    <form
      action={onSearch ? undefined : "/"}
      method={onSearch ? undefined : "get"}
      onSubmit={onSubmit}
      className="relative"
      role="search"
      aria-label="Поиск сохранений"
    >
      {!onSearch && category ? (
        <input type="hidden" name="category" value={category} />
      ) : null}
      <label htmlFor="catalog-search" className="sr-only">
        Поиск по словам
      </label>
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
      <input
        id="catalog-search"
        name="q"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Слово: сон, энергия, нейросеть…"
        className={`focus-ring min-h-11 w-full rounded-[var(--radius-md)] border border-line bg-surface py-2.5 pl-11 pr-11 text-base text-ink placeholder:text-ink-faint ${
          pending ? "opacity-70" : ""
        }`}
      />
      {hasQuery ? (
        <button
          type="button"
          onClick={clear}
          className="focus-ring absolute right-2 top-1/2 flex min-h-9 min-w-9 -translate-y-1/2 items-center justify-center rounded-full text-xs font-medium text-ink-muted hover:bg-paper-deep hover:text-ink"
          aria-label="Очистить поиск"
        >
          ✕
        </button>
      ) : null}
    </form>
  );
}
