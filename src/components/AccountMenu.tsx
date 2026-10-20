import { logoutAction } from "@/lib/auth/actions";
import type { AuthUser } from "@/lib/auth/session";

export function AccountMenu({ user }: { user: AuthUser }) {
  return (
    <div className="flex items-center gap-3">
      <p className="hidden min-w-0 flex-1 truncate text-sm text-ink-muted lg:block" title={user.email}>
        {user.name}
      </p>
      <form action={logoutAction}>
        <button
          type="submit"
          className="focus-ring min-h-11 rounded-[var(--radius-sm)] px-3 text-sm font-medium text-ink-muted hover:text-ink"
        >
          Выйти
        </button>
      </form>
    </div>
  );
}
