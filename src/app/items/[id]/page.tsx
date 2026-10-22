export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { ItemThumbnail } from "@/components/ItemThumbnail";
import { CategorySelect } from "@/components/CategorySelect";
import { DeleteItemButton } from "@/components/DeleteItemButton";
import { ItemReadyPoller } from "@/components/ItemReadyPoller";
import { CategoryDot, ExternalIcon } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { categoryColor } from "@/lib/categories";
import { getCategoriesForUi, getItemForUi } from "@/lib/data/ui-data";
import { cleanDisplayTitle, isJunkTitle } from "@/lib/links/display-text";
import { openSourceLabel } from "@/lib/links/parse-url";
import { isWidePreview } from "@/lib/media";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export default async function ItemDetailPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;
  const [item, categories] = await Promise.all([
    getItemForUi(id, user.id),
    getCategoriesForUi(user.id),
  ]);

  if (!item) notFound();

  const total = categories.reduce((sum, c) => sum + c.itemCount, 0);
  const color = categoryColor(item.categorySlug);
  const usableNote =
    item.shareText?.trim() && !isJunkTitle(item.shareText, item.sourceKind)
      ? item.shareText.trim()
      : null;
  const noteAsTitle =
    usableNote &&
    (item.sourceKind === "instagram" ||
      item.sourceKind === "tiktok" ||
      item.sourceKind === "dzen")
      ? usableNote
      : null;
  const displayTitle = cleanDisplayTitle(item.title ?? item.caption, {
    sourceKind: item.sourceKind,
    shareText: noteAsTitle,
    fallback: "Сохранение",
  });
  const summaryText = item.aiSummary?.trim() || "";

  return (
    <AppShell
      title={displayTitle}
      categories={categories}
      activeCategorySlug={item.categorySlug}
      totalItems={total}
      user={user}
    >
      <div
        className={
          isWidePreview(item.sourceKind)
            ? "lg:grid lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-start lg:gap-10"
            : "lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-10"
        }
      >
        <div className="card-surface mx-auto w-full max-w-md overflow-hidden rounded-[var(--radius-lg)] lg:mx-0 lg:max-w-none">
          <ItemThumbnail
            thumbnailUrl={item.thumbnailUrl}
            categorySlug={item.categorySlug}
            categoryEmoji={item.categoryEmoji}
            categoryName={item.categoryName}
            title={displayTitle}
            hint={[item.caption, item.shareText, item.aiSummary].filter(Boolean).join("\n")}
            sourceKind={item.sourceKind}
            mediaKind={item.mediaKind}
            contentType={item.contentType}
            aspectClassName={
              isWidePreview(item.sourceKind)
                ? "aspect-video w-full"
                : "aspect-[4/5] w-full"
            }
          />
        </div>

        <div className="mt-6 space-y-6 lg:mt-1">
          <ItemReadyPoller itemId={item.id} status={item.status} />
          <div className="space-y-3">
            <p className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <CategoryDot color={color} />
                {item.categoryName}
              </span>
              <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
            </p>
            {summaryText ? (
              <p className="max-w-prose text-base leading-relaxed text-ink-muted">
                {summaryText}
              </p>
            ) : null}
            {usableNote && usableNote !== displayTitle.trim() && usableNote !== summaryText ? (
              <blockquote className="border-l-2 border-accent pl-4 text-sm leading-relaxed text-ink-muted">
                {usableNote}
              </blockquote>
            ) : null}
            {item.aiTags?.length ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {item.aiTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium text-ink"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="card-surface space-y-4 rounded-[var(--radius-lg)] p-5">
            <CategorySelect
              itemId={item.id}
              categories={categories}
              currentSlug={item.categorySlug}
            />
            <Link
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold"
            >
              {openSourceLabel(item.sourceKind)}
              <ExternalIcon className="h-4 w-4" />
            </Link>
            <DeleteItemButton
              itemId={item.id}
              variant="button"
              returnTo={item.categorySlug ? `/?category=${item.categorySlug}` : "/"}
            />
          </div>

          <Link
            href={item.categorySlug ? `/?category=${item.categorySlug}` : "/"}
            className="focus-ring inline-flex min-h-11 items-center text-sm font-medium text-accent hover:underline"
          >
            Назад к категории
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
