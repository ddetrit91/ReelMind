export const instant = false;

import { connection } from "next/server";

import { AdminPage } from "@/components/admin/AdminPage";
import { AppShell } from "@/components/AppShell";
import { ensureBootstrapAdmin } from "@/lib/admin/adminService";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminRoutePage() {
  await connection();
  await ensureBootstrapAdmin();
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
