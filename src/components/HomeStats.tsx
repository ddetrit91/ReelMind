import type { CategoryWithCount } from "@/lib/data/items";

type Props = {
  total: number;
  categories: CategoryWithCount[];
  activeSlug?: string;
};

export function HomeStats({ total, categories, activeSlug }: Props) {
  const active = categories.find((c) => c.slug === activeSlug);

  return (
    <div className="card-surface mb-6 flex flex-wrap items-end justify-between gap-4 rounded-[var(--radius-lg)] px-4 py-4 lg:px-6 lg:py-5">
      <div>
        <p className="text-sm text-ink-muted">
          {active ? `Категория «${active.name}»` : "Весь архив"}
        </p>
        <p className="font-display mt-1 text-3xl font-medium tabular-nums text-ink lg:text-4xl">
          {active ? active.itemCount : total}
        </p>
        <p className="mt-1 text-xs text-ink-faint">
          {active ? "сохранений в категории" : "сохранений всего"}
        </p>
      </div>
      <p className="max-w-xs text-sm leading-relaxed text-ink-muted">
        Найдите нужный Reels за секунды — без бесконечной ленты Instagram.
      </p>
    </div>
  );
}
