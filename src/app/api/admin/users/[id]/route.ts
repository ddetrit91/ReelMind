import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/guard";
import { deleteUser } from "@/lib/admin/adminService";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAdminApi();
  if (error || !user) return error;
  const { id } = await context.params;
  const result = await deleteUser(id, user.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
