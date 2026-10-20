import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { assertIngestAuthorized } from "@/lib/env";
import { processIngest } from "@/lib/ingest/process-ingest";

const bodySchema = z.object({
  url: z.string().optional(),
  text: z.string().optional(),
  categorySlug: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const secret = request.headers.get("x-ingest-secret");
  if (!user && !assertIngestAuthorized(secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user) {
    return NextResponse.json({ error: "Нужно войти в аккаунт" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await processIngest({ ...body, userId: user.id });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    id: result.id,
    categorySlug: result.categorySlug,
    duplicate: result.duplicate ?? false,
  });
}
