export const instant = false;

import { AppShell } from "@/components/AppShell";
import { CatalogSearch } from "@/components/CatalogSearch";
import { CategoryHero } from "@/components/CategoryHero";
import { CategorySwipe } from "@/components/CategorySwipe";
import { EmptyState } from "@/components/EmptyState";
import { ItemCard } from "@/components/ItemCard";
import { SearchEmptyState } from "@/components/SearchEmptyState";
import { requireUser } from "@/lib/auth/session";
import { getCatalogForUi } from "@/lib/data/ui-data";

type PageProps = {
  searchParams: Promise<{ category?: string; q?: string }>;
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
      ? `${resultCount} по запросу «${q}» — слова, описание и смысл`
      : `Нет результатов по «${q}»`;
  }
  if (active) return `${active.itemCount} сохранений в этой категории`;
  return `${total} сохранений — ищите по категории, не по ленте`;
}

export default async function HomePage({ searchParams }: PageProps) {
  const user = await requireUser("/");
  const { category, q } = await searchParams;
  const query = q?.trim();
  const { categories, items } = await getCatalogForUi(user.id, category, query);

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
    >
      <CategorySwipe
        categorySlugs={categories.map((c) => c.slug)}
        activeSlug={category}
        searchQuery={query}
      >
        <div className="mb-5 lg:mb-6">
          <CatalogSearch query={query} category={category} />
        </div>
        {active ? (
          <CategoryHero
            slug={active.slug}
            name={active.name}
            emoji={active.emoji}
            itemCount={active.itemCount}
          />
        ) : (
          <p className="mb-3 text-xs text-ink-faint lg:hidden">
            Свайп вправо — следующая категория, влево — предыдущая
          </p>
        )}
        {items.length === 0 ? (
          query ? (
            <SearchEmptyState query={query} category={category} />
          ) : (
            <EmptyState />
          )
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </CategorySwipe>
    </AppShell>
  );
}
