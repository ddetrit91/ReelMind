import { logoutAction } from "@/lib/auth/actions";
import type { AuthUser } from "@/lib/auth/session";

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

type Props = {
  user: AuthUser;
  variant: "header" | "sidebar";
};

export function UserAccountBlock({ user, variant }: Props) {
  const initials = userInitials(user.name);

  if (variant === "sidebar") {
    return (
      <div className="w-full rounded-[var(--radius-md)] border border-line bg-paper/80 p-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-sm font-semibold text-accent"
            aria-hidden
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm text-ink" title={user.name}>
              {user.name}
            </p>
            <p className="truncate text-xs text-ink-faint" title={user.email}>
              {user.email}
            </p>
            {user.role === "admin" ? (
              <span className="mt-1 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
                Админ
              </span>
            ) : null}
          </div>
        </div>
        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="focus-ring inline-flex min-h-10 w-full items-center justify-center rounded-[var(--radius-sm)] border border-line px-3 text-sm font-medium text-ink-muted hover:bg-surface hover:text-ink"
          >
            Выйти
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex max-w-[min(100%,14rem)] items-center gap-2 sm:max-w-xs">
      <span
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-xs font-semibold text-accent"
        aria-hidden
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium text-ink" title={user.name}>
          {user.name}
        </p>
        {user.role === "admin" ? (
          <p className="truncate text-[11px] text-ink-faint">Администратор</p>
        ) : (
          <p className="hidden truncate text-[11px] text-ink-faint sm:block" title={user.email}>
            {user.email}
          </p>
        )}
      </div>
      <form action={logoutAction} className="shrink-0">
        <button
          type="submit"
          className="focus-ring inline-flex min-h-9 items-center rounded-[var(--radius-sm)] px-2 text-xs font-medium text-ink-muted hover:text-ink sm:px-3 sm:text-sm"
        >
          Выйти
        </button>
      </form>
    </div>
  );
}
