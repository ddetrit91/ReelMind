export const instant = false;

import { AdminPage } from "@/components/admin/AdminPage";
import { AppShell } from "@/components/AppShell";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminRoutePage() {
  const user = await requireAdmin();

  return (
    <AppShell
      title="Админка"
      subtitle="Пользователи, статистика сохранений и системные настройки"
      user={user}
      categories={[]}
      totalItems={0}
    >
      <AdminPage />
    </AppShell>
  );
}
