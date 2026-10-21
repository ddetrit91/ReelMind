"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useRef, useState } from "react";

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
  onDeleted?: (itemId: string) => void;
};

export const ItemCard = memo(function ItemCard({ item, onDeleted }: Props) {
  const router = useRouter();
  const detailPrefetched = useRef(false);
  const [gone, setGone] = useState(false);
  const label = cleanDisplayTitle(item.title ?? item.caption ?? item.aiSummary, {
    sourceKind: item.sourceKind,
    shareText: item.shareText ?? item.caption,
    fallback: sourceLabel(item.sourceKind, item.mediaKind),
  });
  const color = categoryColor(item.categorySlug);

  if (gone) return null;

  function warmDetailPage() {
    if (detailPrefetched.current) return;
    detailPrefetched.current = true;
    router.prefetch(`/items/${item.id}`);
  }

  return (
    <article
      className="card-surface group relative flex flex-col overflow-hidden rounded-[var(--radius-md)] [content-visibility:auto] [contain-intrinsic-size:auto_220px]"
      data-item-id={item.id}
    >
      <DeleteItemButton
        itemId={item.id}
        onDeleteStart={() => setGone(true)}
        onDeleteFailed={() => setGone(false)}
        onDeleted={onDeleted}
      />
      <Link
        href={`/items/${item.id}`}
        className="focus-ring flex flex-col"
        prefetch={false}
        onMouseEnter={warmDetailPage}
        onFocus={warmDetailPage}
      >
        {/* Compact landscape cards — same size for every source/category */}
        <div className="relative aspect-[16/10] overflow-hidden bg-paper-deep lg:aspect-video">
          <div className="h-full w-full lg:transition lg:duration-300 lg:group-hover:scale-[1.03]">
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
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-2.5 pb-2 pt-10">
            <p className="font-display text-[0.8rem] font-semibold leading-snug text-white line-clamp-2 lg:text-sm">
              {label}
            </p>
          </div>
          <span className="absolute left-2 top-2 inline-flex min-h-7 items-center gap-1.5 rounded-full bg-surface/92 px-2 text-[10px] font-medium text-ink backdrop-blur-sm lg:text-[11px]">
            <CategoryDot color={color} />
            {item.categoryName}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 px-2.5 py-2 text-[11px] text-ink-faint lg:text-xs">
          <span>{mediaLabel(item)}</span>
          <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
        </div>
      </Link>
    </article>
  );
});
