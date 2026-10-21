"use client";

import Link from "next/link";
import { useState } from "react";

import { DeleteItemButton } from "@/components/DeleteItemButton";
import { ItemThumbnail } from "@/components/ItemThumbnail";
import { CategoryDot } from "@/components/icons";
import { categoryColor } from "@/lib/categories";
import type { ItemWithCategory } from "@/lib/data/items";
import { cleanDisplayTitle } from "@/lib/links/display-text";
import { sourceLabel } from "@/lib/links/parse-url";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

function mediaLabel(item: ItemWithCategory) {
  return sourceLabel(item.sourceKind, item.mediaKind);
}

type Props = {
  item: ItemWithCategory;
};

export function ItemCard({ item }: Props) {
  const [gone, setGone] = useState(false);
  const label = cleanDisplayTitle(item.title ?? item.aiSummary, {
    sourceKind: item.sourceKind,
    shareText: item.shareText,
    fallback: sourceLabel(item.sourceKind, item.mediaKind),
  });
  const color = categoryColor(item.categorySlug);

  if (gone) return null;

  return (
    <article
      className="card-surface group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)]"
      data-item-id={item.id}
    >
      <DeleteItemButton
        itemId={item.id}
        onDeleted={() => setGone(true)}
      />
      <Link href={`/items/${item.id}`} className="focus-ring flex flex-col" prefetch>
        {/* Единый размер карточек в сетке (Instagram больше не выше YouTube). */}
        <div className="relative aspect-[4/5] overflow-hidden bg-paper-deep lg:aspect-[4/5]">
          <div className="h-full w-full transition duration-300 group-hover:scale-[1.03]">
            <ItemThumbnail
              thumbnailUrl={item.thumbnailUrl}
              categorySlug={item.categorySlug}
              categoryEmoji={item.categoryEmoji}
              categoryName={item.categoryName}
              title={label}
              sourceKind={item.sourceKind}
              mediaKind={item.mediaKind}
              contentType={item.contentType}
              className="h-full w-full"
              aspectClassName="min-h-full"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-3 pt-16">
            <p className="font-display text-[0.95rem] font-semibold leading-snug text-white line-clamp-2">
              {label}
            </p>
          </div>
          <span className="absolute left-2.5 top-2.5 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-surface/92 px-2.5 text-[11px] font-medium text-ink backdrop-blur-sm">
            <CategoryDot color={color} />
            {item.categoryName}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 text-xs text-ink-faint">
          <span>{mediaLabel(item)}</span>
          <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
        </div>
      </Link>
    </article>
  );
}
