import { Hono } from "hono";
import { z } from "zod";

import {
  createAdminUser,
  deleteUser,
  getAdminActivity,
  getAdminStats,
  getSettings,
  listAdminUsers,
  resetUserPassword,
  updateSettings,
  updateUserRole,
} from "@/lib/admin/adminService";
import type { ApiEnv } from "@/server/hono/auth";
import { requireAdminMw } from "@/server/hono/auth";

const admin = new Hono<ApiEnv>();

admin.use("*", requireAdminMw);

admin.get("/stats", async (c) => c.json(await getAdminStats()));
admin.get("/activity", async (c) => c.json({ logs: await getAdminActivity() }));
admin.get("/settings", async (c) => c.json(await getSettings()));

const settingsSchema = z.object({
  allowRegistration: z.boolean(),
  maintenanceMode: z.boolean(),
});

admin.patch("/settings", async (c) => {
  let body: z.infer<typeof settingsSchema>;
  try {
    body = settingsSchema.parse(await c.req.json());
  } catch {
    return c.json({ error: "Некорректные настройки" }, 400);
  }
  return c.json(await updateSettings(body));
});

admin.get("/users", async (c) => c.json({ users: await listAdminUsers() }));

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(["user", "admin"]),
});

admin.post("/users", async (c) => {
  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await c.req.json());
  } catch {
    return c.json({ error: "Проверьте поля: email, имя, пароль от 6 символов" }, 400);
  }
  const result = await createAdminUser(body);
  if (!result.ok) return c.json({ error: result.error }, 400);
  return c.json({ id: result.id });
});

admin.delete("/users/:id", async (c) => {
  const adminUser = c.get("user");
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Not found" }, 404);
  const result = await deleteUser(id, adminUser.id);
  if (!result.ok) return c.json({ error: result.error }, 400);
  return c.json({ ok: true });
});

const roleSchema = z.object({ role: z.enum(["user", "admin"]) });

admin.put("/users/:id/role", async (c) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Not found" }, 404);
  let body: z.infer<typeof roleSchema>;
  try {
    body = roleSchema.parse(await c.req.json());
  } catch {
    return c.json({ error: "Некорректная роль" }, 400);
  }
  const result = await updateUserRole(id, body.role);
  if (!result.ok) return c.json({ error: result.error }, 400);
  return c.json({ ok: true });
});

const passwordSchema = z.object({ password: z.string().min(6) });

admin.post("/users/:id/reset-password", async (c) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Not found" }, 404);
  let body: z.infer<typeof passwordSchema>;
  try {
    body = passwordSchema.parse(await c.req.json());
  } catch {
    return c.json({ error: "Пароль должен быть не короче 6 символов" }, 400);
  }
  const result = await resetUserPassword(id, body.password);
  if (!result.ok) return c.json({ error: result.error }, 400);
  return c.json({ ok: true });
});

export { admin };
