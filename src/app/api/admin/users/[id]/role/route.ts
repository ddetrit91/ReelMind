import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/admin/guard";
import { updateUserRole } from "@/lib/admin/adminService";

const schema = z.object({ role: z.enum(["user", "admin"]) });

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdminApi();
  if (error) return error;
  const { id } = await context.params;
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Некорректная роль" }, { status: 400 });
  }
  const result = await updateUserRole(id, body.role);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
