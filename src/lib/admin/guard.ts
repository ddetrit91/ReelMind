import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { ensureBootstrapAdmin } from "@/lib/admin/adminService";

export async function requireAdminApi() {
  await ensureBootstrapAdmin();
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "admin") {
    return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, error: null };
}
