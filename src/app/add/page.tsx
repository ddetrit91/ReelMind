export const instant = false;

import { AppShell } from "@/components/AppShell";
import { AddLinkForm } from "@/components/AddLinkForm";
import { requireUser } from "@/lib/auth/session";
import { getCategoriesForUi } from "@/lib/data/ui-data";

export default async function AddPage() {
  const user = await requireUser("/add");
  const categories = await getCategoriesForUi(user.id);
  const total = categories.reduce((sum, c) => sum + c.itemCount, 0);

  return (
    <AppShell
      title="Добавить"
      subtitle="Instagram, YouTube, статья или любой URL. Заметка помогает точнее выбрать категорию."
      categories={categories}
      totalItems={total}
      user={user}
    >
      <AddLinkForm categories={categories} />
    </AppShell>
  );
}
