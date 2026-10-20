"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Globe,
  Plus,
  Settings,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

import { useToast } from "@/components/Toast";

type Tab = "users" | "stats" | "activity" | "settings";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  itemCount: number;
  createdAt: string;
  lastActiveAt: string | null;
};

type Stats = {
  totalUsers: number;
  activeToday: number;
  itemsToday: number;
  registrations: { day: string; count: number }[];
  saves: { day: string; count: number }[];
};

type ActivityRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  ip: string | null;
  city: string | null;
  userAgent: string | null;
};

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-medium ${
        role === "admin" ? "bg-accent-soft text-accent" : "bg-paper-deep text-ink-muted"
      }`}
    >
      {role === "admin" ? "admin" : "user"}
    </span>
  );
}

function Bars({ rows }: { rows: { day: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.day} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-3 text-sm">
          <span className="text-ink-faint">{row.day.slice(5)}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-paper-deep">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${Math.min((row.count / max) * 100, 100)}%` }}
            />
          </div>
          <span className="tabular-nums text-ink-muted">{row.count}</span>
        </div>
      ))}
    </div>
  );
}

export function AdminPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<ActivityRow[]>([]);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Не удалось загрузить пользователей");
    setUsers(data.users);
  }, []);

  useEffect(() => {
    loadUsers().catch((err) => toast("error", err.message));
  }, [loadUsers, toast]);

  useEffect(() => {
    if (tab === "stats") {
      fetch("/api/admin/stats")
        .then((r) => r.json())
        .then(setStats)
        .catch(() => toast("error", "Не удалось загрузить статистику"));
    }
    if (tab === "activity") {
      fetch("/api/admin/activity")
        .then((r) => r.json())
        .then((d) => setLogs(d.logs ?? []))
        .catch(() => toast("error", "Не удалось загрузить журнал"));
    }
    if (tab === "settings") {
      fetch("/api/admin/settings")
        .then((r) => r.json())
        .then((d) => {
          setAllowRegistration(Boolean(d.allowRegistration));
          setMaintenanceMode(Boolean(d.maintenanceMode));
        })
        .catch(() => toast("error", "Не удалось загрузить настройки"));
    }
  }, [tab, toast]);

  async function changeRole(id: string, role: "user" | "admin") {
    const res = await fetch(`/api/admin/users/${id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) return toast("error", data.error ?? "Ошибка");
    toast("success", "Роль обновлена");
    await loadUsers();
  }

  async function resetPassword(id: string) {
    const password = window.prompt("Новый временный пароль (от 6 символов)");
    if (!password) return;
    const res = await fetch(`/api/admin/users/${id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) return toast("error", data.error ?? "Ошибка");
    toast("success", "Пароль сброшен");
  }

  async function removeUser(id: string) {
    if (!window.confirm("Удалить пользователя и все его сохранения?")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return toast("error", data.error ?? "Ошибка");
    toast("success", "Пользователь удалён");
    await loadUsers();
  }

  async function createUser(form: FormData) {
    setBusy(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        role: String(form.get("role") ?? "user"),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return toast("error", data.error ?? "Ошибка");
    toast("success", "Пользователь создан");
    setCreateOpen(false);
    await loadUsers();
  }

  async function saveSettings(next: { allowRegistration: boolean; maintenanceMode: boolean }) {
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!res.ok) return toast("error", "Не удалось сохранить настройки");
    toast("success", "Настройки обновлены");
  }

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "users", label: "Пользователи", icon: Users },
    { id: "stats", label: "Статистика", icon: Activity },
    { id: "activity", label: "Активность", icon: Globe },
    { id: "settings", label: "Настройки", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Разделы админки">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`focus-ring inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium ${
                active ? "bg-accent text-white" : "bg-surface text-ink-muted hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {tab === "users" ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">Пользователи</h2>
              <p className="mt-1 text-sm text-ink-muted">Аккаунты и число их сохранений.</p>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="btn-primary focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              Создать пользователя
            </button>
          </div>

          <div className="space-y-3 lg:hidden">
            {users.map((user) => (
              <article key={user.id} className="card-surface rounded-[var(--radius-lg)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{user.name}</p>
                    <p className="text-sm text-ink-muted">{user.email}</p>
                  </div>
                  <RoleBadge role={user.role} />
                </div>
                <p className="mt-3 text-sm text-ink-muted">{user.itemCount} сохранений</p>
                <p className="text-xs text-ink-faint">Регистрация {formatDate(user.createdAt)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="focus-ring min-h-11 rounded-full border border-line px-3 text-xs"
                    onClick={() => changeRole(user.id, user.role === "admin" ? "user" : "admin")}
                  >
                    Сменить роль
                  </button>
                  <button
                    type="button"
                    className="focus-ring min-h-11 rounded-full border border-line px-3 text-xs"
                    onClick={() => resetPassword(user.id)}
                  >
                    Сброс пароля
                  </button>
                  <button
                    type="button"
                    className="focus-ring min-h-11 rounded-full border border-line px-3 text-xs text-red-500"
                    onClick={() => removeUser(user.id)}
                  >
                    Удалить
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="card-surface hidden overflow-x-auto rounded-[var(--radius-lg)] lg:block">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="border-b border-line text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Имя</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Роль</th>
                  <th className="px-4 py-3 font-medium">Сохранений</th>
                  <th className="px-4 py-3 font-medium">Регистрация</th>
                  <th className="px-4 py-3 font-medium">Активность</th>
                  <th className="px-4 py-3 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{user.name}</td>
                    <td className="px-4 py-3 text-ink-muted">{user.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3 tabular-nums">{user.itemCount}</td>
                    <td className="px-4 py-3 text-ink-muted">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-ink-muted">{formatDate(user.lastActiveAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="focus-ring min-h-11 min-w-11 rounded-[var(--radius-sm)] hover:bg-accent-soft"
                          title="Сменить роль"
                          onClick={() => changeRole(user.id, user.role === "admin" ? "user" : "admin")}
                        >
                          <Shield className="mx-auto h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="focus-ring min-h-11 min-w-11 rounded-[var(--radius-sm)] hover:bg-accent-soft"
                          title="Сброс пароля"
                          onClick={() => resetPassword(user.id)}
                        >
                          <UserPlus className="mx-auto h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="focus-ring min-h-11 min-w-11 rounded-[var(--radius-sm)] hover:bg-accent-soft"
                          title="Удалить"
                          onClick={() => removeUser(user.id)}
                        >
                          <Trash2 className="mx-auto h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "stats" && stats ? (
        <section className="space-y-6">
          <div className="grid gap-3 lg:grid-cols-3">
            {[
              ["Всего пользователей", stats.totalUsers],
              ["Активных сегодня", stats.activeToday],
              ["Сохранений сегодня", stats.itemsToday],
            ].map(([label, value]) => (
              <article key={String(label)} className="card-surface rounded-[var(--radius-lg)] p-5">
                <p className="text-sm text-ink-muted">{label}</p>
                <p className="font-display mt-2 text-3xl font-semibold tabular-nums text-ink">{value}</p>
              </article>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="card-surface rounded-[var(--radius-lg)] p-5">
              <h3 className="mb-4 font-medium text-ink">Регистрации за 14 дней</h3>
              <Bars rows={stats.registrations} />
            </article>
            <article className="card-surface rounded-[var(--radius-lg)] p-5">
              <h3 className="mb-4 font-medium text-ink">Сохранения за 14 дней</h3>
              <Bars rows={stats.saves} />
            </article>
          </div>
        </section>
      ) : null}

      {tab === "activity" ? (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-ink">Последние входы</h2>
          <div className="space-y-3 lg:hidden">
            {logs.map((log) => (
              <article key={log.id} className="card-surface rounded-[var(--radius-lg)] p-4">
                <p className="font-medium text-ink">{log.name}</p>
                <p className="text-sm text-ink-muted">{log.email}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
                  <Globe className="h-4 w-4" />
                  {log.ip ?? "—"} · {log.city ?? "—"}
                </p>
                <p className="text-xs text-ink-faint">{formatDate(log.createdAt)}</p>
              </article>
            ))}
          </div>
          <div className="card-surface hidden overflow-x-auto rounded-[var(--radius-lg)] lg:block">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="border-b border-line text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Пользователь</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Роль</th>
                  <th className="px-4 py-3 font-medium">Время</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 font-medium">Локация / устройство</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">{log.name}</td>
                    <td className="px-4 py-3 text-ink-muted">{log.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={log.role} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-paper-deep px-2.5 py-1 text-xs">
                        <Globe className="h-3.5 w-3.5" />
                        {log.ip ?? "—"}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-ink-muted" title={log.userAgent ?? ""}>
                      {log.city ?? "—"} · {log.userAgent ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "settings" ? (
        <section className="card-surface max-w-xl space-y-5 rounded-[var(--radius-lg)] p-5 lg:p-7">
          <h2 className="font-display text-xl font-semibold text-ink">Настройки</h2>
          <label className="flex min-h-11 items-center justify-between gap-4">
            <span className="text-sm text-ink">Разрешить свободную регистрацию</span>
            <input
              type="checkbox"
              checked={allowRegistration}
              className="h-5 w-5 accent-[var(--accent)]"
              onChange={(e) => {
                const next = { allowRegistration: e.target.checked, maintenanceMode };
                setAllowRegistration(e.target.checked);
                void saveSettings(next);
              }}
            />
          </label>
          <label className="flex min-h-11 items-center justify-between gap-4">
            <span className="text-sm text-ink">Режим обслуживания</span>
            <input
              type="checkbox"
              checked={maintenanceMode}
              className="h-5 w-5 accent-[var(--accent)]"
              onChange={(e) => {
                const next = { allowRegistration, maintenanceMode: e.target.checked };
                setMaintenanceMode(e.target.checked);
                void saveSettings(next);
              }}
            />
          </label>
        </section>
      ) : null}

      {createOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 px-4">
          <form
            className="card-surface w-full max-w-md space-y-4 rounded-[var(--radius-lg)] p-5"
            onSubmit={(e) => {
              e.preventDefault();
              void createUser(new FormData(e.currentTarget));
            }}
          >
            <h3 className="font-display text-lg font-semibold">Новый пользователь</h3>
            <label className="flex flex-col gap-1 text-sm">
              Имя
              <input name="name" required minLength={2} className="focus-ring min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-3" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Email
              <input name="email" type="email" required className="focus-ring min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-3" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Пароль
              <input name="password" type="password" required minLength={6} className="focus-ring min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-3" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Роль
              <select name="role" className="focus-ring min-h-11 rounded-[var(--radius-sm)] border border-line bg-paper px-3">
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="btn-primary focus-ring min-h-11 flex-1 rounded-[var(--radius-md)] text-sm font-semibold">
                Создать
              </button>
              <button type="button" className="focus-ring min-h-11 flex-1 rounded-[var(--radius-md)] border border-line" onClick={() => setCreateOpen(false)}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
