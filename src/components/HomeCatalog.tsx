"use client";

import { useRouter } from "next/navigation";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AppShell } from "@/components/AppShell";
import { CatalogGrid } from "@/components/CatalogGrid";
import { CatalogSearch } from "@/components/CatalogSearch";
import { CategorySwipe } from "@/components/CategorySwipe";
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

function indexItemsByCategory(all: ItemWithCategory[]) {
  const bySlug = new Map<string, ItemWithCategory[]>();
  for (const item of all) {
    const bucket = bySlug.get(item.categorySlug);
    if (bucket) bucket.push(item);
    else bySlug.set(item.categorySlug, [item]);
  }
  return bySlug;
}

function readCatalogParams() {
  if (typeof window === "undefined") {
    return { category: undefined as string | undefined, query: undefined as string | undefined };
  }
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category") || undefined;
  const query = params.get("q")?.trim() || undefined;
  return { category, query };
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
  const interactingRef = useRef(false);
  const interactTimerRef = useRef<number | null>(null);

  useEffect(() => {
    allRef.current = initialItems;
    setCategories(initialCategories);
    setAllItems(initialItems);
    categoryRef.current = initialCategory;
    queryRef.current = initialQuery;
    setCategory(initialCategory);
    setQuery(initialQuery);
  }, [initialCategories, initialItems, initialCategory, initialQuery]);

  const itemsByCategory = useMemo(() => indexItemsByCategory(allItems), [allItems]);

  const items = useMemo(() => {
    const inCat = category ? itemsByCategory.get(category) ?? [] : allItems;
    return filterItemsByKeyword(inCat, query);
  }, [allItems, category, query, itemsByCategory]);

  const markInteracting = useCallback(() => {
    interactingRef.current = true;
    if (interactTimerRef.current != null) {
      window.clearTimeout(interactTimerRef.current);
    }
    interactTimerRef.current = window.setTimeout(() => {
      interactingRef.current = false;
    }, 1200);
  }, []);

  const loadCategory = useCallback(
    (slug: string | undefined) => {
      if (slug === categoryRef.current) return;
      markInteracting();
      categoryRef.current = slug;
      startTransition(() => {
        setCategory(slug);
      });
      window.history.replaceState(window.history.state, "", hrefFor(slug, queryRef.current));
    },
    [markInteracting],
  );

  const runSearch = useCallback(
    (nextQuery: string) => {
      markInteracting();
      const q = nextQuery.trim() || undefined;
      queryRef.current = q;
      startTransition(() => {
        setQuery(q);
      });
      window.history.replaceState(window.history.state, "", hrefFor(categoryRef.current, q));
    },
    [markInteracting],
  );

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
    const onPopState = () => {
      const { category: cat, query: q } = readCatalogParams();
      categoryRef.current = cat;
      queryRef.current = q;
      startTransition(() => {
        setCategory(cat);
        setQuery(q);
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
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

  // Quiet background refresh — one round-trip, never during active category swipe.
  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (cancelled || interactingRef.current) return;
      void fetch("/api/catalog", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then(
          (json: { categories?: CategoryWithCount[]; items?: ItemWithCategory[] } | null) => {
            if (cancelled || interactingRef.current || !json?.items || !json.categories) return;
            allRef.current = json.items;
            startTransition(() => {
              setAllItems(json.items!);
              setCategories(json.categories!);
            });
          },
        )
        .catch(() => undefined);
    };

    const t = window.setTimeout(run, 2500);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      if (interactTimerRef.current != null) {
        window.clearTimeout(interactTimerRef.current);
      }
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
        <CatalogGrid
          items={items}
          active={active}
          category={category}
          query={query}
          onRemoveItem={removeItem}
        />
      </CategorySwipe>
    </AppShell>
  );
}
