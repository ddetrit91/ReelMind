import { categoryColor, categoryCoverUrl } from "@/lib/categories";
import { sourceLabel, type SourceKind } from "@/lib/links/parse-url";
import type { ItemThumbnailFields } from "@/lib/thumbnails";
import { itemThumbnailAlt } from "@/lib/thumbnails";

type Props = ItemThumbnailFields & {
  className?: string;
  aspectClassName?: string;
};

function mediaLabel(item: ItemThumbnailFields): string {
  return sourceLabel((item.sourceKind as SourceKind) ?? "other", item.mediaKind);
}

export function ItemThumbnail({
  thumbnailUrl,
  categorySlug,
  categoryEmoji,
  categoryName,
  title,
  mediaKind,
  contentType,
  className = "",
  aspectClassName = "aspect-[3/4]",
}: Props) {
  const alt = itemThumbnailAlt({
    thumbnailUrl,
    categorySlug,
    categoryEmoji,
    categoryName,
    title,
    mediaKind,
    contentType,
  });
  const color = categoryColor(categorySlug);
  const coverUrl = categoryCoverUrl(categorySlug);
  const imageUrl = thumbnailUrl || coverUrl;

  if (imageUrl) {
    return (
      <div className={`relative h-full w-full ${aspectClassName} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={alt} className="h-full w-full object-cover" />
        {!thumbnailUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/25 px-3 text-center">
            <span className="text-3xl" aria-hidden>
              {categoryEmoji}
            </span>
            <span className="font-display text-sm font-semibold text-white">{categoryName}</span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center ${aspectClassName} ${className}`}
      style={{
        background: `linear-gradient(145deg, ${color}22 0%, ${color}44 45%, var(--paper-deep) 100%)`,
      }}
      role="img"
      aria-label={alt}
    >
      <span className="text-4xl" aria-hidden>
        {categoryEmoji}
      </span>
      <span className="font-display text-sm font-semibold text-ink">{categoryName}</span>
      <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">
        {mediaLabel({ categorySlug, categoryEmoji, categoryName, mediaKind, contentType })}
      </span>
    </div>
  );
}
