export const instant = false;

import { AppShell } from "@/components/AppShell";
import { AddLinkFormHost } from "@/components/AddLinkFormHost";
import { requireUser } from "@/lib/auth/session";
import { getCategoriesForUi } from "@/lib/data/ui-data";
import { noteFromSharePayload } from "@/lib/links/share-content";

type PageProps = {
  searchParams: Promise<{ url?: string; text?: string; title?: string }>;
};

export default async function AddPage({ searchParams }: PageProps) {
  const [user, params] = await Promise.all([requireUser("/add"), searchParams]);
  const categories = await getCategoriesForUi(user.id);
  const { url: initialUrl, note } = noteFromSharePayload(params);

  return (
    <AppShell
      title="Добавить"
      subtitle="Instagram, YouTube, статья или любой URL. Заметка помогает точнее выбрать категорию."
      categories={categories}
      totalItems={categories.reduce((sum, c) => sum + c.itemCount, 0)}
      user={user}
    >
      <AddLinkFormHost
        categories={categories}
        initialUrl={initialUrl ?? ""}
        initialText={note}
      />
    </AppShell>
  );
}
