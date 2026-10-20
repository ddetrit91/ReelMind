import { count, desc, eq, gte, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

import { hashPassword } from "@/lib/auth/password";
import { getDb } from "@/lib/db/client";
import { activityLogs, items, users } from "@/lib/db/schema";
import {
  getSettings,
  setSetting,
  SETTING_ALLOW_REGISTRATION,
  SETTING_MAINTENANCE,
} from "@/lib/settings";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  itemCount: number;
  createdAt: string;
  lastActiveAt: string | null;
};

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function lastDays(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      lastActiveAt: users.lastActiveAt,
      itemCount: sql<number>`count(${items.id})`.mapWith(Number),
    })
    .from(users)
    .leftJoin(items, eq(items.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt));

  return rows.map((row) => ({
    ...row,
    role: row.role === "admin" ? "admin" : "user",
  }));
}

export async function createAdminUser(input: {
  email: string;
  password: string;
  name: string;
  role: "user" | "admin";
}) {
  const email = input.email.trim().toLowerCase();
  const db = getDb();
  const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (exists[0]) {
    return { ok: false as const, error: "Email уже занят" };
  }

  const id = randomUUID();
  await db.insert(users).values({
    id,
    email,
    name: input.name.trim(),
    role: input.role,
    passwordHash: await hashPassword(input.password),
    createdAt: new Date().toISOString(),
  });
  return { ok: true as const, id };
}

export async function countAdmins() {
  const db = getDb();
  const rows = await db.select({ n: count() }).from(users).where(eq(users.role, "admin"));
  return rows[0]?.n ?? 0;
}

export async function updateUserRole(id: string, role: "user" | "admin") {
  const db = getDb();
  const current = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!current[0]) return { ok: false as const, error: "Пользователь не найден" };

  if (current[0].role === "admin" && role === "user") {
    const admins = await countAdmins();
    if (admins <= 1) {
      return { ok: false as const, error: "Нельзя снять роль с последнего администратора" };
    }
  }

  await db.update(users).set({ role }).where(eq(users.id, id));
  return { ok: true as const };
}

export async function resetUserPassword(id: string, password: string) {
  const db = getDb();
  const current = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
  if (!current[0]) return { ok: false as const, error: "Пользователь не найден" };
  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, id));
  return { ok: true as const };
}

export async function deleteUser(id: string, actorId: string) {
  if (id === actorId) {
    return { ok: false as const, error: "Нельзя удалить свой аккаунт" };
  }
  const db = getDb();
  const current = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!current[0]) return { ok: false as const, error: "Пользователь не найден" };
  if (current[0].role === "admin" && (await countAdmins()) <= 1) {
    return { ok: false as const, error: "Нельзя удалить последнего администратора" };
  }
  await db.delete(users).where(eq(users.id, id));
  return { ok: true as const };
}

export async function getAdminStats() {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const days = lastDays(14);

  const [totalRow] = await db.select({ n: count() }).from(users);
  const [activeToday] = await db
    .select({ n: count() })
    .from(users)
    .where(gte(users.lastActiveAt, `${today}T00:00:00.000Z`));
  const [itemsToday] = await db
    .select({ n: count() })
    .from(items)
    .where(gte(items.createdAt, `${today}T00:00:00.000Z`));

  const userRows = await db.select({ createdAt: users.createdAt }).from(users);
  const itemRows = await db.select({ createdAt: items.createdAt }).from(items);

  const registrations = days.map((day) => ({
    day,
    count: userRows.filter((row) => dayKey(row.createdAt) === day).length,
  }));
  const saves = days.map((day) => ({
    day,
    count: itemRows.filter((row) => dayKey(row.createdAt) === day).length,
  }));

  return {
    totalUsers: totalRow?.n ?? 0,
    activeToday: activeToday?.n ?? 0,
    itemsToday: itemsToday?.n ?? 0,
    registrations,
    saves,
  };
}

export async function getAdminActivity() {
  const db = getDb();
  const rows = await db
    .select({
      id: activityLogs.id,
      createdAt: activityLogs.createdAt,
      ip: activityLogs.ip,
      city: activityLogs.city,
      userAgent: activityLogs.userAgent,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(activityLogs)
    .innerJoin(users, eq(activityLogs.userId, users.id))
    .orderBy(desc(activityLogs.createdAt))
    .limit(40);

  return rows.map((row) => ({
    ...row,
    role: row.role === "admin" ? "admin" : "user",
  }));
}

export async function updateSettings(input: { allowRegistration: boolean; maintenanceMode: boolean }) {
  await setSetting(SETTING_ALLOW_REGISTRATION, input.allowRegistration);
  await setSetting(SETTING_MAINTENANCE, input.maintenanceMode);
  return getSettings();
}

export { getSettings };

/** Локальный админ из .env.local (ADMIN_EMAIL + ADMIN_PASSWORD). Вызывается при seed. */
export async function ensureEnvAdminFromEnv() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME?.trim() || "Админ ReelMind";

  if (!email || password.length < 8) return;

  const db = getDb();
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  if (existing[0]) {
    await db
      .update(users)
      .set({ passwordHash, role: "admin", name })
      .where(eq(users.id, existing[0].id));
    return;
  }

  await db.insert(users).values({
    id: randomUUID(),
    email,
    name,
    passwordHash,
    role: "admin",
    createdAt: now,
  });
}

export async function ensureBootstrapAdmin() {
  await ensureEnvAdminFromEnv();

  const db = getDb();
  const admins = await countAdmins();
  if (admins > 0) return;
  const first = await db.select({ id: users.id }).from(users).orderBy(users.createdAt).limit(1);
  if (first[0]) {
    await db.update(users).set({ role: "admin" }).where(eq(users.id, first[0].id));
  }
}
