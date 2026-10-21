"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

import { CategoryDot } from "@/components/icons";
import { categoryColor } from "@/lib/categories";
import type { CategoryWithCount } from "@/lib/data/items";

type Props = {
  categories: CategoryWithCount[];
  activeSlug?: string;
  totalCount: number;
  variant: "sidebar" | "rail";
  searchQuery?: string;
  /** Soft client navigation — skips full RSC reload when provided. */
  onSelectCategory?: (slug: string | undefined) => void;
};

function catalogHref(category?: string, searchQuery?: string) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  const q = searchQuery?.trim();
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function CategoryNav({
  categories,
  activeSlug,
  totalCount,
  variant,
  searchQuery,
  onSelectCategory,
}: Props) {
  const softNav = Boolean(onSelectCategory);
  const linkClass = (active: boolean) =>
    [
      "focus-ring transition-colors",
      active
        ? "bg-accent text-white"
        : "bg-surface text-ink-muted hover:bg-accent-soft hover:text-ink",
      variant === "sidebar"
        ? "flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm min-h-11"
        : "inline-flex shrink-0 items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm min-h-11",
    ].join(" ");

  function handleClick(event: MouseEvent<HTMLAnchorElement>, slug?: string) {
    if (!onSelectCategory) return;
    // Keep native open-in-new-tab / modified clicks
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    onSelectCategory(slug);
  }

  if (variant === "rail") {
    return (
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
        <Link
          href={catalogHref(undefined, searchQuery)}
          prefetch={!softNav}
          scroll={false}
          onClick={(e) => handleClick(e, undefined)}
          className={linkClass(!activeSlug)}
        >
          Все
          <span className="tabular-nums text-xs opacity-80">{totalCount}</span>
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={catalogHref(cat.slug, searchQuery)}
            prefetch={!softNav}
            scroll={false}
            onClick={(e) => handleClick(e, cat.slug)}
            className={linkClass(activeSlug === cat.slug)}
          >
            {!activeSlug || activeSlug !== cat.slug ? (
              <CategoryDot color={categoryColor(cat.slug)} />
            ) : null}
            {cat.name}
            <span className="tabular-nums text-xs opacity-80">{cat.itemCount}</span>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <nav className="hidden lg:flex lg:flex-col lg:gap-1" aria-label="Категории">
      <Link
        href={catalogHref(undefined, searchQuery)}
        prefetch={!softNav}
        scroll={false}
        onClick={(e) => handleClick(e, undefined)}
        className={linkClass(!activeSlug)}
      >
        <span className="font-medium">Все</span>
        <span className="tabular-nums text-xs opacity-80">{totalCount}</span>
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={catalogHref(cat.slug, searchQuery)}
          prefetch={!softNav}
          scroll={false}
          onClick={(e) => handleClick(e, cat.slug)}
          className={linkClass(activeSlug === cat.slug)}
        >
          <span className="flex items-center gap-2 font-medium">
            {activeSlug !== cat.slug ? <CategoryDot color={categoryColor(cat.slug)} /> : null}
            {cat.name}
          </span>
          <span className="tabular-nums text-xs opacity-80">{cat.itemCount}</span>
        </Link>
      ))}
    </nav>
  );
}
