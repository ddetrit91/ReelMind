export const instant = false;

import { HomeCatalog } from "@/components/HomeCatalog";
import { requireUser } from "@/lib/auth/session";
import { getCatalogForUi } from "@/lib/data/ui-data";

type PageProps = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const [user, params] = await Promise.all([requireUser("/"), searchParams]);
  const { categories, items } = await getCatalogForUi(user.id);

  return (
    <HomeCatalog
      user={user}
      initialCategories={categories}
      initialItems={items}
      initialCategory={params.category}
      initialQuery={params.q?.trim()}
    />
  );
}
