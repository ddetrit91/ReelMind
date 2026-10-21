export const instant = false;

import { AppShell } from "@/components/AppShell";
import { AddLinkForm } from "@/components/AddLinkForm";
import { requireUser } from "@/lib/auth/session";
import { getCategoriesForUi } from "@/lib/data/ui-data";
import { extractUrl } from "@/lib/links/parse-url";

type PageProps = {
  searchParams: Promise<{ url?: string; text?: string; title?: string }>;
};

export default async function AddPage({ searchParams }: PageProps) {
  const user = await requireUser("/add");
  const params = await searchParams;
  const categories = await getCategoriesForUi(user.id);
  const total = categories.reduce((sum, c) => sum + c.itemCount, 0);

  const initialUrl =
    extractUrl(params.url ?? "") ??
    extractUrl([params.text, params.title].filter(Boolean).join("\n")) ??
    "";
  const initialText = (params.text ?? params.title ?? "").trim();

  return (
    <AppShell
      title="Добавить"
      subtitle="Instagram, YouTube, статья или любой URL. На iPhone — через «Скопировать ссылку»."
      categories={categories}
      totalItems={total}
      user={user}
    >
      <AddLinkForm
        categories={categories}
        initialUrl={initialUrl}
        initialText={initialText && initialText !== initialUrl ? initialText : ""}
      />
    </AppShell>
  );
}
