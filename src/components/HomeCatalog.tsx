"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { AppShell } from "@/components/AppShell";
import { CatalogSearch } from "@/components/CatalogSearch";
import { CategoryHero } from "@/components/CategoryHero";
import { CategorySwipe } from "@/components/CategorySwipe";
import { EmptyState } from "@/components/EmptyState";
import { ItemCard } from "@/components/ItemCard";
import { SearchEmptyState } from "@/components/SearchEmptyState";
import type { AuthUser } from "@/lib/auth/session";
import type { CategoryWithCount, ItemWithCategory } from "@/lib/data/items";

type Props = {
  user: AuthUser;
  initialCategories: CategoryWithCount[];
  initialItems: ItemWithCategory[];
  initialCategory?: string;
  initialQuery?: string;
};

function catalogSubtitle(
  active: { name: string; itemCount: number } | undefined,
  total: number,
  query: string | undefined,
  resultCount: number,
) {
  const q = query?.trim();
  if (q) {
    return resultCount > 0
      ? `${resultCount} по запросу «${q}» — слова, описание и смысл`
      : `Нет результатов по «${q}»`;
  }
  if (active) return `${active.itemCount} сохранений в этой категории`;
  return `${total} сохранений — ищите по категории, не по ленте`;
}

function hrefFor(category: string | undefined, query: string | undefined) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (query?.trim()) params.set("q", query.trim());
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

function cacheKey(slug: string | undefined, query: string | undefined) {
  return `${slug ?? ""}|${query?.trim() ?? ""}`;
}

export function HomeCatalog({
  user,
  initialCategories,
  initialItems,
  initialCategory,
  initialQuery,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [category, setCategory] = useState(initialCategory);
  const [query] = useState(initialQuery);
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState(initialItems);
  const cacheRef = useRef(new Map<string, ItemWithCategory[]>());
  const abortRef = useRef<AbortController | null>(null);

  // Seed cache + stay in sync when RSC revalidates (e.g. after delete)
  useEffect(() => {
    cacheRef.current.clear();
    cacheRef.current.set(cacheKey(initialCategory, initialQuery), initialItems);
    setCategories(initialCategories);
    setItems(initialItems);
    setCategory(initialCategory);
  }, [initialCategories, initialItems, initialCategory, initialQuery]);

  const fetchItems = useCallback(async (slug: string | undefined, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (slug) params.set("category", slug);
    if (query?.trim()) params.set("q", query.trim());
    const qs = params.toString();
    const res = await fetch(qs ? `/api/items?${qs}` : "/api/items", {
      cache: "no-store",
      signal,
    });
    if (!res.ok) throw new Error("items fetch failed");
    const json = (await res.json()) as { items: ItemWithCategory[] };
    return json.items;
  }, [query]);

  const prefetch = useCallback(
    (slug: string | undefined) => {
      const key = cacheKey(slug, query);
      if (cacheRef.current.has(key)) return;
      void fetchItems(slug)
        .then((next) => {
          cacheRef.current.set(key, next);
        })
        .catch(() => undefined);
    },
    [fetchItems, query],
  );

  // Warm adjacent categories for snappy swipe / click
  useEffect(() => {
    if (query?.trim()) return;
    const sequence = [undefined, ...categories.map((c) => c.slug)];
    const idx = sequence.indexOf(category);
    const safe = idx < 0 ? 0 : idx;
    for (const offset of [-1, 1]) {
      const next = sequence[safe + offset];
      if (next !== undefined || safe + offset === 0) {
        prefetch(sequence[safe + offset]);
      }
    }
  }, [category, categories, prefetch, query]);

  const loadCategory = useCallback(
    (slug: string | undefined) => {
      if (slug === category) return;

      // Instant UI + URL without RSC round-trip
      setCategory(slug);
      window.history.replaceState(window.history.state, "", hrefFor(slug, query));

      const key = cacheKey(slug, query);
      const cached = cacheRef.current.get(key);
      if (cached) {
        setItems(cached);
        return;
      }

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      startTransition(async () => {
        try {
          const next = await fetchItems(slug, ac.signal);
          if (ac.signal.aborted) return;
          cacheRef.current.set(key, next);
          setItems(next);
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
          // Fallback: full refresh if API fails
          window.location.href = hrefFor(slug, query);
        }
      });
    },
    [category, fetchItems, query],
  );

  const total = categories.reduce((sum, c) => sum + c.itemCount, 0);
  const active = categories.find((c) => c.slug === category);

  return (
    <AppShell
      categories={categories}
      activeCategorySlug={category}
      totalItems={total}
      searchQuery={query}
      user={user}
      title={active ? active.name : "Каталог"}
      subtitle={catalogSubtitle(active, total, query, items.length)}
      onSelectCategory={loadCategory}
    >
      <CategorySwipe
        categorySlugs={categories.map((c) => c.slug)}
        activeSlug={category}
        searchQuery={query}
        onSelectCategory={loadCategory}
      >
        <div
          className={`mb-5 transition-opacity lg:mb-6 ${pending ? "opacity-70" : "opacity-100"}`}
        >
          <CatalogSearch query={query} category={category} />
        </div>
        {active ? (
          <CategoryHero
            slug={active.slug}
            name={active.name}
            emoji={active.emoji}
            itemCount={active.itemCount}
          />
        ) : (
          <p className="mb-3 text-xs text-ink-faint lg:hidden">
            Свайп вправо — следующая категория, влево — предыдущая
          </p>
        )}
        <div className={pending ? "opacity-70 transition-opacity" : "transition-opacity"}>
          {items.length === 0 ? (
            query ? (
              <SearchEmptyState query={query} category={category} />
            ) : (
              <EmptyState />
            )
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </CategorySwipe>
    </AppShell>
  );
}
