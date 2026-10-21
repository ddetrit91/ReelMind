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
import { filterItemsByKeyword } from "@/lib/search/keyword-search";

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
      ? `${resultCount} по запросу «${q}»`
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
  const [query, setQuery] = useState(initialQuery);
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState(initialItems);
  const cacheRef = useRef(new Map<string, ItemWithCategory[]>());
  const baseItemsRef = useRef<ItemWithCategory[]>(
    initialQuery?.trim() ? [] : initialItems,
  );
  const abortRef = useRef<AbortController | null>(null);
  const categoriesRef = useRef(initialCategories);
  const categoryRef = useRef(initialCategory);
  const queryRef = useRef(initialQuery);
  const softNavRef = useRef(false);

  useEffect(() => {
    categoriesRef.current = initialCategories;
    cacheRef.current.set(cacheKey(initialCategory, initialQuery), initialItems);
    setCategories(initialCategories);

    if (!softNavRef.current || categoryRef.current === initialCategory) {
      softNavRef.current = false;
      categoryRef.current = initialCategory;
      queryRef.current = initialQuery;
      setCategory(initialCategory);
      setQuery(initialQuery);
      setItems(initialItems);
      if (!initialQuery?.trim()) {
        baseItemsRef.current = initialItems;
      }
    }
  }, [initialCategories, initialItems, initialCategory, initialQuery]);

  const fetchCatalog = useCallback(
    async (
      slug: string | undefined,
      q: string | undefined,
      signal?: AbortSignal,
    ): Promise<CatalogPayload> => {
      const params = new URLSearchParams();
      if (slug) params.set("category", slug);
      if (q?.trim()) params.set("q", q.trim());
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
    [],
  );

  const applyCatalog = useCallback(
    (slug: string | undefined, q: string | undefined, payload: CatalogPayload) => {
      const key = cacheKey(slug, q);
      cacheRef.current.set(key, payload.items);
      for (const existing of [...cacheRef.current.keys()]) {
        if (existing !== key) cacheRef.current.delete(existing);
      }
      categoriesRef.current = payload.categories;
      setCategories(payload.categories);
      setItems(payload.items);
      if (!q?.trim()) {
        baseItemsRef.current = payload.items;
      }
    },
    [],
  );

  const loadCategory = useCallback(
    (slug: string | undefined) => {
      if (slug === categoryRef.current && !queryRef.current?.trim()) return;

      softNavRef.current = true;
      categoryRef.current = slug;
      setCategory(slug);
      // Keep active search when switching tabs
      window.history.replaceState(
        window.history.state,
        "",
        hrefFor(slug, queryRef.current),
      );

      const key = cacheKey(slug, queryRef.current);
      const cached = cacheRef.current.get(key);
      if (cached) {
        setItems(cached);
      } else if (queryRef.current?.trim() && baseItemsRef.current.length) {
        // Instant local filter while network catches up
        setItems(filterItemsByKeyword(baseItemsRef.current, queryRef.current));
      }

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      startTransition(async () => {
        try {
          const payload = await fetchCatalog(slug, queryRef.current, ac.signal);
          if (ac.signal.aborted) return;
          applyCatalog(slug, queryRef.current, payload);
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
          window.location.href = hrefFor(slug, queryRef.current);
        }
      });
    },
    [applyCatalog, fetchCatalog],
  );

  const runSearch = useCallback(
    (nextQuery: string) => {
      softNavRef.current = true;
      const q = nextQuery.trim() || undefined;
      queryRef.current = q;
      setQuery(q);
      window.history.replaceState(window.history.state, "", hrefFor(categoryRef.current, q));

      // Instant keyword filter on current base list
      if (q && baseItemsRef.current.length > 0) {
        setItems(filterItemsByKeyword(baseItemsRef.current, q));
      } else if (!q && baseItemsRef.current.length > 0) {
        setItems(baseItemsRef.current);
      }

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      startTransition(async () => {
        try {
          // If searching with empty base, load category first then filter via API
          if (!baseItemsRef.current.length) {
            const base = await fetchCatalog(categoryRef.current, undefined, ac.signal);
            if (ac.signal.aborted) return;
            baseItemsRef.current = base.items;
            setCategories(base.categories);
            categoriesRef.current = base.categories;
          }

          if (!q) {
            setItems(baseItemsRef.current);
            cacheRef.current.set(cacheKey(categoryRef.current, undefined), baseItemsRef.current);
            return;
          }

          // Local result already shown; sync with API keyword search (same algorithm)
          const payload = await fetchCatalog(categoryRef.current, q, ac.signal);
          if (ac.signal.aborted) return;
          applyCatalog(categoryRef.current, q, payload);
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
        }
      });
    },
    [applyCatalog, fetchCatalog],
  );

  useEffect(() => {
    if (query?.trim()) return;
    const sequence: (string | undefined)[] = [undefined, ...categories.map((c) => c.slug)];
    const idx = sequence.indexOf(category);
    const safe = idx < 0 ? 0 : idx;
    for (const offset of [-1, 1] as const) {
      const targetIdx = safe + offset;
      if (targetIdx < 0 || targetIdx >= sequence.length) continue;
      const slug = sequence[targetIdx];
      const key = cacheKey(slug, undefined);
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
          <CatalogSearch
            query={query}
            category={category}
            onSearch={runSearch}
            pending={pending}
          />
        </div>
        {active && !query?.trim() ? (
          <CategoryHero
            slug={active.slug}
            name={active.name}
            emoji={active.emoji}
            itemCount={active.itemCount}
          />
        ) : !active && !query?.trim() ? (
          <p className="mb-3 text-xs text-ink-faint lg:hidden">
            Свайп вправо — следующая категория, влево — предыдущая
          </p>
        ) : null}
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
