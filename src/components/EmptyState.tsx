import Link from "next/link";

import { BookmarkMark, PlusIcon } from "@/components/icons";

export function EmptyState() {
  return (
    <div className="card-surface flex flex-col items-center gap-5 rounded-[var(--radius-lg)] px-6 py-16 text-center">
      <BookmarkMark className="h-14 w-14 text-accent" />
      <div className="max-w-sm space-y-2">
        <h2 className="font-display text-xl font-semibold text-ink">Пока пусто</h2>
        <p className="text-sm leading-relaxed text-ink-muted">
          Вставьте ссылку — Instagram, YouTube или любой сайт. Мы сохраним её и разложим по категории.
        </p>
      </div>
      <Link
        href="/add"
        className="btn-primary focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] px-6 py-3 text-sm font-semibold"
      >
        <PlusIcon className="h-4 w-4" />
        Добавить первую ссылку
      </Link>
    </div>
  );
}
