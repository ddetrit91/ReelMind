import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/guard";
import { getAdminStats } from "@/lib/admin/adminService";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;
  return NextResponse.json(await getAdminStats());
}
