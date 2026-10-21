"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { CatalogSearch } from "@/components/CatalogSearch";
import { CategoryHero } from "@/components/CategoryHero";
import { CategorySwipe } from "@/components/CategorySwipe";
import { EmptyState } from "@/components/EmptyState";
import { ItemCard } from "@/components/ItemCard";
import { SearchEmptyState } from "@/components/SearchEmptyState";
import type { AuthUser } from "@/lib/auth/session";
import { CATEGORY_SEED, categoryCoverUrl } from "@/lib/categories";
import type { CategoryWithCount, ItemWithCategory } from "@/lib/data/items";
import { filterItemsByKeyword } from "@/lib/search/keyword-search";

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

function visibleItems(
  all: ItemWithCategory[],
  slug: string | undefined,
  query: string | undefined,
) {
  const inCat = slug ? all.filter((item) => item.categorySlug === slug) : all;
  return filterItemsByKeyword(inCat, query);
}

export function HomeCatalog({
  user,
  initialCategories,
  initialItems,
  initialCategory,
  initialQuery,
}: Props) {
  const router = useRouter();
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const [categories, setCategories] = useState(initialCategories);
  const [allItems, setAllItems] = useState(initialItems);
  const categoryRef = useRef(initialCategory);
  const queryRef = useRef(initialQuery);
  const allRef = useRef(initialItems);

  useEffect(() => {
    allRef.current = initialItems;
    setCategories(initialCategories);
    setAllItems(initialItems);
    categoryRef.current = initialCategory;
    queryRef.current = initialQuery;
    setCategory(initialCategory);
    setQuery(initialQuery);
  }, [initialCategories, initialItems, initialCategory, initialQuery]);

  const items = useMemo(
    () => visibleItems(allItems, category, query),
    [allItems, category, query],
  );

  const loadCategory = useCallback((slug: string | undefined) => {
    if (slug === categoryRef.current) return;
    categoryRef.current = slug;
    setCategory(slug);
    window.history.replaceState(window.history.state, "", hrefFor(slug, queryRef.current));
  }, []);

  const runSearch = useCallback((nextQuery: string) => {
    const q = nextQuery.trim() || undefined;
    queryRef.current = q;
    setQuery(q);
    window.history.replaceState(window.history.state, "", hrefFor(categoryRef.current, q));
  }, []);

  const removeItem = useCallback((id: string) => {
    setAllItems((prev) => {
      const removed = prev.find((item) => item.id === id);
      const next = prev.filter((item) => item.id !== id);
      allRef.current = next;
      if (removed) {
        setCategories((cats) =>
          cats.map((cat) =>
            cat.slug === removed.categorySlug
              ? { ...cat, itemCount: Math.max(0, cat.itemCount - 1) }
              : cat,
          ),
        );
      }
      return next;
    });
  }, []);

  useEffect(() => {
    router.prefetch("/add");
    if (user.role === "admin") router.prefetch("/admin");
    for (const cat of CATEGORY_SEED) {
      const img = new Image();
      img.decoding = "async";
      img.src = categoryCoverUrl(cat.slug);
    }
  }, [router, user.role]);

  // Quiet background refresh of the full list — never blocks swipe.
  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      void fetch("/api/items", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((json: { items?: ItemWithCategory[] } | null) => {
          if (cancelled || !json?.items) return;
          allRef.current = json.items;
          setAllItems(json.items);
        })
        .catch(() => undefined);
      void fetch("/api/categories", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((json: { categories?: CategoryWithCount[] } | null) => {
          if (cancelled || !json?.categories) return;
          setCategories(json.categories);
        })
        .catch(() => undefined);
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

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
        <div className="mb-5 lg:mb-6">
          <CatalogSearch query={query} category={category} onSearch={runSearch} />
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
        {items.length === 0 ? (
          query ? (
            <SearchEmptyState query={query} category={category} />
          ) : (
            <EmptyState />
          )
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} onDeleted={removeItem} />
            ))}
          </div>
        )}
      </CategorySwipe>
    </AppShell>
  );
}
