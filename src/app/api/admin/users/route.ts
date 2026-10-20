import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApi } from "@/lib/admin/guard";
import { createAdminUser, listAdminUsers } from "@/lib/admin/adminService";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;
  const users = await listAdminUsers();
  return NextResponse.json({ users });
}

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(["user", "admin"]),
});

export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;
  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Проверьте поля: email, имя, пароль от 6 символов" }, { status: 400 });
  }
  const result = await createAdminUser(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ id: result.id });
}
