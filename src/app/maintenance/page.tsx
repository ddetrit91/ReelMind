export const instant = false;

import Link from "next/link";

import { ThemeToggle } from "@/components/ThemeToggle";
import { getCurrentUser } from "@/lib/auth/session";

export default async function MaintenancePage() {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-16">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="card-surface max-w-md rounded-[var(--radius-lg)] p-7 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Сервис на паузе</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Идёт обслуживание. Сохранения временно недоступны. Если вы администратор — войдите и отключите режим в настройках.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {user?.role === "admin" ? (
            <Link href="/admin" className="btn-primary focus-ring inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] text-sm font-semibold">
              Открыть админку
            </Link>
          ) : (
            <Link href="/login" className="btn-primary focus-ring inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] text-sm font-semibold">
              Войти
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
