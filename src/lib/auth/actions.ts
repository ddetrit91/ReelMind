"use server";

import { count, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

import { ensureEnvAdminFromEnv } from "@/lib/admin/adminService";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { clearDemoItemsForUser } from "@/lib/demo/ensure-demo-items";
import { getSettings } from "@/lib/settings";

function safeNextPath(raw: FormDataEntryValue | null): string {
  const value = String(raw ?? "").trim();
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function registerAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  if (name.length < 2) {
    return { error: "Укажите имя — минимум 2 символа" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Введите корректный email" };
  }
  if (password.length < 8) {
    return { error: "Пароль должен быть не короче 8 символов" };
  }

  const settings = await getSettings();
  if (!settings.allowRegistration) {
    return { error: "Регистрация временно закрыта. Попросите доступ у администратора." };
  }

  const db = getDb();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) {
    return { error: "Этот email уже зарегистрирован. Войдите в аккаунт." };
  }

  const [adminRow] = await db.select({ n: count() }).from(users).where(eq(users.role, "admin"));
  const role = (adminRow?.n ?? 0) === 0 ? "admin" : "user";

  const id = randomUUID();
  await db.insert(users).values({
    id,
    email,
    name,
    role,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  });

  await createSession(id);
  redirect(next);
}

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  await ensureEnvAdminFromEnv();

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  if (!email || !password) {
    return { error: "Введите email и пароль" };
  }

  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Неверный email или пароль" };
  }

  await createSession(user.id);
  // Drop seeded demos once on login (not on every catalog click).
  void clearDemoItemsForUser(user.id).catch(() => undefined);
  redirect(next);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function redirectIfAuthenticated(next = "/") {
  const user = await getCurrentUser();
  if (user) redirect(next);
}
