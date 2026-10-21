"use client";

import { memo } from "react";

import { CategoryHero } from "@/components/CategoryHero";
import { EmptyState } from "@/components/EmptyState";
import { ItemCard } from "@/components/ItemCard";
import { SearchEmptyState } from "@/components/SearchEmptyState";
import type { CategoryWithCount, ItemWithCategory } from "@/lib/data/items";

type Props = {
  items: ItemWithCategory[];
  active: CategoryWithCount | undefined;
  category: string | undefined;
  query: string | undefined;
  onRemoveItem: (id: string) => void;
};

export const CatalogGrid = memo(function CatalogGrid({
  items,
  active,
  category,
  query,
  onRemoveItem,
}: Props) {
  const q = query?.trim();

  return (
    <>
      {active && !q ? (
        <CategoryHero
          slug={active.slug}
          name={active.name}
          emoji={active.emoji}
          itemCount={active.itemCount}
        />
      ) : !active && !q ? (
        <p className="mb-3 text-xs text-ink-faint lg:hidden">
          Свайп вправо — следующая категория, влево — предыдущая
        </p>
      ) : null}
      {items.length === 0 ? (
        q ? (
          <SearchEmptyState query={q} category={category} />
        ) : (
          <EmptyState />
        )
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-4 [contain:layout]">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onDeleted={onRemoveItem} />
          ))}
        </div>
      )}
    </>
  );
});
