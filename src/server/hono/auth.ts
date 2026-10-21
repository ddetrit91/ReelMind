import type { Context, Next } from "hono";

import { ensureBootstrapAdmin } from "@/lib/admin/adminService";
import type { AuthUser } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/session";

export type ApiEnv = {
  Variables: {
    user: AuthUser;
  };
};

export async function requireUserMw(c: Context<ApiEnv>, next: Next) {
  const user = await getCurrentUser();
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("user", user);
  await next();
}

export async function requireAdminMw(c: Context<ApiEnv>, next: Next) {
  await ensureBootstrapAdmin();
  const user = await getCurrentUser();
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (user.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }
  c.set("user", user);
  await next();
}
