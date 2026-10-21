export const instant = false;

import { AppShell } from "@/components/AppShell";
import { AddLinkForm } from "@/components/AddLinkForm";
import { requireUser } from "@/lib/auth/session";
import { CATEGORY_SEED } from "@/lib/categories";
import { noteFromSharePayload } from "@/lib/links/share-content";

type PageProps = {
  searchParams: Promise<{ url?: string; text?: string; title?: string }>;
};

export default async function AddPage({ searchParams }: PageProps) {
  const [user, params] = await Promise.all([requireUser("/add"), searchParams]);

  const categories = CATEGORY_SEED.map((cat) => ({
    id: cat.id,
    slug: cat.slug,
    name: cat.name,
    emoji: cat.emoji,
    sortOrder: cat.sortOrder,
    itemCount: 0,
  }));

  const { url: initialUrl, note } = noteFromSharePayload(params);

  return (
    <AppShell
      title="Добавить"
      subtitle="Если Instagram не отдал описание — напишите заметку: из неё сделаем заголовок."
      categories={categories}
      totalItems={0}
      user={user}
    >
      <AddLinkForm
        categories={categories}
        initialUrl={initialUrl ?? ""}
        initialText={note}
      />
    </AppShell>
  );
}
