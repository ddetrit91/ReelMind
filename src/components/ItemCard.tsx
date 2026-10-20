import Link from "next/link";

import { DeleteItemButton } from "@/components/DeleteItemButton";
import { ItemThumbnail } from "@/components/ItemThumbnail";
import { CategoryDot } from "@/components/icons";
import { categoryColor } from "@/lib/categories";
import type { ItemWithCategory } from "@/lib/data/items";
import { sourceLabel } from "@/lib/links/parse-url";
import { isWidePreview } from "@/lib/media";

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
  const label = item.title ?? item.aiSummary ?? sourceLabel(item.sourceKind, item.mediaKind);
  const color = categoryColor(item.categorySlug);

  return (
    <div className="card-surface group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)]">
      <DeleteItemButton
        itemId={item.id}
        returnTo={item.categorySlug ? `/?category=${item.categorySlug}` : "/"}
      />
      <Link
        href={`/items/${item.id}`}
        className="focus-ring flex flex-col"
      >
      <div
        className={`relative overflow-hidden bg-paper-deep ${
          isWidePreview(item.sourceKind)
            ? "aspect-[16/10] lg:aspect-video"
            : "aspect-[4/5] lg:aspect-[4/5]"
        }`}
      >
        <div className="h-full w-full transition duration-300 group-hover:scale-[1.03]">
          <ItemThumbnail
            thumbnailUrl={item.thumbnailUrl}
            categorySlug={item.categorySlug}
            categoryEmoji={item.categoryEmoji}
            categoryName={item.categoryName}
            title={item.title}
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
    </div>
  );
}
