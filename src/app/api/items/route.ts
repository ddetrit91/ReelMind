import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { listItems } from "@/lib/data/items";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const base = await listItems(user.id, category || undefined);
  const { searchItems } = await import("@/lib/search/item-search");
  const items = await searchItems(base, q);
  return NextResponse.json({ items });
}
