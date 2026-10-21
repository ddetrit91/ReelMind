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

type CatalogPayload = {
  items: ItemWithCategory[];
  categories: CategoryWithCount[];
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
  const categoriesRef = useRef(initialCategories);
  const categoryRef = useRef(initialCategory);
  const softNavRef = useRef(false);

  // Merge SSR updates without wiping a soft-nav selection (history.replaceState
  // does not update Next searchParams, so refresh can still send the old tab).
  useEffect(() => {
    categoriesRef.current = initialCategories;
    cacheRef.current.set(cacheKey(initialCategory, initialQuery), initialItems);
    setCategories(initialCategories);

    if (!softNavRef.current || categoryRef.current === initialCategory) {
      softNavRef.current = false;
      categoryRef.current = initialCategory;
      setCategory(initialCategory);
      setItems(initialItems);
    }
  }, [initialCategories, initialItems, initialCategory, initialQuery]);

  const fetchCatalog = useCallback(
    async (slug: string | undefined, signal?: AbortSignal): Promise<CatalogPayload> => {
      const params = new URLSearchParams();
      if (slug) params.set("category", slug);
      if (query?.trim()) params.set("q", query.trim());
      const qs = params.toString();
      const itemsUrl = qs ? `/api/items?${qs}` : "/api/items";

      const [itemsRes, catsRes] = await Promise.all([
        fetch(itemsUrl, { cache: "no-store", signal }),
        fetch("/api/categories", { cache: "no-store", signal }),
      ]);
      if (!itemsRes.ok || !catsRes.ok) throw new Error("catalog fetch failed");

      const itemsJson = (await itemsRes.json()) as { items: ItemWithCategory[] };
      const catsJson = (await catsRes.json()) as { categories: CategoryWithCount[] };
      return { items: itemsJson.items, categories: catsJson.categories };
    },
    [query],
  );

  const applyCatalog = useCallback(
    (slug: string | undefined, payload: CatalogPayload) => {
      const key = cacheKey(slug, query);
      cacheRef.current.set(key, payload.items);
      // Drop sibling caches so "Все" cannot keep a list from before this tab's data.
      for (const existing of [...cacheRef.current.keys()]) {
        if (existing !== key) cacheRef.current.delete(existing);
      }
      categoriesRef.current = payload.categories;
      setCategories(payload.categories);
      setItems(payload.items);
    },
    [query],
  );

  const loadCategory = useCallback(
    (slug: string | undefined) => {
      if (slug === categoryRef.current) return;

      softNavRef.current = true;
      categoryRef.current = slug;
      setCategory(slug);
      window.history.replaceState(window.history.state, "", hrefFor(slug, query));

      const key = cacheKey(slug, query);
      const cached = cacheRef.current.get(key);
      if (cached) {
        setItems(cached);
      }

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      // Always revalidate — cached list may predate a newly added item.
      startTransition(async () => {
        try {
          const payload = await fetchCatalog(slug, ac.signal);
          if (ac.signal.aborted) return;
          applyCatalog(slug, payload);
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
          window.location.href = hrefFor(slug, query);
        }
      });
    },
    [applyCatalog, fetchCatalog, query],
  );

  // Prefetch adjacent tabs (items only); full revalidate still runs on select.
  useEffect(() => {
    if (query?.trim()) return;
    const sequence: (string | undefined)[] = [undefined, ...categories.map((c) => c.slug)];
    const idx = sequence.indexOf(category);
    const safe = idx < 0 ? 0 : idx;
    for (const offset of [-1, 1] as const) {
      const targetIdx = safe + offset;
      if (targetIdx < 0 || targetIdx >= sequence.length) continue;
      const slug = sequence[targetIdx];
      const key = cacheKey(slug, query);
      if (cacheRef.current.has(key)) continue;
      void fetch(`/api/items${slug ? `?category=${encodeURIComponent(slug)}` : ""}`, {
        cache: "no-store",
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((json: { items: ItemWithCategory[] } | null) => {
          if (!json) return;
          if (!cacheRef.current.has(key)) {
            cacheRef.current.set(key, json.items);
          }
        })
        .catch(() => undefined);
    }
  }, [category, categories, query]);

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
