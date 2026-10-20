import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/admin/guard";
import { getSettings, updateSettings } from "@/lib/admin/adminService";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;
  return NextResponse.json(await getSettings());
}

const schema = z.object({
  allowRegistration: z.boolean(),
  maintenanceMode: z.boolean(),
});

export async function PATCH(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Некорректные настройки" }, { status: 400 });
  }
  return NextResponse.json(await updateSettings(body));
}
