import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { cache } from "react";

import { SESSION_COOKIE } from "@/lib/auth/constants";
import { getDb } from "@/lib/db/client";
import { activityLogs, sessions, users } from "@/lib/db/schema";
import { getRequestMeta } from "@/lib/request-meta";
import { getSettings } from "@/lib/settings";

export { SESSION_COOKIE };
const SESSION_DAYS = 30;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
};

export async function createSession(userId: string): Promise<string> {
  const db = getDb();
  const id = randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({
    id,
    userId,
    expiresAt: expires.toISOString(),
    createdAt: now.toISOString(),
  });

  await db
    .update(users)
    .set({ lastActiveAt: now.toISOString() })
    .where(eq(users.id, userId));

  try {
    const meta = await getRequestMeta();
    await db.insert(activityLogs).values({
      id: randomUUID(),
      userId,
      ip: meta.ip,
      city: meta.city,
      userAgent: meta.userAgent,
      createdAt: now.toISOString(),
    });
  } catch {
    // best-effort
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });

  return id;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (id) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.id, id));
  }
  store.delete(SESSION_COOKIE);
}

/** Deduped per request — avoid repeated session joins on the same RSC render. */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  await connection();
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (!id) return null;

  const db = getDb();
  const rows = await db
    .select({
      sessionExpires: sessions.expiresAt,
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (new Date(row.sessionExpires).getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role === "admin" ? "admin" : "user",
  };
});

export async function requireUser(nextPath?: string): Promise<AuthUser> {
  const needMaintenanceCheck =
    nextPath !== "/maintenance" && !nextPath?.startsWith("/admin");

  const [user, settings] = await Promise.all([
    getCurrentUser(),
    needMaintenanceCheck ? getSettings() : Promise.resolve(null),
  ]);

  if (!user) {
    const suffix = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${suffix}`);
  }

  if (settings?.maintenanceMode && user.role !== "admin") {
    redirect("/maintenance");
  }

  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser("/admin");
  if (user.role !== "admin") {
    redirect("/");
  }
  return user;
}
